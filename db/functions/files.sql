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

create or replace function get_folder(_path text[]) returns setof record as $$
	declare
	_file_id	integer := 0;
begin
	select get_file_id(_path) into _file_id;
	return query execute 'select id::INTEGER, owner_id:INTEGER, name::TEXT, size::INTEGER, type::TEXT from files where id = ' || _file_id;
end;
$$ language plpgsql;	


create or replace function get_folder_content(_user_id integer, _folder_id integer) returns setof record as $$
begin                                                                                                                                      
	if not exists(select 1 from files f where f.id = _folder_id and f.type_id = 1) then
		raise invalid_parameter_value using message = 'Folder with id ' || _folder_id || ' not found';
	end if;

	-- The path is correct, so we return the last folder found's children                                                              
	return query execute                                                                                                               
	'with children_ids as ( ' ||                                                                                               
			'select descendant_id children_id ' ||                                                                                     
			'from file_tree ' ||                                                                                                      
			'where ancestor_id = ' || _folder_id ||                                                                                    
			' and dist = 1 ' ||                                                                                                        
			') ' ||                                                                                                                            
	'select f.id, f.owner_id, f.name::TEXT'                     
	|| ', f.size, f.type_id'                                                                                        
	|| ', coalesce(uf.percentage, 0) percentage'                                                                              
	|| ' from files f left join users_files'                                                                            
	|| ' uf on f.id = uf.file_id'                                                                                            
	|| ' where f.id in (select children_id from children_ids)'                                                                 
	|| ' and (uf.user_id = ' || _user_id || ' or uf.user_id is null)'
	|| ' order by type_id asc, name asc';                                                                              
end;                                                                  
$$ language plpgsql;

create or replace function get_folder_content(_user_id integer, _path text[]) returns setof record as $$
declare                                                                                                                                    
	_file_id	integer := 0;                                                                                                      
begin                                                                                                                                      
	select get_file_id(_path) into _file_id;

	-- The path is correct, so we return the last folder found's children                                                              
	return query execute                                                                                                               
	'with children_ids as ( ' ||                                                                                               
			'select descendant_id children_id ' ||                                                                                     
			'from file_tree ' ||                                                                                                      
			'where ancestor_id = ' || _file_id ||                                                                                    
			' and dist = 1 ' ||                                                                                                        
			') ' ||                                                                                                                            
	'select f.id, f.owner_id, f.name::TEXT'                     
	|| ', f.size, f.type_id'                                                                                        
	|| ', coalesce(uf.percentage, 0) percentage'                                                                              
	|| ' from files f left join users_files'                                                                            
	|| ' uf on f.id = uf.file_id'                                                                                            
	|| ' where f.id in (select children_id from children_ids)'                                                                 
	|| ' and (uf.user_id = ' || _user_id || ' or uf.user_id is null)'
	|| ' order by type_id asc, name asc';                                                                              
end;                                                                  
$$ language plpgsql;

create or replace function create_file(_owner_id integer, _name text, _type_id integer, _path text[]) returns integer as $$
declare		
	_owner_id	integer;
	_parent_id 	integer;
begin
	select get_file_id(_path) into _parent_id;

	return create_file(_owner_id, _name, _type_id, _parent_id);
end;
$$ language plpgsql;

create or replace function create_file(_owner_id integer, _name text, _type text, _parent_id integer) returns integer as $$
declare
	_file_id	integer;
	_parent_found	boolean;
