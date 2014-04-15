-- returns the path of a file depending on its id
-- path format is 'folder/subfolder/subsubfolder/...'
create or replace
function get_path (_file_id integer) returns text as $$
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
$$ language plpgsql;

create or replace function get_file(_user_id integer, _path text[]) 
returns table (id integer, owner_id integer, owner_name text, name text,
               size integer, type text, percentage integer, rest_percentage integer,
               starred boolean, flashcard_order_id integer, until_100 boolean,
               studied integer, show_first text, study_method text)
as $$
	declare
	_file_id	integer := 0;
begin
	select get_file_id(_path) into _file_id;
	return query 
    select 
      f.id::INTEGER, 
      f.owner_id::INTEGER, 
      u.name::TEXT owner_name,
      f.name::TEXT, 
      f.size::INTEGER, 
      f.type::TEXT,
      coalesce(uf.percentage, 0)::INTEGER,
      coalesce(uf.rest_percentage, 0)::INTEGER,
      coalesce(uf.starred, false)::BOOLEAN,
      coalesce(uf.flashcard_order_id, 1)::INTEGER,
      coalesce(uf.until_100, false)::BOOLEAN,
      coalesce(uf.studied, 0)::INTEGER,
      coalesce(uf.show_first, 'Term')::TEXT,
      coalesce(uf.study_method, 'classic')::TEXT
    from files f 
      left join users_files uf on f.id = uf.file_id 
      join users u on u.id = f.owner_id
    where f.id = _file_id
    and u.id = _user_id;
end;
$$ language plpgsql;	

create or replace
function get_file_tree (_user_id integer)
returns table (id integer, name text, type text, ancestor_id integer)
as $$
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
$$ language plpgsql;
