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
-- Name: auth; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE auth (
    auth character varying(32) NOT NULL
);


ALTER TABLE public.auth OWNER TO postgres;

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
-- Name: file_types; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE file_types (
    type character varying(32) NOT NULL
);


ALTER TABLE public.file_types OWNER TO postgres;

--
-- Name: files; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE files (
    id integer NOT NULL,
    filename character varying(128) NOT NULL,
    type character varying(32) NOT NULL,
    size integer DEFAULT 0 NOT NULL,
    CONSTRAINT files_size_check CHECK ((size > 0))
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
-- Name: study_modes; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE study_modes (
    id integer NOT NULL,
    mode character varying(64) NOT NULL
);


ALTER TABLE public.study_modes OWNER TO postgres;

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

ALTER SEQUENCE study_modes_id_seq OWNED BY study_modes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE users (
    id integer NOT NULL,
    username character varying(32) NOT NULL,
    password character varying(32) NOT NULL,
    email character varying(250) NOT NULL,
    enabled boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_auth; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE users_auth (
    user_id integer NOT NULL,
    auth character varying(32) NOT NULL
);


ALTER TABLE public.users_auth OWNER TO postgres;

--
-- Name: users_files; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE users_files (
    user_id integer NOT NULL,
    file_id integer NOT NULL,
    percentage integer DEFAULT 0 NOT NULL,
    study_mode_id integer DEFAULT 0 NOT NULL,
    CONSTRAINT users_files_percentage_check CHECK (((percentage >= 0) AND (percentage <= 100)))
);


ALTER TABLE public.users_files OWNER TO postgres;

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

ALTER TABLE ONLY study_modes ALTER COLUMN id SET DEFAULT nextval('study_modes_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Data for Name: auth; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY auth (auth) FROM stdin;
\.


--
-- Data for Name: file_tree; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY file_tree (ancestor_id, descendant_id, dist) FROM stdin;
\.


--
-- Data for Name: file_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY file_types (type) FROM stdin;
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY files (id, filename, type, size) FROM stdin;
\.


--
-- Name: files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('files_id_seq', 1, false);


--
-- Data for Name: study_modes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY study_modes (id, mode) FROM stdin;
\.


--
-- Name: study_modes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('study_modes_id_seq', 1, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY users (id, username, password, email, enabled) FROM stdin;
\.


--
-- Data for Name: users_auth; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY users_auth (user_id, auth) FROM stdin;
\.


--
-- Data for Name: users_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY users_files (user_id, file_id, percentage, study_mode_id) FROM stdin;
\.


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('users_id_seq', 1, false);


SET search_path = web, pg_catalog;

--
-- Data for Name: session; Type: TABLE DATA; Schema: web; Owner: postgres
--

COPY session (sess_id, sess_data, expiration) FROM stdin;
biOKJcLqtA2uWibVezjJ5PQb	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"passport":{}}	\N
\.


SET search_path = public, pg_catalog;

--
-- Name: auth_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY auth
    ADD CONSTRAINT auth_pkey PRIMARY KEY (auth);


--
-- Name: file_tree_ancestor_id_descendant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY file_tree
    ADD CONSTRAINT file_tree_ancestor_id_descendant_id_key UNIQUE (ancestor_id, descendant_id);


--
-- Name: file_tree_descendant_id_dist_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY file_tree
    ADD CONSTRAINT file_tree_descendant_id_dist_key UNIQUE (descendant_id, dist);


--
-- Name: file_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY file_types
    ADD CONSTRAINT file_types_pkey PRIMARY KEY (type);


--
-- Name: files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: study_modes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY study_modes
    ADD CONSTRAINT study_modes_pkey PRIMARY KEY (id);


--
-- Name: users_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY users_files
    ADD CONSTRAINT users_files_pkey PRIMARY KEY (user_id, file_id);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


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
-- Name: files_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY files
    ADD CONSTRAINT files_type_fkey FOREIGN KEY (type) REFERENCES file_types(type);


--
-- Name: users_auth_auth_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users_auth
    ADD CONSTRAINT users_auth_auth_fkey FOREIGN KEY (auth) REFERENCES auth(auth);


--
-- Name: users_auth_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users_auth
    ADD CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- Name: users_files_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users_files
    ADD CONSTRAINT users_files_file_id_fkey FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE;


--
-- Name: users_files_study_mode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users_files
    ADD CONSTRAINT users_files_study_mode_id_fkey FOREIGN KEY (study_mode_id) REFERENCES study_modes(id);


--
-- Name: users_files_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users_files
    ADD CONSTRAINT users_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


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

