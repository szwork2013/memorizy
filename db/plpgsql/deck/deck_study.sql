-- A flashcard state can be '0', '1' or '2'
-- '0' means a correct answer, '1' means no answer 
-- and '2' means a wrong answer
create or replace 
function update_flashcard_status (_user_id integer, 
                                  _flashcard_id integer, 
                                  _correct boolean) 
returns void as $$
declare
  _deck_id         integer;
begin
  select deck_id from flashcards 
  where id = _flashcard_id 
  into _deck_id;

  if not found then 
    raise exception 'Flashcard does not exist' 
		using errcode = '22023'; /*invalid_parameter_value*/
  end if;

  if _correct = false then 
    update users_flashcards 
    set status = -1
    where flashcard_id = _flashcard_id and 
    user_id = _user_id;
  else 
    update users_flashcards 
    set status = (
      case 
        when status = -1 then 1
        when status < 3  then status + 1
        else status 
      end
    )
    where flashcard_id = _flashcard_id and 
    user_id = _user_id;
  end if;

  insert into users_flashcards (user_id, flashcard_id, status) 
  select 
    _user_id, 
    _flashcard_id, 
    (case _correct when true then 1 when false then -1 end)
  where not exists (
    select 1 from users_flashcards uf 
    where uf.flashcard_id = _flashcard_id and 
    uf.user_id = _user_id 
  );

	-- perform _update_file_status(_user_id, _deck_id, 
		-- (select _state_history_to_percentage(_new_history)) -
		-- (select _state_history_to_percentage(_old_history)));
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
