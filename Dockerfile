from ubuntu:13.10

run apt-get -q update

# install node.js and npm
run apt-get install -yq git nodejs npm

# install add-apt-repository cmd
run apt-get install software-properties-common

# Postgresql
run add-apt-repository ppa:pitti/postgresql 
run apt-get update
run apt-get install -y -q postgresql-server-9.3 postgresql-contrib-9.3 postgresql-client-9.3


add . /memorizy

run cd /memorizy && \
    npm install

user postgres
run service postgresql start &&\
    psql --command "alter user postgres with password 'postgres';" &&\
    createdb -O postgres memorizy

run cd /memorizy/server/src/db/plpgsql && \
    psql -f "all.sql"

# Postgres default port
expose 5432

# Http server's port
expose 8080

cmd ["node", "/memorizy/server/src/app.js"]
