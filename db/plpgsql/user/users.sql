create or replace function create_user(_name text, _password text, _email text) returns record as $$
declare
	res			record;
	name_already_exists	boolean;
	email_already_exists	boolean;
begin 
	select exists (
		select 1 from users
		where name = _name
	), exists (
		select 1 from users
		where email = _email
	) into name_already_exists, email_already_exists;

	
	if not (name_already_exists or email_already_exists) then
		insert into users (name, password, email, enabled)
			values( _name, _password, _email, false);
		res := (found, name_already_exists, email_already_exists); -- Arguments order must NOT be changed
	else
		res := (false, name_already_exists, email_already_exists);
	end if;


	return res;
	--Impossible to say if the email already exists OR the name already exists
	--insert into users (name, name_display, password, email, enabled)
		--select distinct _real_name, _name_display, _password, _email, false
		--from users
		--where not exists (
			--select 1 from users
			--where name = _real_name or email = _email
		--);

	--return found;
end;
$$ language plpgsql;

create or replace function enable_account(_user_id integer) returns void as $$
declare
	_user_record	record;
	_root_folder_id integer;
begin
	update users
	set enabled = true
	where id = _user_id
	returning name into _user_record;

	select create_file(_user_id, _user_record.name, 'folder', 0) into _root_folder_id;
	perform create_file(_user_id, 'starred', 'folder', _root_folder_id);
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
