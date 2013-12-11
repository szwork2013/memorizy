delete from files;
delete from users;

insert into users (id, username, password, email, enabled) values (
	0, 'root', 'root', 'root@study', false);

insert into files (id, owner_id, filename, size, type) values (
	0, 0, 'root', 0, 'folder');

insert into file_tree (ancestor_id, descendant_id, dist) values ( 0, 0, 0 );
