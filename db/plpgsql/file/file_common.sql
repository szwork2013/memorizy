create or replace function get_file_id(_path text[]) returns integer as $$
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
$$ language plpgsql;


