-- Missing schema dump !
-- \i ./db/memorizy_dump.sql;

-- commit;

-- Setup all plpgsql functions
\i ./db/plpgsql/all.sql; 

commit;

delete from files;
delete from users;

insert into users (id, name, password, email, enabled) values (
	0, 'root', 'root', 'root@memorizy', false);

insert into files (id, owner_id, name, size, type) values (
	0, 0, 'root', 0, 'folder');

insert into file_tree (ancestor_id, descendant_id, dist) values ( 0, 0, 0 );

-- insert study modes

insert into flashcard_orders (flashcard_order) values ('Classic');
insert into flashcard_orders (flashcard_order) values ('Hardest to easiest');
insert into flashcard_orders (flashcard_order) values ('Least studied');
insert into flashcard_orders (flashcard_order) values ('Wrongs');

commit;
