create or replace function create_user(_username_display text, _real_username text, _password text, _email text) returns record as $$
declare
	res			record;
	username_already_exists	boolean;
	email_already_exists	boolean;
begin 
	select exists (
		select 1 from users
		where username = _real_username
	), exists (
		select 1 from users
		where email = _email
	) into username_already_exists, email_already_exists;

	
	if not (username_already_exists or email_already_exists) then
		insert into users (username, username_display, password, email, enabled)
			values( _real_username, _username_display, _password, _email, false);
		res := (found, username_already_exists, email_already_exists); -- Arguments order must NOT be changed
	else
		res := (false, username_already_exists, email_already_exists);
	end if;


	return res;
	--Impossible to say if the email already exists OR the username already exists
	--insert into users (username, username_display, password, email, enabled)
		--select distinct _real_username, _username_display, _password, _email, false
		--from users
		--where not exists (
			--select 1 from users
			--where username = _real_username or email = _email
		--);

	--return found;
end;
$$ language plpgsql;

create or replace function enable_account(_user_id integer) returns void as $$
declare
	_user_record	record;
begin
	update users
	set enabled = true
	where id = _user_id
	returning username, username_display into _user_record;

	perform add_file(_user_id, _user_record.username, _user_record.username_display, 1, 0);
end;
$$ language plpgsql;

create or replace function get_user_id(_username text) returns integer as $$
declare
	_user_id	integer;
begin	
	select id into _user_id
	from users
	where username = _username;

	return _user_id;
end;
$$ language plpgsql;
