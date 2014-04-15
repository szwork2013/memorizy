-- A flashcard state can be '0', '1' or '2'
-- '0' means a correct answer, '1' means no answer 
-- and '2' means a wrong answer
create or replace 
function update_flashcard_status (_user_id integer, 
                                  _flashcard_id integer, 
                                  _last_state char) 
returns void as $$
declare
  _new_history     char(5);
  _old_history     char(5);
  _deck_id         integer;
begin
  if _last_state not in ('0', '1', '2') then 
		raise exception 'Bad state identifier'
		using errcode = '22023'; /*invalid_parameter_value*/
  end if;

  select deck_id from flashcards 
  where id = _flashcard_id 
  into _deck_id;

  if not found then 
    raise exception 'Flashcard does not exist' 
		using errcode = '22023'; /*invalid_parameter_value*/
  end if;

  select state_history 
  from users_flashcards 
  where user_id = _user_id and 
  flashcard_id = _flashcard_id 
  into _old_history;

  if _old_history is null then 
    select '11111' into _old_history; 
  end if;

  raise notice '_old_history = %', _old_history;

  select _last_state || left(_old_history, 4) 
  into _new_history;

  raise notice '_new_history = %', _new_history;

  update users_flashcards 
  set state_history = _new_history 
  where flashcard_id = _flashcard_id and 
  user_id = _user_id;

  insert into users_flashcards (user_id, flashcard_id, state_history) 
  select _user_id, _flashcard_id, _new_history 
  where not exists (
    select 1 from users_flashcards uf 
    where uf.flashcard_id = _flashcard_id and 
    uf.user_id = _user_id 
  );

	perform _update_file_status(_user_id, _deck_id, 
		(select _state_history_to_percentage(_new_history)) -
		(select _state_history_to_percentage(_old_history)));
end;
$$ language plpgsql;

create or replace function _state_history_to_percentage (_state_history char(5)) 
returns integer as $$ 
declare 
  _percentage  integer := 0;
begin
  -- The state '0' means that the answer was correct
  if substr(_state_history, 1, 1) = '0' then 
    _percentage := _percentage + 50;
  end if;
  if substr(_state_history, 2, 1) = '0' then 
    _percentage := _percentage + 30;
  end if;
  if substr(_state_history, 3, 1) = '0' then 
    _percentage := _percentage + 20;
  end if;

  raise notice '% -> %', _state_history, _percentage;
  return _percentage;
end;
$$ language plpgsql;

create or replace function update_flashcard_order (_user_id integer, _file_id integer, _order_id integer)
returns void as $$
begin
  with upsert as (
    update users_files
    set flashcard_order_id = _order_id 
    where user_id = _user_id and 
    file_id = _file_id
    returning *
  )
  insert into users_files (user_id, file_id, flashcard_order_id)
  select _user_id, _file_id, _order_id
  where not exists (
    select 1 from upsert
  );
end;
$$ language plpgsql;

create or replace function update_until_100 (_user_id integer, _file_id integer, _enable boolean)
returns void as $$
begin
  with upsert as (
    update users_files
    set until_100 = _enabled
    where user_id = _user_id and 
    file_id = _file_id
    returning *
  )
  insert into users_files (user_id, file_id, until_100)
  select _user_id, _file_id, _enable
  where not exists (
    select 1 from upsert
  );
end;
$$ language plpgsql;

create or replace function update_show_first (_user_id integer, _file_id integer, 
                                              _side text)
returns void as $$
begin
  with upsert as (
    update users_files
    set show_first = _side 
    where user_id = _user_id and 
    file_id = _file_id
    returning *
  )
  insert into users_files (user_id, file_id, show_first)
  select _user_id, _file_id, _side
  where not exists (
    select 1 from upsert
  );
end;
$$ language plpgsql;

create or replace function update_study_method (_user_id integer, _file_id integer, 
                                              _method text)
returns void as $$
begin
  with upsert as (
    update users_files
    set study_method = _method
    where user_id = _user_id and 
    file_id = _file_id
    returning *
  )
  insert into users_files (user_id, file_id, study_method)
  select _user_id, _file_id, _method
  where not exists (
    select 1 from upsert
  );
end;
$$ language plpgsql;
