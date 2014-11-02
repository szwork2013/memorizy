create or replace
function get_groups_root_id () returns integer as $$
declare 
  _id integer;
begin
  with root_folders as (
    select * from file_tree ft join files f on ft.descendant_id = f.id
    where ancestor_id = 0 and dist = 1
  )
  select rf.id into _id from root_folders rf where rf.name = 'groups';
  
  return _id;
end;
$$ language plpgsql;

create or replace
function get_group_id (_group_name text)
returns integer as $$
declare _group_id integer;
begin
  select id into _group_id from files f
  where f.name = _group_name
  and exists(
    select 1 from file_tree
    where ancestor_id = get_groups_root_id()
    and descendant_id = f.id
    and dist = 1
  );

  if not found then
    raise exception 'Group not found';
  end if;

  return _group_id;
end;
$$ language plpgsql;

create or replace 
function get_group_requests (_user_id integer, _group_name text) 
returns table (user_id integer, user_name text) as $$
declare _group_id integer;
begin
  if is_group_admin(_user_id, get_group_id(_group_name)) is not true then
    raise exception 'You must be admin of the group to see its requests';
  end if;

  return query
    select gp.user_id, u.name::text 
    from group_requests gp join users u on gp.user_id = u.id
    where gp.group_id = get_group_id(_group_name);
end;
$$ language plpgsql;
  
create or replace
function get_group_members (_user_id integer, _group_name text) 
returns table (user_id integer, user_name text) as $$
declare _group_id integer;
begin
  return query
    select ug.user_id, u.name::text 
    from users_groups ug join users u on ug.user_id = u.id
    where group_id = get_group_id(_group_name);
end;
$$ language plpgsql;

create or replace function get_invitations (_user_id integer)
returns table (group_id integer, group_name text, 
               inviting_user_id integer, inviting_user_name text)
as $$
begin
  return query
    select f.id, f.name::text, u.id, u.name::text
    from group_invitations gi
      join files f on f.id = gi.group_id
      join users u on u.id = gi.inviting_user_id 
    where gi.invited_user_id = _user_id;
end;
$$ language plpgsql;

-- create or replace
-- function get_group_notifications (_user_id integer, _group_name text) 
-- returns table (user_id integer, user_name text) as $$
-- declare _group_id integer;
-- begin
  -- return query
    -- select gm.user_id, u.name 
    -- from group_notifications gm join users u on gm.user_id = u.id
    -- where group_id = get_group_id(_group_name);
-- end;
-- $$ language plpgsql;

create or replace
function invite (_inviting_user_id integer, _group_name text, 
                 _invited_user_id integer)
returns void as $$
begin
  insert into group_invitations (inviting_user_id, group_id, invited_user_id)
  select _inviting_user_id, get_group_id(_group_name), _invited_user_id
  where exists (
    select 1 from users_groups ug
    where user_id = _inviting_user_id
    and group_id = get_group_id(_group_name)
  );

  if not found then
    raise exception 'The inviting user does not have the privilege to invite other users in this group';
  end if;
end;
$$ language plpgsql;

create or replace
function accept_invitation(_user_id integer, _group_name text)
returns void as $$ 
begin
  insert into users_groups (user_id, group_id)
  select _user_id, get_group_id(_group_name)
  where exists (
    select 1 from group_invitations
    where invited_user_id = _user_id
    and group_id = get_group_id(_group_name)
  );

  if not found then
    raise exception 'The invitation does not exist';
  end if;

  delete from group_invitations
  where invited_user_id = _user_id
  and group_id = get_group_id(_group_name);
end;
$$ language plpgsql;

create or replace
function decline_invitation (_user_id integer, _group_name text)
returns void as $$
begin
  delete from group_invitations
  where invited_user_id = _user_id
  and group_id = get_group_id(_group_name);

  if not found then
    raise exception 'The invitation does not exist';
  end if;

end;
$$ language plpgsql;

create or replace
function request (_user_id integer, _group_name text)
returns void as $$
begin
  insert into group_requests(group_id, user_id)
  values (get_group_id(_group_name), _user_id);
end;
$$ language plpgsql;

create or replace
function kick (_kicking_user_id integer, _group_name text, 
               _kicked_user_id integer)
returns void as $$
begin
  delete from users_groups
  where user_id = _kicked_user_id
  and group_id = get_group_id(_group_name)
  and exists (
    select 1 from users_groups ug
    where user_id = _kicking_user_id
    and group_id = get_group_id(_group_name)
  );

  if not found then
    raise exception 'The kicking user does not have the privilege to kick other members of this group or the kicked user does not belong to the group';
  end if;
end;
$$ language plpgsql;

create or replace
function set_visibility (_user_id integer, _group_name text, _visibility text)
returns void as $$
begin
  update files
  set visibility = _visibility
  where id = get_group_id(_group_name)
  and is_group_admin (_user_id, get_group_id(_group_name)) is true;
end;
$$ language plpgsql;

create or replace function leave_group (_user_id integer, _group_name text)
returns void as $$
begin
  delete from users_groups
  where user_id = _user_id
  and group_id = get_group_id(_group_name);

  if not found then
    raise exception 'The user does not exist or does not belong to the group';
  end if;
end;
$$ language plpgsql;

-- TODO
create or replace function is_group_admin (_user_id integer, _group_id integer)
returns boolean as $$
begin
  return true;
end;
$$ language plpgsql;

create or replace 
function f_check_group_id () returns trigger as $$
begin
  if not exists (
    select 1 from file_tree
    where ancestor_id = get_groups_root_id()
    and descendant_id = new.group_id
    and dist = 1
  ) then 
    raise exception 'Invalid group id';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists check_group_id on users_groups;
create trigger check_group_id before insert or update of group_id
on users_groups for each row
execute procedure f_check_group_id();

drop trigger if exists check_group_id on group_requests;
create trigger check_group_id before insert or update of group_id
on group_requests for each row
execute procedure f_check_group_id();