begin
	perform exists(select 1 from files where id = _parent_id);
	if not found then
		raise invalid_parameter_value using message = 'Parent folder with id ' || _parent_id || ' not found';
	end if;

	perform 1 from (
		select * from files f
		where f.id in (
			select t.descendant_id from file_tree t
			where t.ancestor_id = _parent_id
			and dist = 1
		)
	) as children where filename = _name;

	if not found then
		-- Add file
		insert into files (owner_id, filename, type) values(
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
		raise exception 'A file with filename "%" already exists', _name
			using errcode = '42710'; /*duplicate_object*/
	end if;
end;
$$ language plpgsql;

create or replace function create_symlink(_user_id integer, _file_id integer, _parent_id integer) returns void as $$
declare
	cpt	integer;
begin
	select count(*) from (
		select 1 from files where id = _parent_id or id = _file_id
	) as found;

	if count <> 2 then
		raise invalid_parameter_value using message = 'File with id ' || _file_id || ' or ' || _parent_id || ' not found';
	end if;

	with children as (
		select * from files f
		where f.id in (
			select t.descendant_id from file_tree t
			where t.ancestor_id = _parent_id
			and dist = 1
		)
	)
	select 1 from children where name = _name;

	if found is true then
		raise exception 'A file with filename "%" already exists', _new_filename
			using errcode = '42710'; /*duplicate_object*/
	end if;
	
	with id as (
		insert into files (owner_id, name, size, type_id, symlink_of)
		select owner_id, name, size, type_id, id
		from files where id = _file_id
		returning id
	)
	-- Update file hierarchy
	insert into file_tree (ancestor_id, descendant_id, dist)
	select t.ancestor_id, i.id, t.dist + 1 
	from file_tree as t, id as i
	where t.descendant_id = _parent_id
	union all select i.id, i.id, 0 from id as i;
end;
$$ language plpgsql;

create or replace function rename_file(_user_id integer, _file_id integer, _new_filename text) returns void as $$
declare
	_old_filename	text;
begin
	select name from files where id = _file_id into _old_filename;
	if not found then
		raise exception 'File with id % not found', _file_id
			using errcode = '22023'; /*invalid_parameter_value*/
	end if;

	if _old_filename = _new_filename then
		return;
	end if;

	perform 1 where _new_filename in (
		select f.name from files f
		where f.id in (
			select ft.descendant_id from file_tree ft
			where ft.ancestor_id = (
				select ft2.ancestor_id from file_tree ft2
				where ft2.descendant_id = _file_id and ft2.dist = 1
			)
			and ft.dist = 1
		)
	);

	if found is true then
		raise exception 'A file with filename "%" already exists', _new_filename
			using errcode = '42710'; /*duplicate_object*/
	end if;

	update files
	set name = _new_filename
	where id = _file_id;
end;
$$ language plpgsql;

create or replace function move_file(_user_id integer, _file_id integer,  _new_parent_id integer) returns void as $$
declare
	_old_parent_id	integer;
	_already_exists	boolean;
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
		raise exception 'A file with the same filename and parent id(=%) already exists', _new_parent_id
			using errcode = '42710'; /*duplicate_object*/
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
$$ language plpgsql;

create or replace function copy_file(_user_id integer, _file_id integer, _parent_id integer) returns void as $$
declare
	_cpt			integer;
	_new_subtree_head	integer;
begin
	select count(*) from files f
	where f.id = _file_id or f.id = _parent_id
	into _cpt;

	if _cpt <> 2 then
		raise exception 'File with id % or % not found', _file_id, _parent_id
		using errcode = '22023'; /*invalid_parameter_value*/
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

	if found is true then
		raise exception 'A file with the same filename and parent id(=%) already exists', _parent_id
			using errcode = '42710'; /*duplicate_object*/
	end if;

	with file_copies as(
		-- Returns copies id
		insert into files (owner_id, name, size, type_id, copy_of)
		select _user_id, f.name, f.size, f.type_id, f.id from files f
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
		insert into flashcards(owner_id, deck_id, index, term, definition)
		select _user_id, c1.id, f1.index, f1.term, f1.definition
		from file_copies c1 join flashcards f1 on c1.copy_of = f1.deck_id
		where c1.type_id = 2 /* deck */
	)
	select id from file_copies where copy_of = _file_id into _new_subtree_head;

	-- Insert new subtree under _parent_id
	INSERT INTO file_tree (ancestor_id, descendant_id, dist)
	SELECT supertree.ancestor_id, subtree.descendant_id,
	supertree.dist+subtree.dist+1
	FROM file_tree AS supertree, file_tree AS subtree
	WHERE subtree.ancestor_id = _new_subtree_head
	AND supertree.descendant_id = _parent_id;

end;
$$ language plpgsql;

create or replace function delete_file(_user_id integer, _file_id integer) returns void as $$
begin
	delete from files
	where id in (
		select descendant_id from file_tree
		-- Prevent from deleting user's root folder
		where not exists(
			select 1 from file_tree
			where ancestor_id = 0
			and dist = 0
		)
		-- Prevent from deleting starred folder
		-- TODO make it work
		-- and not exists (
			-- select 1 from file_tree
			-- where ancestor_id = (
				-- search user's root folder id
				-- select f.id from files f
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
$$ language plpgsql;

create or replace function add_flashcard(_owner_id integer, _deck_id integer, _term char(2048), _definition char(2048), _insert_before_id integer) returns integer as $$
declare
	_range	record;
	_id	integer;
begin
	if _insert_before_id is null then
		with max as (
			select coalesce(max(position), 0) pos
			from flashcards
		)
		insert into flashcards (owner_id, deck_id, term, definition, position) values(
			_owner_id, _deck_id, _term, _definition, (select pos + 100 from max))
			returning id into _id;
	else
		loop
			with before_position as (
				select position insert_before
				from flashcards
				where id = _insert_before_id
			), after_position as (
				select coalesce(max(position), 0) insert_after
				from flashcards
				where position < (select insert_before from before_position)
			)
			select * from before_position before, after_position after into _range;

			if _range.insert_before - 1 = _range.insert_after then
				update flashcards
				set position = position + 100
				where position >= _range.insert_before;
			else
				exit;
			end if;
		end loop;

		insert into flashcards (owner_id, deck_id, term, definition, position) values(
			_owner_id, _deck_id, _term, _definition, _range.insert_after + (_range.insert_before - _range.insert_after) / 2)
			returning id into _id;
	end if;

	return _id;
end;
$$ language plpgsql;

create or replace function add_flashcard(_owner_id integer, _deck_id integer, _term char(2048), _definition char(2048), _insert_before_id integer) returns integer as $$
declare
	_range	record;
	_id	integer;
begin
	if _insert_before_id is null then
		with max as (
			select coalesce(max(position), 0) pos
			from flashcards
	    	)
		insert into flashcards (owner_id, deck_id, term, definition, position) values(
			_owner_id, _deck_id, _term, _definition, (select pos + 100 from max))
		returning id into _id;
	else
		loop
			with before_position as (
				select position insert_before
				from flashcards
				where id = _insert_before_id
			), after_position as (
				select coalesce(max(position), 0) insert_after
				from flashcards
				where position < (select insert_before from before_position)
			)
			select * from before_position before, after_position after into _range;

			if _range.insert_before - 1 = _range.insert_after then
				update flashcards
				set position = position + 100
				where position >= _range.insert_before;
			else
				exit;
			end if;
		end loop;

		insert into flashcards (owner_id, deck_id, term, definition, position) values(
			_owner_id, _deck_id, _term, _definition, _range.insert_after + (_range.insert_before - _range.insert_after) / 2)
			returning id into _id;
	end if;

	return _id;
end;
$$ language plpgsql;

create or replace function delete_flashcard(flashcard_id integer, deck_id integer) returns void as $$
begin
	perform dec_number_of_cards(flashcard_id, deck_id);
	execute 'delete from flashcards where id = ' || flashcard_id;

	-- Update next and previous flashcard instead of index
end;
$$ language plpgsql;

create or replace function inc_number_of_cards(file_id integer) returns void as $$
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
$$ language plpgsql;

create or replace function dec_number_of_cards(deleted_flashcard_id integer, deck_id integer) returns void as $$
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
$$ language plpgsql;

create or replace function update_flashcard_status (user_id integer, flashcard_id integer, last_state char) returns void as $$
declare
	state_histories	record;
begin
	execute 'select update_flashcard_state_history(' 
		|| user_id || ',' 
		|| flashcard_id || ',' 
		|| quote_literal(last_state) || ')' into state_histories;


	perform update_file_status(user_id, tmp_status.deck_id, 
		(select percentage from state_hist_to_percentage where state_hist = state_histories.new) -
		(select percentage from state_hist_to_percentage where state_hist = state_histories.old));
end;
$$ language plpgsql;

create or replace function update_file_status(user_id integer, file_id integer, percentage_difference integer) returns void as $$
begin
	-- Update percentages of the file and all of its parents (following user_id file tree)
	execute 'with parents as ('
		|| ' select ancestor_id'
		|| ' from file_tree'
		|| ' where descendant_id = ' || file_id || ' and user_id = ' || user_id || '),'
	|| ' update users_files'
	|| ' set percentage = (percentage * size + rest_percentage + ' || percentage_difference || ') / size'
		|| ',rest_percentage = (percentage * size + rest_percentage + ' || percentage_difference || ') % size'
		|| ' where file_id in parents';
end;
$$ language plpgsql

