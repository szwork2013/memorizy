create or replace function create_user(_name text, _password text, _email text) returns record as $$
declare
	res			record;
  salt    text := 'secret key !';
	name_already_exists	boolean;
	email_already_exists	boolean;
  _user_id integer;
  _hash    text;
begin 
	select exists (
		select 1 from users
		where name = _name
	), exists (
		select 1 from users
		where email = _email
	) into name_already_exists, email_already_exists;
	
	if not (name_already_exists or email_already_exists) then
    with i as (
      insert into users (name, password, email, hash, enabled)
        values( _name, crypt(_password, gen_salt('bf')), _email, md5(salt || _name || _email), false)
        returning id, hash
    )
    select id, hash into _user_id, _hash from i;

	end if;

  res := (found, _user_id, _hash, name_already_exists, email_already_exists); -- Arguments order must NOT be changed

	return res;
end;
$$ language plpgsql;

create or replace function enable_account(_hash text) returns void as $$
declare
	_user_record	record;
	_root_folder_id integer;
begin
	update users
	set enabled = true
	where hash = _hash
	returning id, name into _user_record;

	select create_file(_user_record.id, _user_record.name, 'folder', 0) into _root_folder_id;
	perform create_file(_user_record.id, 'starred', 'folder', _root_folder_id);
end;
$$ language plpgsql;

create or replace function get_user_id(_name text) returns integer as $$
declare
	_user_id	integer;
begin	
	select id into _user_id
	from users
	where name = _name;

	return _user_id;
end;
$$ language plpgsql;

create or replace function update_profile(_user_id integer, _profile json) returns void as $$
declare
  query text;
  fields text[];
begin
  query := 'update users set ';
  if (_profile->>'name') is not null then
    fields = array_append(fields, quote_ident('name') || '=' 
      || quote_literal(_profile::json->>'name'));
  end if;
  if (_profile->>'email') is not null then
    fields = array_append(fields, quote_ident('email') || '=' 
      || quote_literal(_profile->>'email'));
  end if;

  if array_length(fields, 1) is null then -- array_length returns null on an empty array
		raise exception 'At least one field must be different from null'
		using errcode = '22023'; /*invalid_parameter_value*/
  end if;

  query := concat(query, array_to_string(fields, ','), 
    ' where id = ' || _user_id);

  execute query;
end;
$$ language plpgsql;

create or replace 
function update_password(_user_id integer, _old_password text, _new_password text) 
returns void as $$
begin
  update users
  set password = crypt(_new_password, gen_salt('bf'))
  where id = _user_id and password = crypt(_old_password, password);   

  if not found then
    raise exception 'User id or old password is invalid'
    using errcode = '28P01'; -- invalid password
  end if;
end;
$$ language plpgsql;

