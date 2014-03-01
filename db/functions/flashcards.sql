-- TODO return flashcards of all file's decks if the file
-- provided as arguments isn't a deck
create or replace
function get_flashcards (_user_id integer, _file_id integer)
returns table(id integer, owner_id integer, deck_id integer,
              term_text text, term_media_id integer, term_media_position integer, 
              definition_text text, definition_media_id integer,
              definition_media_position integer, index integer, state_history text)
as $$
begin
  return query
    select    
      f.id,   
      f.owner_id,   
      f.deck_id,   
      f.term_text::TEXT,   
      f.term_media_id::INTEGER,   
      f.term_media_position::INTEGER,   
      f.definition_text::TEXT,   
      f.definition_media_id::INTEGER,   
      f.definition_media_position::INTEGER,   
      f.index,   
      coalesce(   
        uf.state_history,    
        '00000'    
      )::TEXT   
    from   
      flashcards f left join users_flashcards uf 
      on f.id = uf.flashcard_id 
      and _user_id = uf.user_id   
    where f.deck_id in (
      select ft.descendant_id
      from file_tree ft
      where ft.ancestor_id = _file_id
    )
    order by   
      f.index asc ;
end;
$$ language plpgsql;

create or replace 
function append_flashcard(_owner_id integer, _deck_id integer,
                          _term_text text, _term_media_id integer,
                          _term_media_position text, _definition_text text, 
                          _definition_media_id integer, 
                          _definition_media_position text)
returns integer as $$
declare 
  INITIAL_DISTANCE  integer := 100;
  _id   integer;
begin
  insert into flashcards (
    owner_id, deck_id, 
    term_text, term_media_id, term_media_position, 
    definition_text, definition_media_id, definition_media_position, 
    index
  ) 
  values (
    _owner_id, _deck_id, 
    _term_text, _term_media_id, _term_media_position,
    _definition_text, _definition_media_id, _definition_media_position,
    (
      select coalesce(max(index), 0) + INITIAL_DISTANCE
      from flashcards
      where deck_id = _deck_id
    )
  )
  returning id into _id;

  if _term_media_id is not null or
    _definition_media_id is not null then

    update media
    set links = links + 1
    where id = _term_media_id
    or id = _definition_media_id;
  end if;
  return _id;
end;
$$ language plpgsql;

create or replace
function update_flashcard (_user_id integer, _flashcard_id integer,
                           _term_text text, _term_media_id integer,
                           _term_media_position text, _definition_text text, 
                           _definition_media_id integer,
                           _definition_media_position text)
returns integer as $$
declare
  query     text;
  fields    text[];
begin
  if _term_media_id is not null or
    _definition_media_id is not null then

    -- Decrements old media links
    with media_id as (
      select 
        term_media_id,
        definition_media_id
      from flashcards
      where id = _flashcard_id
    )
    update media
    set links = links - 1
    where (
      _term_media_id is not null and id = (
        select term_media_id
        from media_id
      )
    ) or
    (
      _definition_media_id is not null and id = (
        select definition_media_id
        from media_id 
      )
    );

    -- increments new ones
    update media
    set links = links + 1
    where id = _term_media_id
    or id = _definition_media_id;

  end if;

  query := 'update flashcards set ';
  if _term_text is not null then
    fields = array_append(fields, quote_ident('term_text') || '=' 
      || quote_literal(_term_text));
  end if;
  if _term_media_id is not null then
    fields = array_append(fields, quote_ident('term_media_id') || '=' 
      || quote_literal(_term_media_id));
  end if;
  if _term_media_position is not null then
    fields = array_append(fields, quote_ident('term_media_position') || '=' 
      || quote_literal(_term_media_position));
  end if;
  if _definition_text is not null then
    fields = array_append(fields, quote_ident('definition_text') || '=' 
      || quote_literal(_definition_text));
  end if;
  if _definition_media_id is not null then
    fields = array_append(fields, quote_ident('definition_media_id') || '=' 
      || quote_literal(_definition_media_id));
  end if;
  if _definition_media_position is not null then
    fields = array_append(fields, quote_ident('definition_media_position') || '=' 
      || quote_literal(_definition_media_position));
  end if;

  if array_length(fields, 1) is null then -- array_length returns null on an empty array
		raise exception 'At least one field must be different from null'
		using errcode = '22023'; /*invalid_parameter_value*/
  end if;

  query := concat(query, array_to_string(fields, ','), 
    ' where id = ' || _flashcard_id);

  raise notice 'after: query = %', query;

  execute query;

  return _flashcard_id;
end;
$$ language plpgsql;

create or replace 
function delete_flashcard (_user_id integer, _flashcard_id integer) 
returns void as $$
declare   _deck_id  integer;
begin
  select deck_id 
  from flashcards 
  where id = _flashcard_id
  into _deck_id;

  -- TODO Fix dec_number_of_cards
	-- perform dec_number_of_cards(_deck_id, _flashcard_id);

	delete from flashcards 
  where id = _flashcard_id;

  if not found then
		raise exception 'Flashcard with id % not found', _flashcard_id
		using errcode = '22023'; /*invalid_parameter_value*/
  end if;
end;
$$ language plpgsql;

create or replace
function create_media_link (_sha256 char(65))
returns integer as $$
declare
  _id integer;
begin
  with s as (
    select id from media
    where sha256 = _sha256
  ),
  i as (
    insert into media (sha256, links, type_id)
    select _sha256, 0, 1
    where not exists (
      select 1 from s
    )
    returning id
  )
  select id from s
  union all
  select id from i
  into _id;

  raise notice 'id = %', _id;

  return _id;
end;
$$ language plpgsql;

create or replace 
function update_flashcard_status (_user_id integer, 
                                  _flashcard_id integer, 
                                  _last_state char) 
returns void as $$
declare
	state_histories	record;
begin
	select update_flashcard_state_history( 
		user_id, 
		flashcard_id, 
		quote_literal(last_state) 
  ) 
  into state_histories;

	perform update_file_status(user_id, tmp_status.deck_id, 
		(select percentage from state_hist_to_percentage where state_hist = state_histories.new) -
		(select percentage from state_hist_to_percentage where state_hist = state_histories.old));
end;
$$ language plpgsql;
