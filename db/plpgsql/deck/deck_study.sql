create or replace
function update_status (_user_id integer, _status json)
returns void as $$
begin
  with per_flashcard as (  
    select 
      fi.id as deck_id,
      s.key::integer as flashcard_id, 
      s.value::integer as new_status,
      coalesce(uf.status, 0) as old_status,
      (status_to_percentage(s.value::integer) - status_to_percentage(coalesce(uf.status, 0)))::integer as percentage_difference 
    from json_each_text(_status) s
      left join users_flashcards uf on s.key::integer = uf.flashcard_id 
      join flashcards f on f.id = s.key::integer 
      join files fi on fi.id = f.deck_id
    where uf.user_id = _user_id
    or uf.user_id is null
  ), per_deck as (
    select 
      p.deck_id, 
      sum(p.percentage_difference)::integer as percentage_difference 
    from per_flashcard p
    group by p.deck_id
  ), per_file as ( 
    select 
      ft.ancestor_id as file_id,
      sum(p.percentage_difference)::integer as percentage_difference 
    from per_deck p 
      join file_tree ft on p.deck_id = ft.descendant_id
    group by ft.ancestor_id
  ), update_files_status as (
    update users_files uf
    set 
      percentage = 
        (percentage * f.size + rest_percentage + p.percentage_difference::integer) / f.size,
      rest_percentage = 
        (percentage * f.size + rest_percentage +  p.percentage_difference::integer) % f.size,
      next_session = (
        case 
          when last_session < CURRENT_DATE then CURRENT_DATE + (CURRENT_DATE - last_session) * 2
          else CURRENT_DATE + 1
        end
      ),
      last_session = CURRENT_DATE
    from files f 
      join per_file p on f.id = p.file_id
    where uf.file_id = p.file_id
    and uf.user_id = _user_id
  ), insert_file_status as (
    insert into users_files (
      user_id, 
      file_id, 
      percentage, 
      rest_percentage
    ) 
    select 
      _user_id, 
      f.id, 
      p.percentage_difference::integer / f.size, 
      p.percentage_difference::integer % f.size
    from files f 
      join per_file p on f.id = p.file_id
    where not exists (
      select 1 from users_files uf
      where uf.user_id = _user_id and 
      file_id = f.id
    )
  ), update_flashcard_status as (
    update users_flashcards uf1
    set status = p.new_status 
    from per_flashcard p 
      join users_flashcards uf2 on p.flashcard_id = uf2.flashcard_id
    where uf1.flashcard_id = p.flashcard_id
    and uf1.user_id = _user_id
  )
  insert into users_flashcards (user_id, flashcard_id, status) 
  select 
    _user_id, 
    p.flashcard_id,
    p.new_status
  from per_flashcard p
  where not exists (
    select 1 from users_flashcards uf 
    where uf.flashcard_id = p.flashcard_id and 
    uf.user_id = _user_id 
  );
end;
$$ language plpgsql;

create or replace function status_to_percentage (_status integer) 
returns integer as $$
begin
  return case _status 
    when -1 then 0
    when 0  then 0
    when 1  then 50
    when 2  then 80
    when 3  then 100
    else    0
  end;
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
