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
     order by   
       f.index asc ;
end;
$$ language plpgsql;

create or replace 
function create_flashcard(_owner_id integer, _deck_id integer, 
                       _term text, _definition text, 
                       _insert_before_id integer) 
returns integer as $$
declare
  INITIAL_DISTANCE  integer := 100;
	_id	              integer;
  _range	          record;
begin
  -- If _insert_before_id, we assume that the flashcard
  -- must be added after the last flashcard, or at the
  -- index 0 if there is no flashcard yet
	if _insert_before_id is null then
		with max as (
			select coalesce(max(index), 0) pos
			from flashcards
		)
		insert into 
      flashcards (owner_id, deck_id, term, definition, index) 
    values(
			_owner_id, _deck_id, _term, _definition, (select pos + INITIAL_DISTANCE from max)
	  )	
    returning id into _id;
	else
		loop
			with before_index as (
				select index insert_before
				from flashcards
				where id = _insert_before_id
			), after_index as (
				select coalesce(max(index), 0) insert_after
				from flashcards
				where index < (select insert_before from before_index)
			)
			select * 
      from 
        before_index before, 
        after_index after 
      into _range;

			if _range.insert_before - 1 = _range.insert_after then
				update flashcards
				set index = index + INITIAL_DISTANCE
				where index >= _range.insert_before;
			else
				exit;
			end if;
		end loop;

		insert into 
      flashcards (owner_id, deck_id, term, definition, index) 
    values(
			_owner_id, 
      _deck_id, 
      _term, 
      _definition, 
      _range.insert_after + (_range.insert_before - _range.insert_after) / 2
    )
    returning id into _id;
	end if;

	return _id;
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
