create or replace 
function append_flashcard(_owner_id integer, _deck_id integer,
                          _term_text text, _term_media_id text,
                          _term_media_position text, _definition_text text, 
                          _definition_media_id text, 
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

  perform _update_file_size(_deck_id, 1);

  if _term_media_id is not null or
    _definition_media_id is not null then

    update images
    set links = links + 1
    where id = _term_media_id
    or id = _definition_media_id;
  end if;
  return _id;
end;
$$ language plpgsql;

create or replace
function update_flashcard (_user_id integer, _flashcard_id integer,
                           _term_text text, _term_media_id text,
                           _term_media_position text, _definition_text text, 
                           _definition_media_id text,
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
    update images
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
    update images
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
declare   
  _deck_id  integer;
begin
  select deck_id 
  from flashcards 
  where id = _flashcard_id
  into _deck_id;

  if not found then
		raise exception 'Flashcard with id % not found', _flashcard_id
		using errcode = '22023'; /*invalid_parameter_value*/
  end if;

  with parents as (
    select ancestor_id
    from file_tree
    where descendant_id = _deck_id 
  ),
  lost_percentages as (
    select user_id, status_to_percentage(status) percentage
    from users_flashcards
    where flashcard_id = _flashcard_id
  ),
  update_percentage_0 as (
    update users_files uf
    set 
      percentage = 0,
      rest_percentage = 0
    from files f
    where file_id in (
      select ancestor_id 
      from parents
    ) 
    and f.id = uf.file_id
    and f.size - 1 = 0
  ),
  update_percentage as (
    update users_files uf
    set 
      percentage = 
        (uf.percentage * f.size + uf.rest_percentage - lp.percentage) / (f.size - 1),
      rest_percentage = 
        (uf.percentage * f.size + uf.rest_percentage - lp.percentage) % (f.size - 1)
    from files f
      join users_files uf2 on f.id = uf2.file_id
      join lost_percentages lp on uf2.user_id = lp.user_id 
    where uf.file_id in (
      select ancestor_id 
      from parents
    ) 
    and f.id = uf.file_id
    and f.size - 1 > 0
  )
  update files f
  set size = size - 1
  where f.id in (
    select ancestor_id 
    from parents
  );


	delete from flashcards 
  where id = _flashcard_id;

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

