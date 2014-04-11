-- Missing schema dump !

-- Setup all plpgsql functions
\i ./plpgsql/all.sql 

delete from files;
delete from users;

insert into users (id, name, password, email, enabled) values (
	0, 'root', 'root', 'root@memorizy', false);

insert into files (id, owner_id, name, size, type) values (
	0, 0, 'root', 0, 'folder');

insert into file_tree (ancestor_id, descendant_id, dist) values ( 0, 0, 0 );

-- insert study modes

insert into study_orders (mode) values ('Classic');
insert into study_orders (mode) values ('Hardest to easiest');
insert into study_orders (mode) values ('Least studied');
insert into study_orders (mode) values ('Wrongs');
