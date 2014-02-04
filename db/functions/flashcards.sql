-- TODO return flashcards of all file's decks if the file
-- provided as arguments isn't a deck
create or replace
function get_flashcards (_user_id integer, _file_id integer)
returns table(id integer, owner_id integer, deck_id integer,
              term text, definition text, index integer, state_history text)
as $$
begin
  return query
    select    
      f.id,   
      f.owner_id,   
      f.deck_id,   
      f.term::TEXT,   
      f.definition::TEXT,   
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
                          _term text, _definition text) 
returns integer as $$
declare 
  INITIAL_DISTANCE  integer := 100;
  _id   integer;
begin
  insert into
    flashcards (owner_id, deck_id, term, definition, index) 
  values (
    _owner_id, _deck_id, coalesce(_term, ''), coalesce(_definition, ''),
    (
      select coalesce(max(index), 0) + INITIAL_DISTANCE
      from flashcards
      where deck_id = _deck_id
    )
  )
  returning id into _id;

  return _id;
end;
$$ language plpgsql;

create or replace
function update_flashcard (_user_id integer, _flashcard_id integer,
                           _term text, _definition text)
returns integer as $$
begin
  raise notice 'user_id = %, flashcard_id = %, term = %, definition = %',
                _user_id, _flashcard_id, _term, _definition;

  if _term is not null and _definition is not null then
    update flashcards
    set term = _term, definition = _definition
    where id = _flashcard_id;
  elsif _term is not null then
    update flashcards
    set term = _term
    where id = _flashcard_id;
  elsif _definition is not null then
    update flashcards
    set definition = _definition
    where id = _flashcard_id;
  else
		raise exception 'At least _term or _definition must be different from null'
		using errcode = '22023'; /*invalid_parameter_value*/
  end if;

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
