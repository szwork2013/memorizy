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

create or replace function get_folder(_path text[]) returns setof record as $$
	declare
	_file_id	integer := 0;
begin
	select get_file_id(_path) into _file_id;
	if _file_id < 0 then
		return;
	end if;
	return query execute 'select id, owner_id, name_display, name, n_cards, type_id from files where id = ' || _file_id;
end;
$$ language plpgsql;	

create or replace function get_folder_content(_username text, _path text[]) returns setof record as $$
	declare                                                                                                                                    
	_file_id	integer := 0;                                                                                                      
begin                                                                                                                                      
	select get_file_id(_path) into _file_id;
	if _file_id < 0 then
		return;
	end if;

	-- The path is correct, so we return the last folder found's children                                                              
	return query execute                                                                                                               
	'with children_ids as ( ' ||                                                                                               
			'select descendant_id children_id ' ||                                                                                     
			'from files_tree ' ||                                                                                                      
			'where ancestor_id = ' || _file_id ||                                                                                    
			' and dist = 1 ' ||                                                                                                        
			') ' ||                                                                                                                            
	'select f.id, f.owner_id, f.name_display'                                                                                          
	|| ', f.n_cards, f.type_id, f.name'                                                                                        
	|| ', coalesce(ufp.percentage, 0) percentage'                                                                              
	|| ' from files f left join users_files_status'                                                                            
	|| ' ufp on f.id = ufp.file_id'                                                                                            
	|| ' where f.id in (select children_id from children_ids)'                                                                 
	|| ' and (ufp.user_id = (select id from users where username = ' || quote_literal(_username) || ') or ufp.user_id is null)'
	|| ' order by type_id asc, name_display asc';                                                                              
end;                                                                  
$$ language plpgsql;

create or replace function add_file(_owner_username text, _name text, _name_display text, _type_id integer, _path text[]) returns boolean as $$
declare		
	_owner_id	integer;
	_parent_id 	integer;
begin
	select get_file_id(_path) into _parent_id;
	if _parent_id < 0 then
		return false;
	end if;
	select get_user_id(_owner_username) into _owner_id;
	return add_file(_owner_id, _name, _name_display, _type_id, _parent_id);
end;
$$ language plpgsql;

create or replace function add_file(_owner_id integer, _name text, _name_display text, _type_id integer, _path text[]) returns boolean as $$
declare
	_file_id	integer;
	_parent_id	integer;
	_already_exists	boolean;
	_parent_found	boolean;
begin
	select get_file_id(_path) into _parent_id;
	if _parent_id < 0 then
		return false;
	end if;

	-- Check that there's no file with the same name and parent
	if _parent_id is null then
		select 0 into _parent_id;
	end if;	
	select exists(select 1 from files where id = _parent_id) into _parent_found;
	if _parent_found is false then
		return false;
	end if;

	with children as (
			select * from files f
			where f.id in (
				select t.descendant_id from files_tree t
				where t.ancestor_id = _parent_id
				and dist = 1
				)
			)
	select exists(select 1 from children where name = _name) into _already_exists;

	if _already_exists is not true then
		-- Add file
		insert into files (owner_id, name, name_display, type_id) values(
			_owner_id, 
			_name,
			_name_display,
			_type_id)
		returning id into _file_id;

		-- Update file hierarchy
		insert into files_tree (ancestor_id, descendant_id, dist)
			select t.ancestor_id, _file_id, dist + 1 
			from files_tree as t
			where t.descendant_id = _parent_id
			union all select _file_id, _file_id, 0;

		return true;
	else
		return false;
	end if;
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

/* create or replace function delete_flashcard(flashcard_id integer, deck_id integer) returns void as $$
   begin
   end;
   $$ language plpgsql; */

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
		|| ' from files_tree'
		|| ' where descendant_id = ' || file_id || ')'
		|| ' update files'
		|| ' set n_cards = n_cards + 1'
		|| ' where id in parents';

	-- Update success percentages
	execute 'with parents as ('
		|| ' select ancestor_id'
		|| ' from files_tree'
		|| ' where descendant_id = ' || file_id || ')'
		|| ' update users_files_status'
		|| ' set percentage = percentage * (n_cards - 1) / n_cards'
		|| ' from users_files_status ufs join files f on f.id = ufs.file_id' 
		|| ' where file_id in parents';
end;
$$ language plpgsql;

create or replace function dec_number_of_cards(deleted_flashcard_id integer, deck_id integer) returns void as $$
begin
	-- Decrement number of cards
	execute 'with parents as ('
		|| ' select ancestor_id'
		|| ' from files_tree'
		|| ' where descendant_id = ' || deck_id || ')'
		|| ' update files'
		|| ' set n_cards = n_cards - 1'
		|| ' where id in parents';

	-- Update percentages
	execute 'with parents as ('
		|| ' select ancestor_id'
		|| ' from files_tree'
		|| ' where descendant_id = ' || deck_id || '),'
	|| ' percentages as ('
		|| ' select percentage'
		|| ' from users_flashcards_status ufl'
		|| ' where ufl.flashcard_id = ' || deleted_flashcard_id || ')'
		|| ' update users_files_status ufi'
		|| ' set percentage = (percentage * (n_cards + 1) + rest_percentage - '
			|| '(select coalesce((select percentage from percentages p where p.user_id = ufi.user_id), 0))) / n_cards'
		|| ',rest_percentage = (percentage * (n_cards + 1) + rest_percentage - '
			|| '(select coalesce((select percentage from percentages p where p.user_id = ufi.user_id), 0))) % n_cards'
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
		|| ' from files_tree'
		|| ' where descendant_id = ' || file_id || ' and user_id = ' || user_id || '),'
	|| ' update users_files_status'
	|| ' set percentage = (percentage * n_cards + rest_percentage + ' || percentage_difference || ') / n_cards'
		|| ',rest_percentage = (percentage * n_cards + rest_percentage + ' || percentage_difference || ') % n_cards'
		|| ' where file_id in parents';
end;
$$ language plpgsql

