create or replace function create_user(_username_display text, _real_username text, _password text, _email text) returns boolean as $$
begin 
	insert into users (username, username_display, password, email, enabled)
		select distinct _real_username, _username_display, _password, _email, false
		from users
		where not exists (
			select 1 from users
			where username = _real_username or email = _email
		);

	return found;
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

	perform add_file(_user_id, _user_record.username, _user_record.username_display, 1, null);
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

create or replace function get_file_id(_path text[]) returns integer as $$
declare
	_parent_id	integer := 0;
	_folder		text;
begin
	foreach _folder in array _path                                                                                                     
	loop                                                                                                                               
		select descendant_id into _parent_id                                                                                       
		from files_tree ft                                                                                                         
		where ft.ancestor_id = _parent_id                                                                                          
		and dist = 1                                                                                                               
		and _folder = (                                                                                                            
			select name                                                                                                        
			from files                                                                                                         
			where id = ft.descendant_id                                                                                        
		);                                                                                                                         

		if not found then                                                                                                          
			return -1;                                                                                                            
		end if;                                                                                                                    
	end loop;                                                                                                                          

	return _parent_id;                                                                                                                                            
end;
$$ language plpgsql;
