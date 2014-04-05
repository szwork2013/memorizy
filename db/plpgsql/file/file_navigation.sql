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

-- TODO Try it
create or replace
function get_file_tree (_user_id integer, 
                        _excluded_folder_id integer)
returns setof record as $$
begin
     return query execute
        'select f.id, f.name, f.type, ft.ancestor_id,' +
        'get_path(f.id) as path' +
        ' from files f join file_tree ft' +
        ' on f.id = ft.descendant_id' +
        ' where f.id in (' +
            -- search <rootFolder> root folder's subfolder
            -- with _excluded_folder_id and its children
            -- excluded
            'select descendant_id from file_tree ft2' +
            ' where ft2.ancestor_id = (' + 
                -- search the root folder which is named <rootFolder> 
                'select f2.id from files f2' +
                ' where f2.name = $1 and f2.id in (' +
                    -- get user root folders
                    'select descendant_id from file_tree ft3' + 
                    ' where ft3.ancestor_id = 0 and ft3.dist = 1' + 
                ')' + 
            ') and not exists (' +
                'select 1 from file_tree ft3 ' +
                'where ft3.descendant_id = ft2.descendant_id ' +
                'and ft3.ancestor_id = _excluded_folder_id' +
            ')' +
        ') and dist = 1 and type = ''folder''';
end;
$$ language plpgsql;
