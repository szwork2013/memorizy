--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: web; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA web;


ALTER SCHEMA web OWNER TO postgres;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- Name: pgtap; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA public;


--
-- Name: EXTENSION pgtap; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgtap IS 'Unit testing for PostgreSQL';


SET search_path = public, pg_catalog;

--
-- Name: _state_history_to_percentage(character); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _state_history_to_percentage(_state_history character) RETURNS integer
    LANGUAGE plpgsql
    AS $$ 
declare 
  _percentage  integer := 0;
begin
  -- The state '0' means that the answer was correct
  if substr(_state_history, 5, 1) = '0' then 
    _percentage := _percentage + 50;
  end if;
  if substr(_state_history, 4, 1) = '0' then 
    _percentage := _percentage + 30;
  end if;
  if substr(_state_history, 3, 1) = '0' then 
    _percentage := _percentage + 20;
  end if;

  raise notice '% -> %', _state_history, _percentage;
  return _percentage;
end;
$$;


ALTER FUNCTION public._state_history_to_percentage(_state_history character) OWNER TO postgres;

--
-- Name: _update_file_size(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _update_file_size(_file_id integer, _size_diff integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare   
  _new_size   integer;
begin 
  select f.size + _size_diff 
  from files f 
  where f.id = _file_id 
  into _new_size;

  with parents as (
    select ancestor_id
    from file_tree
    where descendant_id = _file_id 
  ),
  update_percentage_0 as (
    update users_files uf
    set 
      percentage = 0,
      rest_percentage = 0
    from files f
    where file_id in (
      select ancestor_id 
      from parents
    ) 
    and f.id = uf.file_id
    and f.size + _size_diff = 0
  ),
  update_percentage as (
    update users_files uf
    set 
      percentage = 
        (percentage * f.size + rest_percentage) / (f.size + _size_diff),
      rest_percentage = 
        (percentage * f.size + rest_percentage) % (f.size + _size_diff)
    from files f
    where file_id in (
      select ancestor_id 
      from parents
    ) 
    and f.id = uf.file_id
    and f.size + _size_diff > 0
  )
  update files f
  set size = size + _size_diff 
  where f.id in (
    select ancestor_id 
    from parents
  );

end;
$$;


ALTER FUNCTION public._update_file_size(_file_id integer, _size_diff integer) OWNER TO postgres;

--
-- Name: _update_file_status(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION _update_file_status(_user_id integer, _file_id integer, _percentage_difference integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare 
begin
  -- Upsert percentages of the file and all of its parents 
  with parents as (
    select ancestor_id
    from file_tree
    where descendant_id = _file_id 
  ),
  u as (
    update users_files uf
    set 
      percentage = 
        (percentage * f.size + rest_percentage + _percentage_difference) / f.size,
      rest_percentage = 
        (percentage * f.size + rest_percentage +  _percentage_difference) % f.size
    from files f
    where file_id in (
      select ancestor_id 
      from parents
    ) 
    and uf.user_id = _user_id
    and f.id = uf.file_id
  )
  insert into users_files (
    user_id, 
    file_id, 
    percentage, 
    rest_percentage
  ) 
  select 
    _user_id, 
    f.id, 
    _percentage_difference / f.size, 
    _percentage_difference % f.size
  from files f 
  where f.id in (
    select ancestor_id 
    from parents 
  )
  and not exists (
    select 1 from users_files 
    where user_id = _user_id and 
    file_id = _file_id
  );
end;
$$;


ALTER FUNCTION public._update_file_status(_user_id integer, _file_id integer, _percentage_difference integer) OWNER TO postgres;

--
-- Name: append_flashcard(integer, integer, text, integer, text, text, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION append_flashcard(_owner_id integer, _deck_id integer, _term_text text, _term_media_id integer, _term_media_position text, _definition_text text, _definition_media_id integer, _definition_media_position text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare 
  INITIAL_DISTANCE  integer := 100;
  _id   integer;
begin
  insert into flashcards (
    owner_id, deck_id, 
    term_text, term_media_id, term_media_position, 
    definition_text, definition_media_id, definition_media_position, 
    index
  ) 
  values (
    _owner_id, _deck_id, 
    _term_text, _term_media_id, _term_media_position,
    _definition_text, _definition_media_id, _definition_media_position,
    (
      select coalesce(max(index), 0) + INITIAL_DISTANCE
      from flashcards
      where deck_id = _deck_id
    )
  )
  returning id into _id;

  perform _update_file_size(_deck_id, 1);

  if _term_media_id is not null or
    _definition_media_id is not null then

    update media
    set links = links + 1
    where id = _term_media_id
    or id = _definition_media_id;
  end if;
  return _id;
end;
$$;


ALTER FUNCTION public.append_flashcard(_owner_id integer, _deck_id integer, _term_text text, _term_media_id integer, _term_media_position text, _definition_text text, _definition_media_id integer, _definition_media_position text) OWNER TO postgres;

--
-- Name: copy_file(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION copy_file(_user_id integer, _file_id integer, _parent_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare
  _cpt      integer;
  _new_subtree_head  integer;
begin
  select count(*) from files f
  where f.id = _file_id or f.id = _parent_id
  into _cpt;

  if _cpt <> 2 then
    raise exception 'File with id % or % not found', 
        _file_id, _parent_id
        using errcode = '22023'; --invalid_parameter_value
  end if;

  perform 1 from files
  where id = _file_id
  and name in (
    select name from files
    where id in (
      select descendant_id from file_tree ft
      where ft.ancestor_id = _parent_id
      and ft.dist = 1
    )
  );

  if found then
    raise exception 'A file with the same name and parent id(=%) already exists', 
    _parent_id
    using errcode = '42710'; /*duplicate_object*/
  end if;

  with file_copies as(
    -- Returns copies id
    insert into files (owner_id, name, size, type, copy_of)
    select _user_id, f.name, f.size, f.type, f.id from files f
    where f.id in(
      select ft.descendant_id from file_tree ft
      where ft.ancestor_id = _file_id
    )
    returning * 
  ),
  hierarchy_subtree as(
    -- Link copies to make a new subtree
    insert into file_tree(ancestor_id, descendant_id, dist)
    select c1.id, c2.id, dist
    from file_tree ft join file_copies c1 on ft.ancestor_id = c1.copy_of
    join file_copies c2 on ft.descendant_id = c2.copy_of
    where ft.ancestor_id in (select copy_of from file_copies)
    and ft.descendant_id in (select copy_of from file_copies)
  ),
  flashcard_copies as (
    -- Copy flashcards to copied decks
    insert into flashcards(
      owner_id, 
      deck_id, 
      index, 
      term_text, 
      term_media_id, 
      term_media_position, 
      definition_text,
      definition_media_id,
      definition_media_position
    )
    select 
      _user_id, 
      c1.id, 
      f1.index, 
      f1.term_text, 
      f1.term_media_id, 
      f1.term_media_position, 
      f1.definition_text,
      f1.definition_media_id,
      f1.definition_media_position
    from file_copies c1 join flashcards f1 on c1.copy_of = f1.deck_id
    where c1.type = 'deck' 
  )
  select id from file_copies where copy_of = _file_id into _new_subtree_head;

  -- Insert new subtree under _parent_id
  INSERT INTO file_tree (ancestor_id, descendant_id, dist)
  SELECT supertree.ancestor_id, subtree.descendant_id,
  supertree.dist+subtree.dist+1
  FROM file_tree AS supertree, file_tree AS subtree
  WHERE subtree.ancestor_id = _new_subtree_head
  AND supertree.descendant_id = _parent_id;

  return _new_subtree_head;
end;
$$;


ALTER FUNCTION public.copy_file(_user_id integer, _file_id integer, _parent_id integer) OWNER TO postgres;

--
-- Name: correct_web(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION correct_web() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $_$
	declare
		error_holder		text;
	begin
		if failed_test('test_web_schema') then
			create schema web;
			return next 'Created a schema';
		end if;
		if failed_test('test_web_session_table') then
			create table web.session();
			return next 'Created the session table.';
		end if;
		if failed_test('test_web_session_id_exists') then
			alter table web.session 
				add column sess_id text;
			return next 'Added sess_id column.';
		end if;
		if failed_test('test_web_session_id_type') then 
			alter table web.session
				alter column sess_id type text;
			return next 'Changed sess_id to type text.';
		end if;
		if failed_test('test_web_session_id_is_pk') then 
			alter table web.session
				add primary key (sess_id);
			return next 'Made sess_id the primary key.';
		end if;
		if failed_test('test_web_session_data_exists') then
			alter table web.session 
				add column sess_data text;
			return next 'Added sess_data column.';
		end if;
		if failed_test('test_web_session_data_type') then 
			alter table web.session
				alter column sess_data type text;
			return next 'Changed sess_data to type text.';
		end if;
		if failed_test('test_web_session_expiration_exists') then
			alter table web.session 
				add column expiration timestamp with time zone;
			return next 'Added expiration column.';
		end if;
		if failed_test('test_web_session_data_type') then 
			alter table web.session
				alter column expiration type timestamp with time zone;
			return next 'Changed expiration to type timestamp.';
		end if;
		if failed_test('test_web_session_expiration_default') then
			alter table web.session
				alter column expiration set default now() + interval '1 day';
			return next 'Added expiration default.';
		end if;
		if failed_test('test_web_session_expiration_has_index') then
			create index expire_idx on web.session (expiration);
			return next 'Created expiration index.';
		end if;
		
		if failed_test('test_web_function_allids_is_removed') then
			drop function web.all_session_ids();
			return next 'Removed all ids for security reasons.';
		end if;
		
		create or replace function web.valid_sessions()
		returns setof web.session as $$
			begin
				return query select * from web.session
					where expiration > now() 
						or expiration is null;
			end;
		$$ language plpgsql security definer
		set search_path = web, pg_temp;
		
		create or replace function web.set_session_data(
			sessid text, 
			sessdata text, 
			expire timestamp with time zone) 
		returns void as $$
			begin
				loop
					update web.session 
						set sess_data = sessdata, 
							expiration = expire 
						where sess_id = sessid;
					if found then
						return;
					end if;
					begin
						insert into web.session (sess_id, sess_data, expiration) 
							values (sessid, sessdata, expire);
						return;
					exception
						when unique_violation then
							-- do nothing.
					end;
				end loop;
			end;
		$$ language plpgsql security definer
		set search_path = web, pg_temp;
		return next 'Created function web.set_session_data';
		
		create or replace function web.destroy_session(sessid text)
		returns void as $$
			begin
				delete from web.session where sess_id = sessid;
			end;
		$$ language plpgsql security definer
		set search_path = web, pg_temp;
		return next 'Created function web.destroy_session.';
		
		create or replace function web.get_session_data(sessid text)
		returns setof text as $$
			begin
				return query select sess_data 
					from web.valid_sessions()
					where sess_id = sessid;
			end;
		$$ language plpgsql security definer
		set search_path = web, pg_temp;
		return next 'Created function web.get_session.';
		
		create or replace function web.clear_sessions()
		returns void as $$
			begin 
				delete from web.session;
			end;
		$$ language plpgsql security definer
		set search_path = web, pg_temp;		
		return next 'Created function web.clear_sessions.';

		create or replace function web.count_sessions()
		returns int as $$
			declare
				thecount int := 0;
			begin
				select count(*) into thecount
					from web.valid_sessions();
				return thecount;
			end;
		$$ language plpgsql security definer
		set search_path = web, pg_temp;
		return next 'Created function web.count_sessions.';

		drop trigger if exists delete_expired_trig on web.session;

		create or replace function web.remove_expired()
		returns trigger as $$
			begin
				delete from web.session where expiration < now();
				return null;
			end;
		$$ language plpgsql security definer
		set search_path = web, pg_temp;
		return next 'Created trigger function web.delete_expired.';
		
		create trigger delete_expired_trig
			after insert or update
			on web.session
			execute procedure web.remove_expired();
		return next 'Created trigger delete_expired on web.session.';
		
		if failed_test('test_web_user_exists') then 
			create user nodepg with password 'password';
			return next 'Created user nodepg';
		end if;
		
		revoke all on function 
			web.valid_sessions(),
			web.set_session_data(
				sessid text, 
				sessdata text, 
				expire timestamp with time zone),
			web.destroy_session(sessid text),
			web.get_session_data(sessid text),
			web.clear_sessions(),
			web.count_sessions(),
			web.remove_expired()
		from public;
		
		grant execute on function 
			web.set_session_data(
				sessid text, 
				sessdata text, 
				expire timestamp with time zone),
			web.destroy_session(sessid text),
			web.get_session_data(sessid text),
			web.clear_sessions(),
			web.count_sessions()
		to nodepg;
		
		grant usage on schema web to nodepg;
		
		return next 'Permissions set.';
	end;
$_$;


ALTER FUNCTION public.correct_web() OWNER TO postgres;

--
-- Name: create_file(integer, text, text, text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION create_file(_owner_id integer, _name text, _type text, _path text[]) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare    
  _owner_id  integer;
  _parent_id   integer;
begin
  select get_file_id(_path) into _parent_id;

  return create_file(_owner_id, _name, _type, _parent_id);
end;
$$;


ALTER FUNCTION public.create_file(_owner_id integer, _name text, _type text, _path text[]) OWNER TO postgres;

--
-- Name: create_file(integer, text, text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION create_file(_owner_id integer, _name text, _type text, _parent_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare
  _file_id  integer;
  _parent_found  boolean;
begin
  perform exists(select 1 from files where id = _parent_id);
  if not found then
    raise invalid_parameter_value 
    using message = 'Parent folder with id ' || _parent_id || 
        ' not found';
  end if;

  perform 1 from (
    select * from files f
    where f.id in (
      select t.descendant_id from file_tree t
      where t.ancestor_id = _parent_id
      and dist = 1
    )
  ) as children where name = _name;

  if not found then
    -- Add file
    insert into files (owner_id, name, type) values(
      _owner_id, 
      _name,
      _type)
    returning id into _file_id;

    -- Update file hierarchy
    insert into file_tree (ancestor_id, descendant_id, dist)
      select t.ancestor_id, _file_id, dist + 1 
      from file_tree as t
      where t.descendant_id = _parent_id
      union all select _file_id, _file_id, 0;
      
    return _file_id as id;
  else
    raise exception 'A file with name "%" already exists', _name
      using errcode = '42710'; /*duplicate_object*/
  end if;
end;
$$;


ALTER FUNCTION public.create_file(_owner_id integer, _name text, _type text, _parent_id integer) OWNER TO postgres;

--
-- Name: create_media_link(character); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION create_media_link(_sha256 character) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare
  _id integer;
begin
  with s as (
    select id from media
    where sha256 = _sha256
  ),
  i as (
    insert into media (sha256, links, type_id)
    select _sha256, 0, 1
    where not exists (
      select 1 from s
    )
    returning id
  )
  select id from s
  union all
  select id from i
  into _id;

  raise notice 'id = %', _id;

  return _id;
end;
$$;


ALTER FUNCTION public.create_media_link(_sha256 character) OWNER TO postgres;

--
-- Name: create_symlink(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION create_symlink(_user_id integer, _file_id integer, _parent_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare
  _count    integer;
  _new_file_id   integer;
  _useless   integer;
begin
  select count(*) into _count from (
    select 1 from files where id = _parent_id or id = _file_id
  ) as f;

  if _count <> 2 then
    raise invalid_parameter_value 
    using message = 'File with id ' || _file_id || 
        ' or ' || _parent_id || ' not found';
  end if;

  with children as (
    select * from files f
    where f.id in (
      select t.descendant_id from file_tree t
      where t.ancestor_id = _parent_id
      and dist = 1
    )
  )
  select 1 from children where name = (
    select name from files
    where id = _file_id
  ) into _useless;

  if found is true then
    raise exception 
    'A file with name "%" already exists', _new_name
    using errcode = '42710'; /*duplicate_object*/
  end if;
  
  with id as (
    insert into files (owner_id, name, size, type, symlink_of)
    select owner_id, name, size, type, id
    from files where id = _file_id
    returning id
  ),
  ft as ( -- Update file hierarchy
    insert into file_tree (ancestor_id, descendant_id, dist)
    select t.ancestor_id, i.id, t.dist + 1 
    from file_tree as t, id as i
    where t.descendant_id = _parent_id
    union all select i.id, i.id, 0 from id as i
  )
  select id from id into _new_file_id;


  return _new_file_id;
end;
$$;


ALTER FUNCTION public.create_symlink(_user_id integer, _file_id integer, _parent_id integer) OWNER TO postgres;

--
-- Name: create_test_session(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION create_test_session() RETURNS text
    LANGUAGE plpgsql
    AS $$
	declare
		sessionid		text;
	begin
		select into sessionid new_session_id();
		perform web.set_session_data(sessionid, md5(random()::text),
			now() + interval '1 day');
		return sessionid;
	end;
$$;


ALTER FUNCTION public.create_test_session() OWNER TO postgres;

--
-- Name: create_user(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION create_user(_name text, _password text, _email text) RETURNS record
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.create_user(_name text, _password text, _email text) OWNER TO postgres;

--
-- Name: dec_number_of_cards(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION dec_number_of_cards(deck_id integer, deleted_flashcard_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  -- Decrement number of cards
  execute 'with parents as ('
    || ' select ancestor_id'
    || ' from file_tree'
    || ' where descendant_id = ' || deck_id || ')'
    || ' update files'
    || ' set size = size - 1'
    || ' where id in parents';

  -- Update percentages
  execute 'with parents as ('
    || ' select ancestor_id'
    || ' from file_tree'
    || ' where descendant_id = ' || deck_id || '),'
  || ' percentages as ('
    || ' select percentage'
    || ' from users_flashcards_status ufl'
    || ' where ufl.flashcard_id = ' || deleted_flashcard_id || ')'
    || ' update users_files ufi'
    || ' set percentage = (percentage * (size + 1) + rest_percentage - '
      || '(select coalesce((select percentage from percentages p where p.user_id = ufi.user_id), 0))) / size'
    || ',rest_percentage = (percentage * (size + 1) + rest_percentage - '
      || '(select coalesce((select percentage from percentages p where p.user_id = ufi.user_id), 0))) % size'
    || ' from files f'
    || ' where f.id = ufi.file_id and ufi.file_id in parents';
end;
$$;


ALTER FUNCTION public.dec_number_of_cards(deck_id integer, deleted_flashcard_id integer) OWNER TO postgres;

--
-- Name: delete_file(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION delete_file(_user_id integer, _file_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  delete from files
  where id in (
    select descendant_id from file_tree
    -- Prevent from deleting user's root folder
    where not exists (
      select 1 from file_tree
      where descendant_id = _file_id
      and ancestor_id = 0
      and dist = 0
    )
    -- Prevent from deleting starred folder
    -- TODO make it work
    -- and not exists (
      -- select 1 from file_tree
      -- where ancestor_id = (
        -- -- search user's root folder id
        -- -- select f.id from files f
        -- where name = (
          -- select username from users
          -- where id = _user_id
        -- )
        -- and exists (
          -- select 1 from file_tree
          -- where descendant_id = f.id
          -- and ancestor_id = 0
          -- and dist = 1
        -- )
      -- )
    -- )
    and ancestor_id = _file_id
  );
end;
$$;


ALTER FUNCTION public.delete_file(_user_id integer, _file_id integer) OWNER TO postgres;

--
-- Name: delete_flashcard(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION delete_flashcard(_user_id integer, _flashcard_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
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

  perform _update_file_size(_deck_id, -1);
end;
$$;


ALTER FUNCTION public.delete_flashcard(_user_id integer, _flashcard_id integer) OWNER TO postgres;

--
-- Name: enable_account(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION enable_account(_user_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.enable_account(_user_id integer) OWNER TO postgres;

--
-- Name: failed_test(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION failed_test(thetest text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
	declare 
		error_holder		text;
	begin
		select 
			runtests into error_holder
		from
			runtests(thetest)
		where
			runtests ~* '^not ok';
		return found;
	end;
$$;


ALTER FUNCTION public.failed_test(thetest text) OWNER TO postgres;

--
-- Name: get_file(text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION get_file(_path text[]) RETURNS SETOF record
    LANGUAGE plpgsql
    AS $$
	declare
	_file_id	integer := 0;
begin
	select get_file_id(_path) into _file_id;
	return query execute 'select id::INTEGER,' ||
			     'owner_id::INTEGER,' ||
			     'name::TEXT,' ||
			     'size::INTEGER,' ||
			     'type::TEXT ' ||
			     'from files where id = ' || _file_id;
end;
$$;


ALTER FUNCTION public.get_file(_path text[]) OWNER TO postgres;

--
-- Name: get_file_id(text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION get_file_id(_path text[]) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare
	_parent_id	integer := 0;
	_folder		text;
begin
	foreach _folder in array _path 
	loop
		select descendant_id into _parent_id
		from file_tree ft
		where ft.ancestor_id = _parent_id
		and dist = 1
		and _folder = (
			select name
			from files
			where id = ft.descendant_id
		);

		if not found then
			raise invalid_parameter_value using message = 'Folder with path "' || array_to_string(_path, '/') || '" not found';
		end if;
	end loop;
	return _parent_id;
end;
$$;


ALTER FUNCTION public.get_file_id(_path text[]) OWNER TO postgres;

--
-- Name: get_file_tree(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION get_file_tree(_user_id integer) RETURNS TABLE(id integer, name text, type text, ancestor_id integer)
    LANGUAGE plpgsql
    AS $$
begin
  return query 
    with username as (
      select u.name 
      from users u 
      where u.id = _user_id
    ), user_root_folder as (
      select f.id, f.name 
      from files f
      where f.name = (
        select u.name 
        from username u
      ) 
      and exists (
        select 1 from file_tree ft 
        where ft.descendant_id = f.id 
        and ft.ancestor_id = 0 
        and ft.dist = 1
      )
    ), descendants as (
      select ft.descendant_id
      from file_tree ft 
      where ft.ancestor_id = (
        select urf.id 
        from user_root_folder urf 
      )
    )
    select 
      f.id,
      f.name::TEXT, 
      f.type::TEXT,
      ft.ancestor_id
    from files f join file_tree ft
    on f.id = ft.descendant_id
    where ft.descendant_id in (
      select descendant_id 
      from descendants 
    )
    and ft.dist = 1 
    and f.type = 'folder';
end;
$$;


ALTER FUNCTION public.get_file_tree(_user_id integer) OWNER TO postgres;

--
-- Name: get_flashcards(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION get_flashcards(_user_id integer, _file_id integer) RETURNS TABLE(id integer, owner_id integer, deck_id integer, term_text text, term_media_id integer, term_media_position integer, definition_text text, definition_media_id integer, definition_media_position integer, index integer, state_history text)
    LANGUAGE plpgsql
    AS $$
-- TODO return flashcards of all file's decks if the file
-- provided as arguments isn't a deck
begin
  return query
    select    
      f.id,   
      f.owner_id,   
      f.deck_id,   
      f.term_text::TEXT,   
      f.term_media_id::INTEGER,   
      f.term_media_position::INTEGER,   
      f.definition_text::TEXT,   
      f.definition_media_id::INTEGER,   
      f.definition_media_position::INTEGER,   
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
$$;


ALTER FUNCTION public.get_flashcards(_user_id integer, _file_id integer) OWNER TO postgres;

--
-- Name: get_folder_content(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION get_folder_content(_user_id integer, _folder_id integer) RETURNS TABLE(id integer, owner_id integer, owner_name text, name text, size integer, type text, percentage integer, starred boolean, study_order_id integer)
    LANGUAGE plpgsql
    AS $$
begin
  if not exists(
    select 1 from files f 
    where f.id = _folder_id 
    and f.type = 'folder'
  ) then
    raise invalid_parameter_value 
    using message = 'Folder with id ' || _folder_id || ' not found';
  end if;

  -- The path is correct, so we return the last folder found's children
  return query 
    with children_ids as (    
      select descendant_id children_id    
      from file_tree    
      where ancestor_id =  _folder_id  
      and dist = 1    
    )    
    select 
      f.id::INTEGER, 
      f.owner_id::INTEGER, 
      u.name::TEXT owner_name, 
      f.name::TEXT, 
      f.size::INTEGER, 
      f.type::TEXT, 
      coalesce(uf.percentage, 0)::INTEGER percentage, 
      coalesce(uf.starred::BOOLEAN, 'f'), 
      coalesce(uf.study_order_id::INTEGER, 1)
    from 
      files f 
      left join users_files uf on f.id = uf.file_id 
      join users u on f.owner_id = u.id
    where f.id in (
      select children_id 
      from children_ids
    ) 
    and (uf.user_id = _user_id or uf.user_id is null) 
    order by type desc, name asc;
end;                                                                  
$$;


ALTER FUNCTION public.get_folder_content(_user_id integer, _folder_id integer) OWNER TO postgres;

--
-- Name: get_folder_content(integer, text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION get_folder_content(_user_id integer, _path text[]) RETURNS TABLE(id integer, owner_id integer, owner_name text, name text, size integer, type text, percentage integer, starred boolean, study_order_id integer)
    LANGUAGE plpgsql
    AS $$
declare
  _file_id  integer := 0;
begin
  select get_file_id(_path) into _file_id;

  create temp table tt (
    id integer, owner_id integer, name text, size integer, type text, 
    percentage integer, starred boolean, study_order integer
  ) on commit drop;

  insert into tt 
  select * 
  from get_folder_content(_user_id, _file_id);

  -- The path is correct, so we return the last folder found's children
  return query 
    select * from tt;
end;                                                                  
$$;


ALTER FUNCTION public.get_folder_content(_user_id integer, _path text[]) OWNER TO postgres;

--
-- Name: get_path(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION get_path(_file_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
declare
	_path 	text;
begin
	select string_agg (sub.name::text, '/'::text)
	from ( 
		select * from file_tree ft join files f on ft.ancestor_id = f.id
		where ft.descendant_id = _file_id
		and ft.ancestor_id <> 0
		order by ft.dist desc
	) as sub
	into _path;

	return _path;
end;
$$;


ALTER FUNCTION public.get_path(_file_id integer) OWNER TO postgres;

--
-- Name: get_user_id(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION get_user_id(_name text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare
	_user_id	integer;
begin	
	select id into _user_id
	from users
	where name = _name;

	return _user_id;
end;
$$;


ALTER FUNCTION public.get_user_id(_name text) OWNER TO postgres;

--
-- Name: inc_number_of_cards(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION inc_number_of_cards(file_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  -- Increment number of cards
  execute 'withparents as ('
    || ' select ancestor_id'
    || ' from file_tree'
    || ' where descendant_id = ' || file_id || ')'
    || ' update files'
    || ' set size = size + 1'
    || ' where id in parents';

  -- Update success percentages
  execute 'with parents as ('
    || ' select ancestor_id'
    || ' from file_tree'
    || ' where descendant_id = ' || file_id || ')'
    || ' update users_files'
    || ' set percentage = percentage * (size - 1) / size'
    || ' from users_files ufs join files f on f.id = ufs.file_id' 
    || ' where file_id in parents';
end;
$$;


ALTER FUNCTION public.inc_number_of_cards(file_id integer) OWNER TO postgres;

--
-- Name: move_file(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION move_file(_user_id integer, _file_id integer, _new_parent_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare
  _old_parent_id  integer;
  _already_exists  boolean;
begin
  select ancestor_id from file_tree ft 
  where descendant_id = _file_id 
  and dist = 1 
  into _old_parent_id;

  if not found then
    raise exception 'File with id % not found', _file_id
    using errcode = '22023'; /*invalid_parameter_value*/
  end if;

  if _old_parent_id = _new_parent_id then
    return;
  end if;

  perform 1 from files f
  where f.id = _file_id
  and f.name in (
    select f2.name from files f2
    where f2.id in (
      select ft.descendant_id from file_tree ft
      where ft.ancestor_id = _new_parent_id
      and ft.dist = 1
    )
  );

  if found is true then
    raise exception 'A file with the same name and parent id(=%) already exists', 
    _new_parent_id
    using errcode = '42710'; -- Duplicate object
  end if;

  -- Update file hierarchy
  DELETE FROM file_tree
  WHERE descendant_id IN (SELECT descendant_id FROM file_tree WHERE ancestor_id = _file_id)
  AND ancestor_id NOT IN (SELECT descendant_id FROM file_tree WHERE ancestor_id = _file_id);

  -- Insert subtree to its new location
  INSERT INTO file_tree (ancestor_id, descendant_id, dist)
  SELECT supertree.ancestor_id, subtree.descendant_id,
  supertree.dist+subtree.dist+1
  FROM file_tree AS supertree, file_tree AS subtree
  WHERE subtree.ancestor_id = _file_id
  AND supertree.descendant_id = _new_parent_id;

end;
$$;


ALTER FUNCTION public.move_file(_user_id integer, _file_id integer, _new_parent_id integer) OWNER TO postgres;

--
-- Name: new_session_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION new_session_id() RETURNS text
    LANGUAGE plpgsql
    AS $$
	declare
		sessionid		text;
		holder			text;
	begin
		loop
			select md5(random()::text) into sessionid;
			select sess_id into holder from web.session
				where sess_id = sessionid;
			if found then
				continue;
			else
				return sessionid;
			end if;
		end loop;
	end;
$$;


ALTER FUNCTION public.new_session_id() OWNER TO postgres;

--
-- Name: rename_file(integer, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION rename_file(_user_id integer, _file_id integer, _new_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare
  _old_name  text;
begin
  select name from files 
  where id = _file_id 
  into _old_name;

  if not found then
    raise exception 'File with id % not found', _file_id
    using errcode = '22023'; /*invalid_parameter_value*/
  end if;

  if _old_name = _new_name then
    return;
  end if;

  perform 1 where _new_name in (
    select f.name from files f
    where f.id in (
      select ft.descendant_id from file_tree ft
      where ft.ancestor_id = (
        select ft2.ancestor_id 
        from file_tree ft2
        where ft2.descendant_id = _file_id 
        and ft2.dist = 1
      )
      and ft.dist = 1
    )
  );

  if found then
    raise exception 'A file with name "%" already exists', _new_name
    using errcode = '42710'; -- duplicate_object
  end if;

  update files
  set name = _new_name
  where id = _file_id;
end;
$$;


ALTER FUNCTION public.rename_file(_user_id integer, _file_id integer, _new_name text) OWNER TO postgres;

--
-- Name: setup_10_web(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION setup_10_web() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin
		perform web.clear_sessions();
	exception
		when invalid_schema_name then
			return;
		when undefined_function then 
			return;
	end;
$$;


ALTER FUNCTION public.setup_10_web() OWNER TO postgres;

--
-- Name: star(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION star(_user_id integer, _file_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare
  _starred_folder_id   integer;
  _new_file_id     integer;
begin
  select ft.descendant_id from file_tree ft join files f 
  on ft.descendant_id = f.id
  where f.owner_id = _user_id
  and f.name = 'starred'
  and ft.dist = 2
  and ft.ancestor_id = 0
  into _starred_folder_id;

  select create_symlink(_user_id, 
            _file_id, 
            _starred_folder_id) into _new_file_id;
  
  -- Update users_files to speed up user's starred files
  with upsert as (
    update users_files
    set starred = true
    where user_id = _user_id
    and file_id = _file_id
    returning *
  )
  insert into users_files (user_id, file_id, starred)
  select _user_id, _file_id, 't'
  where not exists (
    select * from upsert
  );

  return _new_file_id;
end;
$$;


ALTER FUNCTION public.star(_user_id integer, _file_id integer) OWNER TO postgres;

--
-- Name: test_web_function_allids_is_removed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_allids_is_removed() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin
		return next hasnt_function('web', 'all_session_ids', 'All ids is removed for security reasons.');
	end;
$$;


ALTER FUNCTION public.test_web_function_allids_is_removed() OWNER TO postgres;

--
-- Name: test_web_function_clearsessions_exists(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_clearsessions_exists() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next has_function('web', 'clear_sessions', 'Needs a clear function.');
		return next is_definer('web', 'clear_sessions', 'Clear sessions should have definer security.');
		return next function_returns('web', 'clear_sessions', 'void', 'Clear sessions data should not return anything.');
	end;
$$;


ALTER FUNCTION public.test_web_function_clearsessions_exists() OWNER TO postgres;

--
-- Name: test_web_function_clearsessions_removes_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_clearsessions_removes_data() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $_$
	begin
		perform create_test_session();
		perform create_test_session();
		perform web.clear_sessions();
		return next is_empty(
			$$select * from web.session$$,
			'Clear sessions should remove all sessions.');
	end;  
$_$;


ALTER FUNCTION public.test_web_function_clearsessions_removes_data() OWNER TO postgres;

--
-- Name: test_web_function_countsessions_counts_nulls(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_countsessions_counts_nulls() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	declare 
		sessionid			text;
		sessiondata			text:=md5(random()::text);
	begin
		select into sessionid create_test_session
			from create_test_session();
		perform web.set_session_data(sessionid, sessiondata, null);
		perform create_test_session();
		perform create_test_session();
		perform create_test_session();
		return next results_eq(
			'select web.count_sessions()',
			'values (4)',
			'Count should include expire set to null.');
	end;
$$;


ALTER FUNCTION public.test_web_function_countsessions_counts_nulls() OWNER TO postgres;

--
-- Name: test_web_function_countsessions_exists(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_countsessions_exists() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next has_function('web', 'count_sessions', 'Needs a count for the length function.'); 
		return next is_definer('web', 'count_sessions', 'Count sessions should have definer security.');
		return next function_returns('web', 'count_sessions', 'integer', 'Should return the number of active sessions.');
	end;
$$;


ALTER FUNCTION public.test_web_function_countsessions_exists() OWNER TO postgres;

--
-- Name: test_web_function_countsessions_ignores_expired(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_countsessions_ignores_expired() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	declare 
		sessionid			text;
		sessiondata			text:=md5(random()::text);
	begin
		select into sessionid create_test_session
			from create_test_session();
		perform web.set_session_data(sessionid, sessiondata, now() - interval '1 day');
		perform create_test_session();
		perform create_test_session();
		perform create_test_session();
		return next results_eq(
			'select web.count_sessions()',
			'values (3)',
			'Count should ignore expired sessions.');
	end;
$$;


ALTER FUNCTION public.test_web_function_countsessions_ignores_expired() OWNER TO postgres;

--
-- Name: test_web_function_countsessions_returns_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_countsessions_returns_count() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin
		perform create_test_session();
		perform create_test_session();
		perform create_test_session();
		perform create_test_session();
		return next results_eq(
			'select web.count_sessions()',
			'values (4)',
			'Count should return the number of sessions open.');
	end;
$$;


ALTER FUNCTION public.test_web_function_countsessions_returns_count() OWNER TO postgres;

--
-- Name: test_web_function_deleteexpired_after_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_deleteexpired_after_insert() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $_$
	declare
		sessionid		text;
		sessiondata		text;
	begin
		select into sessionid new_session_id();
		select md5(random()::text) into sessiondata;
		perform web.set_session_data(sessionid, sessiondata, now() - interval '1 day');
		return next is_empty(
			$$select * from web.session 
				where sess_id = '$$ || sessionid || $$'$$,
				'Expired sessions should be deleted after insert.');
	end;
$_$;


ALTER FUNCTION public.test_web_function_deleteexpired_after_insert() OWNER TO postgres;

--
-- Name: test_web_function_deleteexpired_after_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_deleteexpired_after_update() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $_$
	declare 
		sessionid			text;
		sessiondata			text:=md5(random()::text);
	begin
		select into sessionid create_test_session
			from create_test_session();
		perform web.set_session_data(sessionid, sessiondata, now() - interval '1 day');
		return next is_empty(
			$$select * from web.session 
				where sess_id = '$$ || sessionid || $$'$$,
				'Expired sessions should be deleted after update.');
	end;
$_$;


ALTER FUNCTION public.test_web_function_deleteexpired_after_update() OWNER TO postgres;

--
-- Name: test_web_function_deleteexpired_exists(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_deleteexpired_exists() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next has_function('web', 'remove_expired', 'Needs a function to delete expired records.');
		return next is_definer('web', 'remove_expired', 'Delete expired should have definer security.');
		return next function_returns('web', 'remove_expired', 'trigger', 'Delete expired data should return a trigger.');
	end;
$$;


ALTER FUNCTION public.test_web_function_deleteexpired_exists() OWNER TO postgres;

--
-- Name: test_web_function_destroysession_exists(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_destroysession_exists() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next has_function('web', 'destroy_session', array['text'], 'Needs to have a destroy function.');
		return next is_definer('web', 'destroy_session', array['text'], 'Session destroy should have definer security.');
		return next function_returns('web', 'destroy_session', array['text'], 'void', 'Session destroy should not return anything.');
	end;
$$;


ALTER FUNCTION public.test_web_function_destroysession_exists() OWNER TO postgres;

--
-- Name: test_web_function_destroysession_removes_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_destroysession_removes_data() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $_$
	declare 
		sessionid			text;
	begin
		select into sessionid create_test_session from create_test_session();
		perform web.destroy_session(sessionid);
		return next is_empty(
			$$select web.get_session_data('$$ || sessionid || $$')$$,
			'Session destroy should delete the session');
	end;
$_$;


ALTER FUNCTION public.test_web_function_destroysession_removes_data() OWNER TO postgres;

--
-- Name: test_web_function_getsessiondata_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_getsessiondata_data() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $_$
	declare 
		sessionid			text;
		sessiondata			text:=md5(random()::text);
	begin
		select into sessionid create_test_session from create_test_session();
		perform web.set_session_data(sessionid, sessiondata, null);
		return next results_eq(
			$$select web.get_session_data('$$ || sessionid || $$')$$,
			$$values ('$$ || sessiondata || $$')$$,
			'Get session data should retrieve the data from the session.');
	end;
$_$;


ALTER FUNCTION public.test_web_function_getsessiondata_data() OWNER TO postgres;

--
-- Name: test_web_function_getsessiondata_exists(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_getsessiondata_exists() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next has_function('web', 'get_session_data', array['text'], 'Needs a get_session_data function.');
		return next is_definer('web', 'get_session_data', array['text'], 'Get session data should have definer security.');
		return next function_returns('web', 'get_session_data', array['text'], 'setof text', 'Get session data should not return anything.');
	end;
$$;


ALTER FUNCTION public.test_web_function_getsessiondata_exists() OWNER TO postgres;

--
-- Name: test_web_function_getsessiondata_ignores_expired(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_getsessiondata_ignores_expired() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $_$
	declare 
		sessionid			text;
		sessiondata			text:=md5(random()::text);
	begin
		select into sessionid create_test_session
			from create_test_session();
		perform web.set_session_data(sessionid, sessiondata, now() - interval '1 day');
		return next is_empty(
			$$select web.get_session_data('$$ || sessionid || $$')$$,
			'Get session data ignores expired sessions.');
	end;
$_$;


ALTER FUNCTION public.test_web_function_getsessiondata_ignores_expired() OWNER TO postgres;

--
-- Name: test_web_function_setsessiondata_exists(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_setsessiondata_exists() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next has_function('web', 'set_session_data', array['text', 'text', 'timestamp with time zone'], 'Needs a set session data function.');
		return next is_definer('web', 'set_session_data', array['text', 'text', 'timestamp with time zone'], 'Set session data should have definer security.');
		return next function_returns('web', 'set_session_data', array['text', 'text', 'timestamp with time zone'], 'void', 'Set session data should not return anything.');
	end;
$$;


ALTER FUNCTION public.test_web_function_setsessiondata_exists() OWNER TO postgres;

--
-- Name: test_web_function_setsessiondata_save_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_setsessiondata_save_data() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $_$
	declare
		sessionid		text;
		sessiondata		text;
	begin
		select into sessionid new_session_id();
		select md5(random()::text) into sessiondata;
		perform web.set_session_data(sessionid, sessiondata, null);
		return next results_eq(
			$$select web.get_session_data('$$ || sessionid || $$')$$,
			$$values ('$$ || sessiondata || $$')$$,
			'The set_session_data should create a new session.');
	end;
$_$;


ALTER FUNCTION public.test_web_function_setsessiondata_save_data() OWNER TO postgres;

--
-- Name: test_web_function_setsessiondata_update_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_function_setsessiondata_update_data() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $_$
	declare
		sessionid			text;
	begin
		select create_test_session into sessionid from create_test_session();
		perform web.set_session_data(sessionid, 'new-data', now() + interval '1 day');
		return next results_eq(
			$$select web.get_session_data('$$ || sessionid || $$')$$,
			$$values ('new-data')$$,
			'The set_session_data should update a session.');
	end;
$_$;


ALTER FUNCTION public.test_web_function_setsessiondata_update_data() OWNER TO postgres;

--
-- Name: test_web_schema(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_schema() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin
		return next has_schema('web', 'There should be a web sessions schema.');
	end;
$$;


ALTER FUNCTION public.test_web_schema() OWNER TO postgres;

--
-- Name: test_web_session_data_exists(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_session_data_exists() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next has_column('web', 'session', 'sess_data', 'Needs to store the session data.');
	end;
$$;


ALTER FUNCTION public.test_web_session_data_exists() OWNER TO postgres;

--
-- Name: test_web_session_data_type(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_session_data_type() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next col_type_is('web', 'session', 'sess_data', 'text', 'Session data is text.');
	end; 
$$;


ALTER FUNCTION public.test_web_session_data_type() OWNER TO postgres;

--
-- Name: test_web_session_expiration_default(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_session_expiration_default() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $_$
	begin
		return next col_default_is('web', 'session', 'expiration', $a$(now() + '1 day'::interval)$a$, 'Default expiration is on day.');
	end;
$_$;


ALTER FUNCTION public.test_web_session_expiration_default() OWNER TO postgres;

--
-- Name: test_web_session_expiration_exists(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_session_expiration_exists() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next has_column('web', 'session', 'expiration', 'Needs a time limit on the session.');
	end;
$$;


ALTER FUNCTION public.test_web_session_expiration_exists() OWNER TO postgres;

--
-- Name: test_web_session_expiration_has_index(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_session_expiration_has_index() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin
		return next has_index('web', 'session', 'expire_idx', array['expiration'], 'Needs an index for the expiration column.');
	end;
$$;


ALTER FUNCTION public.test_web_session_expiration_has_index() OWNER TO postgres;

--
-- Name: test_web_session_expiration_type(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_session_expiration_type() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next col_type_is('web', 'session', 'expiration', 'timestamp with time zone', 'expiration needs to be a timestamp.');
	end; 
$$;


ALTER FUNCTION public.test_web_session_expiration_type() OWNER TO postgres;

--
-- Name: test_web_session_id_exists(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_session_id_exists() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next has_column('web', 'session', 'sess_id', 'Needs to have a session id column.');
	end;
$$;


ALTER FUNCTION public.test_web_session_id_exists() OWNER TO postgres;

--
-- Name: test_web_session_id_is_pk(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_session_id_is_pk() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin
		return next col_is_pk('web', 'session', 'sess_id', 'The session id is the primary key');
	end;
$$;


ALTER FUNCTION public.test_web_session_id_is_pk() OWNER TO postgres;

--
-- Name: test_web_session_id_type(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_session_id_type() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next col_type_is('web', 'session', 'sess_id', 'text', 'Session id is a string.');
	end; 
$$;


ALTER FUNCTION public.test_web_session_id_type() OWNER TO postgres;

--
-- Name: test_web_session_table(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_session_table() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin
		return next has_table('web', 'session', 'There should be a session table.');
	end;
$$;


ALTER FUNCTION public.test_web_session_table() OWNER TO postgres;

--
-- Name: test_web_trigger_deleteexpired_exists(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_trigger_deleteexpired_exists() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next trigger_is(
			'web',
			'session',
			'delete_expired_trig',
			'web',
			'remove_expired',
			'Needs a delete expired trigger.');
	end;
$$;


ALTER FUNCTION public.test_web_trigger_deleteexpired_exists() OWNER TO postgres;

--
-- Name: test_web_user_exists(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION test_web_user_exists() RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
	begin 
		return next has_user('nodepg', 'Needs to have the nodepg user.');
	end;
$$;


ALTER FUNCTION public.test_web_user_exists() OWNER TO postgres;

--
-- Name: unstar(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION unstar(_user_id integer, _file_id integer) RETURNS SETOF record
    LANGUAGE plpgsql
    AS $$
declare
  _starred_folder_id   integer;
begin
  select ft.descendant_id from file_tree ft join files f 
  on ft.descendant_id = f.id
  where f.owner_id = _user_id
  and f.name = 'starred'
  and ft.dist = 2
  and ft.ancestor_id = 0
  into _starred_folder_id;

  delete from files f
  where f.owner_id = _user_id
  and f.symlink_of = _file_id
  and exists ( 
    select 1 from file_tree ft
    where ft.ancestor_id = _starred_folder_id
    and ft.descendant_id = f.id
  );

  -- Update users_files to speed up user's starred files
  update users_files
  set starred = false
  where user_id = _user_id
  and file_id = _file_id;
end;
$$;


ALTER FUNCTION public.unstar(_user_id integer, _file_id integer) OWNER TO postgres;

--
-- Name: update_flashcard(integer, integer, text, integer, text, text, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION update_flashcard(_user_id integer, _flashcard_id integer, _term_text text, _term_media_id integer, _term_media_position text, _definition_text text, _definition_media_id integer, _definition_media_position text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare
  query     text;
  fields    text[];
begin
  if _term_media_id is not null or
    _definition_media_id is not null then

    -- Decrements old media links
    with media_id as (
      select 
        term_media_id,
        definition_media_id
      from flashcards
      where id = _flashcard_id
    )
    update media
    set links = links - 1
    where (
      _term_media_id is not null and id = (
        select term_media_id
        from media_id
      )
    ) or
    (
      _definition_media_id is not null and id = (
        select definition_media_id
        from media_id 
      )
    );

    -- increments new ones
    update media
    set links = links + 1
    where id = _term_media_id
    or id = _definition_media_id;

  end if;

  query := 'update flashcards set ';
  if _term_text is not null then
    fields = array_append(fields, quote_ident('term_text') || '=' 
      || quote_literal(_term_text));
  end if;
  if _term_media_id is not null then
    fields = array_append(fields, quote_ident('term_media_id') || '=' 
      || quote_literal(_term_media_id));
  end if;
  if _term_media_position is not null then
    fields = array_append(fields, quote_ident('term_media_position') || '=' 
      || quote_literal(_term_media_position));
  end if;
  if _definition_text is not null then
    fields = array_append(fields, quote_ident('definition_text') || '=' 
      || quote_literal(_definition_text));
  end if;
  if _definition_media_id is not null then
    fields = array_append(fields, quote_ident('definition_media_id') || '=' 
      || quote_literal(_definition_media_id));
  end if;
  if _definition_media_position is not null then
    fields = array_append(fields, quote_ident('definition_media_position') || '=' 
      || quote_literal(_definition_media_position));
  end if;

  if array_length(fields, 1) is null then -- array_length returns null on an empty array
		raise exception 'At least one field must be different from null'
		using errcode = '22023'; /*invalid_parameter_value*/
  end if;

  query := concat(query, array_to_string(fields, ','), 
    ' where id = ' || _flashcard_id);

  raise notice 'after: query = %', query;

  execute query;

  return _flashcard_id;
end;
$$;


ALTER FUNCTION public.update_flashcard(_user_id integer, _flashcard_id integer, _term_text text, _term_media_id integer, _term_media_position text, _definition_text text, _definition_media_id integer, _definition_media_position text) OWNER TO postgres;

--
-- Name: update_flashcard_status(integer, integer, character); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION update_flashcard_status(_user_id integer, _flashcard_id integer, _last_state character) RETURNS void
    LANGUAGE plpgsql
    AS $$
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

  select right(_old_history, 4) ||  _last_state 
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
$$;


ALTER FUNCTION public.update_flashcard_status(_user_id integer, _flashcard_id integer, _last_state character) OWNER TO postgres;

--
-- Name: update_study_order(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION update_study_order(_user_id integer, _file_id integer, _order_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
  with upsert as (
    update users_files
    set study_order_id = _order_id 
    where user_id = _user_id and 
    file_id = _file_id
    returning *
  )
  insert into users_files (user_id, file_id, study_order_id)
  select _user_id, _file_id, _order_id
  where not exists (
    select 1 from upsert
  );
end;
$$;


ALTER FUNCTION public.update_study_order(_user_id integer, _file_id integer, _order_id integer) OWNER TO postgres;

--
-- Name: update_until_100(integer, integer, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION update_until_100(_user_id integer, _file_id integer, _enable boolean) RETURNS void
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.update_until_100(_user_id integer, _file_id integer, _enable boolean) OWNER TO postgres;

SET search_path = web, pg_catalog;

--
-- Name: clear_sessions(); Type: FUNCTION; Schema: web; Owner: postgres
--

CREATE FUNCTION clear_sessions() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO web, pg_temp
    AS $$
			begin 
				delete from web.session;
			end;
		$$;


ALTER FUNCTION web.clear_sessions() OWNER TO postgres;

--
-- Name: count_sessions(); Type: FUNCTION; Schema: web; Owner: postgres
--

CREATE FUNCTION count_sessions() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO web, pg_temp
    AS $$
			declare
				thecount int := 0;
			begin
				select count(*) into thecount
					from web.valid_sessions();
				return thecount;
			end;
		$$;


ALTER FUNCTION web.count_sessions() OWNER TO postgres;

--
-- Name: destroy_session(text); Type: FUNCTION; Schema: web; Owner: postgres
--

CREATE FUNCTION destroy_session(sessid text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO web, pg_temp
    AS $$
			begin
				delete from web.session where sess_id = sessid;
			end;
		$$;


ALTER FUNCTION web.destroy_session(sessid text) OWNER TO postgres;

--
-- Name: get_session_data(text); Type: FUNCTION; Schema: web; Owner: postgres
--

CREATE FUNCTION get_session_data(sessid text) RETURNS SETOF text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO web, pg_temp
    AS $$
			begin
				return query select sess_data 
					from web.valid_sessions()
					where sess_id = sessid;
			end;
		$$;


ALTER FUNCTION web.get_session_data(sessid text) OWNER TO postgres;

--
-- Name: remove_expired(); Type: FUNCTION; Schema: web; Owner: postgres
--

CREATE FUNCTION remove_expired() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO web, pg_temp
    AS $$
			begin
				delete from web.session where expiration < now();
				return null;
			end;
		$$;


ALTER FUNCTION web.remove_expired() OWNER TO postgres;

--
-- Name: set_session_data(text, text, timestamp with time zone); Type: FUNCTION; Schema: web; Owner: postgres
--

CREATE FUNCTION set_session_data(sessid text, sessdata text, expire timestamp with time zone) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO web, pg_temp
    AS $$
			begin
				loop
					update web.session 
						set sess_data = sessdata, 
							expiration = expire 
						where sess_id = sessid;
					if found then
						return;
					end if;
					begin
						insert into web.session (sess_id, sess_data, expiration) 
							values (sessid, sessdata, expire);
						return;
					exception
						when unique_violation then
							-- do nothing.
					end;
				end loop;
			end;
		$$;


ALTER FUNCTION web.set_session_data(sessid text, sessdata text, expire timestamp with time zone) OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: session; Type: TABLE; Schema: web; Owner: postgres; Tablespace: 
--

CREATE TABLE session (
    sess_id text NOT NULL,
    sess_data text,
    expiration timestamp with time zone DEFAULT (now() + '1 day'::interval)
);


ALTER TABLE web.session OWNER TO postgres;

--
-- Name: valid_sessions(); Type: FUNCTION; Schema: web; Owner: postgres
--

CREATE FUNCTION valid_sessions() RETURNS SETOF session
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO web, pg_temp
    AS $$
			begin
				return query select * from web.session
					where expiration > now() 
						or expiration is null;
			end;
		$$;


ALTER FUNCTION web.valid_sessions() OWNER TO postgres;

SET search_path = public, pg_catalog;

--
-- Name: file_tree; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE file_tree (
    ancestor_id integer NOT NULL,
    descendant_id integer NOT NULL,
    dist integer NOT NULL,
    CONSTRAINT file_tree_dist_check CHECK ((dist >= 0))
);


ALTER TABLE public.file_tree OWNER TO postgres;

--
-- Name: files; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE files (
    id integer NOT NULL,
    owner_id integer NOT NULL,
    name character varying(64) NOT NULL,
    size integer DEFAULT 0 NOT NULL,
    type character varying(24) NOT NULL,
    symlink_of integer,
    copy_of integer,
    CONSTRAINT files_size_check CHECK ((size >= 0)),
    CONSTRAINT files_type_check CHECK (((type)::text = ANY ((ARRAY['folder'::character varying, 'deck'::character varying])::text[])))
);


ALTER TABLE public.files OWNER TO postgres;

--
-- Name: files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE files_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.files_id_seq OWNER TO postgres;

--
-- Name: files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE files_id_seq OWNED BY files.id;


--
-- Name: flashcards; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE flashcards (
    id integer NOT NULL,
    owner_id integer NOT NULL,
    deck_id integer NOT NULL,
    term_text character varying(2048) NOT NULL,
    term_media_id integer,
    definition_text character varying(2048) NOT NULL,
    definition_media_id integer,
    index integer NOT NULL,
    term_media_position character varying(24),
    definition_media_position character varying(24),
    CONSTRAINT flashcards_index_check CHECK ((index >= 0))
);


ALTER TABLE public.flashcards OWNER TO postgres;

--
-- Name: flashcards_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE flashcards_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.flashcards_id_seq OWNER TO postgres;

--
-- Name: flashcards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE flashcards_id_seq OWNED BY flashcards.id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE media (
    id integer NOT NULL,
    sha256 character(65) NOT NULL,
    links integer DEFAULT 0 NOT NULL,
    CONSTRAINT media_links_check CHECK ((links >= 0))
);


ALTER TABLE public.media OWNER TO postgres;

--
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE media_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.media_id_seq OWNER TO postgres;

--
-- Name: media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE media_id_seq OWNED BY media.id;


--
-- Name: media_positions; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE media_positions (
    id integer NOT NULL,
    "position" character varying(24) NOT NULL
);


ALTER TABLE public.media_positions OWNER TO postgres;

--
-- Name: media_positions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE media_positions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.media_positions_id_seq OWNER TO postgres;

--
-- Name: media_positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE media_positions_id_seq OWNED BY media_positions.id;


--
-- Name: study_orders; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE study_orders (
    id integer NOT NULL,
    study_order character varying(64) NOT NULL
);


ALTER TABLE public.study_orders OWNER TO postgres;

--
-- Name: study_modes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE study_modes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.study_modes_id_seq OWNER TO postgres;

--
-- Name: study_modes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE study_modes_id_seq OWNED BY study_orders.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE users (
    id integer NOT NULL,
    name character varying(32) NOT NULL,
    email character varying(64) NOT NULL,
    password character varying(128) NOT NULL,
    enabled boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_files; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE users_files (
    id integer NOT NULL,
    user_id integer NOT NULL,
    file_id integer NOT NULL,
    percentage integer DEFAULT 0 NOT NULL,
    starred boolean DEFAULT false NOT NULL,
    rest_percentage integer DEFAULT 0 NOT NULL,
    study_order_id integer DEFAULT 1 NOT NULL,
    until_100 boolean DEFAULT false NOT NULL,
    CONSTRAINT users_files_percentage_check CHECK (((percentage >= 0) AND (percentage <= 100))),
    CONSTRAINT users_files_rest_percentage_check CHECK ((rest_percentage >= 0))
);


ALTER TABLE public.users_files OWNER TO postgres;

--
-- Name: users_files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE users_files_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_files_id_seq OWNER TO postgres;

--
-- Name: users_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE users_files_id_seq OWNED BY users_files.id;


--
-- Name: users_flashcards; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE users_flashcards (
    user_id integer NOT NULL,
    flashcard_id integer NOT NULL,
    state_history character(5) DEFAULT '11111'::bpchar NOT NULL
);


ALTER TABLE public.users_flashcards OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY files ALTER COLUMN id SET DEFAULT nextval('files_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY flashcards ALTER COLUMN id SET DEFAULT nextval('flashcards_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY media ALTER COLUMN id SET DEFAULT nextval('media_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY media_positions ALTER COLUMN id SET DEFAULT nextval('media_positions_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY study_orders ALTER COLUMN id SET DEFAULT nextval('study_modes_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users_files ALTER COLUMN id SET DEFAULT nextval('users_files_id_seq'::regclass);


--
-- Name: files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: flashcards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY flashcards
    ADD CONSTRAINT flashcards_pkey PRIMARY KEY (id);


--
-- Name: media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: media_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY media_positions
    ADD CONSTRAINT media_positions_pkey PRIMARY KEY (id);


--
-- Name: media_positions_position_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY media_positions
    ADD CONSTRAINT media_positions_position_key UNIQUE ("position");


--
-- Name: media_sha256_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY media
    ADD CONSTRAINT media_sha256_key UNIQUE (sha256);


--
-- Name: study_modes_mode_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY study_orders
    ADD CONSTRAINT study_modes_mode_key UNIQUE (study_order);


--
-- Name: study_modes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY study_orders
    ADD CONSTRAINT study_modes_pkey PRIMARY KEY (id);


--
-- Name: users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY users_files
    ADD CONSTRAINT users_files_pkey PRIMARY KEY (id);


--
-- Name: users_flashcards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY users_flashcards
    ADD CONSTRAINT users_flashcards_pkey PRIMARY KEY (user_id, flashcard_id);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_key UNIQUE (name);


SET search_path = web, pg_catalog;

--
-- Name: session_pkey; Type: CONSTRAINT; Schema: web; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sess_id);


--
-- Name: expire_idx; Type: INDEX; Schema: web; Owner: postgres; Tablespace: 
--

CREATE INDEX expire_idx ON session USING btree (expiration);


--
-- Name: delete_expired_trig; Type: TRIGGER; Schema: web; Owner: postgres
--

CREATE TRIGGER delete_expired_trig AFTER INSERT OR UPDATE ON session FOR EACH STATEMENT EXECUTE PROCEDURE remove_expired();


SET search_path = public, pg_catalog;

--
-- Name: file_tree_ancestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY file_tree
    ADD CONSTRAINT file_tree_ancestor_id_fkey FOREIGN KEY (ancestor_id) REFERENCES files(id) ON DELETE CASCADE;


--
-- Name: file_tree_descendant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY file_tree
    ADD CONSTRAINT file_tree_descendant_id_fkey FOREIGN KEY (descendant_id) REFERENCES files(id) ON DELETE CASCADE;


--
-- Name: files_copy_of_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY files
    ADD CONSTRAINT files_copy_of_fkey FOREIGN KEY (copy_of) REFERENCES files(id);


--
-- Name: files_ownerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY files
    ADD CONSTRAINT files_ownerid_fkey FOREIGN KEY (owner_id) REFERENCES users(id);


--
-- Name: files_symlink_of_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY files
    ADD CONSTRAINT files_symlink_of_fkey FOREIGN KEY (symlink_of) REFERENCES files(id);


--
-- Name: flashcards_deck_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY flashcards
    ADD CONSTRAINT flashcards_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES files(id) ON DELETE CASCADE;


--
-- Name: flashcards_definition_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY flashcards
    ADD CONSTRAINT flashcards_definition_media_id_fkey FOREIGN KEY (definition_media_id) REFERENCES media(id) ON DELETE SET NULL;


--
-- Name: flashcards_definition_media_position_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY flashcards
    ADD CONSTRAINT flashcards_definition_media_position_fkey FOREIGN KEY (definition_media_position) REFERENCES media_positions("position");


--
-- Name: flashcards_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY flashcards
    ADD CONSTRAINT flashcards_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: flashcards_term_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY flashcards
    ADD CONSTRAINT flashcards_term_media_id_fkey FOREIGN KEY (term_media_id) REFERENCES media(id) ON DELETE SET NULL;


--
-- Name: flashcards_term_media_position_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY flashcards
    ADD CONSTRAINT flashcards_term_media_position_fkey FOREIGN KEY (term_media_position) REFERENCES media_positions("position");


--
-- Name: users_files_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users_files
    ADD CONSTRAINT users_files_file_id_fkey FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE;


--
-- Name: users_files_study_mode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users_files
    ADD CONSTRAINT users_files_study_mode_fkey FOREIGN KEY (study_order_id) REFERENCES study_orders(id) ON DELETE SET DEFAULT;


--
-- Name: users_files_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users_files
    ADD CONSTRAINT users_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: users_flashcards_flashcard_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users_flashcards
    ADD CONSTRAINT users_flashcards_flashcard_id_fkey FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE;


--
-- Name: users_flashcards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users_flashcards
    ADD CONSTRAINT users_flashcards_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: web; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA web FROM PUBLIC;
REVOKE ALL ON SCHEMA web FROM postgres;
GRANT ALL ON SCHEMA web TO postgres;
GRANT USAGE ON SCHEMA web TO nodepg;


SET search_path = web, pg_catalog;

--
-- Name: clear_sessions(); Type: ACL; Schema: web; Owner: postgres
--

REVOKE ALL ON FUNCTION clear_sessions() FROM PUBLIC;
REVOKE ALL ON FUNCTION clear_sessions() FROM postgres;
GRANT ALL ON FUNCTION clear_sessions() TO postgres;
GRANT ALL ON FUNCTION clear_sessions() TO nodepg;


--
-- Name: count_sessions(); Type: ACL; Schema: web; Owner: postgres
--

REVOKE ALL ON FUNCTION count_sessions() FROM PUBLIC;
REVOKE ALL ON FUNCTION count_sessions() FROM postgres;
GRANT ALL ON FUNCTION count_sessions() TO postgres;
GRANT ALL ON FUNCTION count_sessions() TO nodepg;


--
-- Name: destroy_session(text); Type: ACL; Schema: web; Owner: postgres
--

REVOKE ALL ON FUNCTION destroy_session(sessid text) FROM PUBLIC;
REVOKE ALL ON FUNCTION destroy_session(sessid text) FROM postgres;
GRANT ALL ON FUNCTION destroy_session(sessid text) TO postgres;
GRANT ALL ON FUNCTION destroy_session(sessid text) TO nodepg;


--
-- Name: get_session_data(text); Type: ACL; Schema: web; Owner: postgres
--

REVOKE ALL ON FUNCTION get_session_data(sessid text) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_session_data(sessid text) FROM postgres;
GRANT ALL ON FUNCTION get_session_data(sessid text) TO postgres;
GRANT ALL ON FUNCTION get_session_data(sessid text) TO nodepg;


--
-- Name: remove_expired(); Type: ACL; Schema: web; Owner: postgres
--

REVOKE ALL ON FUNCTION remove_expired() FROM PUBLIC;
REVOKE ALL ON FUNCTION remove_expired() FROM postgres;
GRANT ALL ON FUNCTION remove_expired() TO postgres;


--
-- Name: set_session_data(text, text, timestamp with time zone); Type: ACL; Schema: web; Owner: postgres
--

REVOKE ALL ON FUNCTION set_session_data(sessid text, sessdata text, expire timestamp with time zone) FROM PUBLIC;
REVOKE ALL ON FUNCTION set_session_data(sessid text, sessdata text, expire timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION set_session_data(sessid text, sessdata text, expire timestamp with time zone) TO postgres;
GRANT ALL ON FUNCTION set_session_data(sessid text, sessdata text, expire timestamp with time zone) TO nodepg;


--
-- Name: valid_sessions(); Type: ACL; Schema: web; Owner: postgres
--

REVOKE ALL ON FUNCTION valid_sessions() FROM PUBLIC;
REVOKE ALL ON FUNCTION valid_sessions() FROM postgres;
GRANT ALL ON FUNCTION valid_sessions() TO postgres;


--
-- PostgreSQL database dump complete
--

