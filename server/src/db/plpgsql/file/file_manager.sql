create or replace 
function get_folder_content (_user_id integer, _folder_id integer) 
returns table (id integer, owner_id integer, owner_name text, name text, size integer, visibility text, type text, 
               percentage integer, starred boolean, flashcard_order_id integer, study_method text)
as $$
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
      f.visibility::TEXT, 
      f.type::TEXT, 
      coalesce(uf.percentage, 0)::INTEGER percentage, 
      coalesce(uf.starred, 'f')::BOOLEAN, 
      coalesce(uf.flashcard_order_id, 1)::INTEGER,
      coalesce(uf.study_method, 'classic')::TEXT
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
$$ language plpgsql;

create or replace 
function get_folder_content (_user_id integer, _path text[]) 
returns table (id integer, owner_id integer, owner_name text, name text, size integer, visibility text, type text, 
               percentage integer, starred boolean, flashcard_order_id integer, study_method text)
as $$
declare
  _file_id  integer := 0;
begin
  select get_file_id(_path) into _file_id;

  create temp table tt (
    id integer, owner_id integer, name text, size integer, type text, 
    percentage integer, starred boolean, flashcard_order_id integer
  ) on commit drop;

  insert into tt 
  select * 
  from get_folder_content(_user_id, _file_id);

  -- The path is correct, so we return the last folder found's children
  return query 
    select * from tt;
end;                                                                  
$$ language plpgsql;

create or replace 
function create_file (_owner_id integer, _name text, _type text, _path text[]) 
returns integer as $$
declare    
  _owner_id  integer;
  _parent_id   integer;
begin
  select get_file_id(_path) into _parent_id;

  return create_file(_owner_id, _name, _type, _parent_id);
end;
$$ language plpgsql;

create or replace 
function create_file (_owner_id integer, _name text, 
          _type text, _parent_id integer) 
returns integer as $$
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
$$ language plpgsql;

create or replace 
function create_symlink (_user_id integer, 
       _file_id integer, 
       _parent_id integer) 
returns integer as $$
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
$$ language plpgsql;

-- TODO Faire en sorte qu'on ne puisse pas mettre un meme fichier
-- plusieurs fois dans ses favoris
-- TODO Autoriser les noms en doublons dans le dossier stared
-- TODO Gerer les star dans le dossier starred
create or replace function star (_user_id integer, _file_id integer) 
returns integer as $$
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
$$ language plpgsql;

create or replace 
function unstar (_user_id integer, _file_id integer) 
returns setof record as $$
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
$$ language plpgsql;

create or replace 
function rename_file (_user_id integer, _file_id integer, 
          _new_name text) 
returns void as $$
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
$$ language plpgsql;

-- TODO Noop if the user want to move a file at its current location
-- TODO Exception if the user tries to move a folder in itself
-- TODO Exception if the user tries to move a file to his starred
--   folder
create or replace 
function move_file (_user_id integer, _file_id integer,
        _new_parent_id integer) 
returns void as $$
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
  delete from file_tree
  where descendant_id in (select descendant_id from file_tree where ancestor_id = _file_id)
  and ancestor_id not in (select descendant_id from file_tree where ancestor_id = _file_id);

  -- insert subtree to its new location
  insert into file_tree (ancestor_id, descendant_id, dist)
  select supertree.ancestor_id, subtree.descendant_id,
  supertree.dist+subtree.dist+1
  from file_tree as supertree, file_tree as subtree
  where subtree.ancestor_id = _file_id
  and supertree.descendant_id = _new_parent_id;

end;
$$ language plpgsql;

create or replace 
function copy_file (_user_id integer, _file_id integer, _parent_id integer) 
returns integer as $$
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
$$ language plpgsql;

create or replace function delete_file(_user_id integer, _file_id integer) returns void as $$
declare
  deleted_flashcards_count integer;
begin
  select f.size into deleted_flashcards_count
  from files f 
  where f.id = _file_id;

  update users_files uf
  set 
    percentage = (uf.percentage * f.size + uf.rest_percentage) / (f.size - deleted_flashcards_count),
    rest_percentage = (uf.percentage * f.size + uf.rest_percentage) % (f.size - deleted_flashcards_count)
  from files f
  where f.id = uf.file_id
  and uf.file_id in (
    select ancestor_id
    from file_tree 
    where descendant_id = _file_id
  ); 

  update files
  set size = size - deleted_flashcards_count
  where id in (
    select ancestor_id
    from file_tree 
    where descendant_id = _file_id
  ); 
 
  with media_to_delete as (
    select id, count(*) links from (
      select f.term_media_id id
      from flashcards f
      where f.term_media_id is not null
      and f.deck_id in (
        select descendant_id
        from file_tree
        where ancestor_id = _file_id
      )
      union all
      select f.definition_media_id id
      from flashcards f
      where f.definition_media_id is not null
      and f.deck_id in (
        select descendant_id
        from file_tree
        where ancestor_id = _file_id
      )
    ) t
    group by id
  )
  update images i
  set links = i.links - m.links
  from media_to_delete m
  where i.id = m.id;

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
    and ancestor_id = _file_id
  );
end;
$$ language plpgsql;

create or replace function _update_file_size (_file_id integer, _size_diff integer)
returns void as $$
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
$$ language plpgsql;

create or replace function toggle_visibility (_user_id integer, _file_id integer)
returns void as $$
begin
  update files
  set visibility = (case visibility
    when 'public' then 'private'
    else 'public'
    end
  )
  where id = _file_id 
  and owner_id = _user_id;

  if not found then
    raise exception 'File id or owner id is invalid'
    using errcode = '2F004'; --modifying_sql_data_not_permitted;
  end if;
end;
$$ language plpgsql;
