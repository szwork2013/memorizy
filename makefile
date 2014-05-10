all: local global db 

local: npm
	npm install

global: npm 
	npm install -g express mocha istanbul
	
npm:
	apt-get install npm

db: postgresql
	pg_lsclusters -h | cut -f2 -d ' ' | grep main \
		|| pg_createcluster \
		$(shell psql --version | grep -Eo [0-9]+\\.[0-9]+) \
		main
	service postgresql start
	su -c "psql -c \"alter user postgres with password 'postgres'\"" postgres
	su -c "createdb -O postgres -h 127.0.0.1 -p $(shell pg_lsclusters -h | cut -f2,3 -d' ' | grep -Eo ^main[\ ]+[0-9]+ | grep -Eo [0-9]+) memorizy" postgres
	su -c "psql memorizy -c \"\i ./db/memorizy_dump.sql\"" postgres
	su -c "psql memorizy -c \"\i ./db/init.sql\"" postgres

postgresql:
	apt-get install -y postgresql postgresql-client-common postgresql-common

test : 
	mocha --reporter spec 
	mocha-phantomjs test/client/*.html -R spec 

coverage :
	istanbul cover _mocha -- -R dot 

.PHONY: test coverage

