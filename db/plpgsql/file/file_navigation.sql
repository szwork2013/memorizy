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

create or replace function get_file(_path text[]) returns setof record as $$
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
