from ubuntu:13.10

run apt-get -q update

# install node.js and npm
run apt-get install -yq git nodejs npm

RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ precise-pgdg main" > /etc/apt/sources.list.d/pgdg.list

RUN apt-get update

RUN apt-get -y -q install python-software-properties software-properties-common
RUN apt-get -y -q install postgresql-9.3 postgresql-client-9.3 postgresql-contrib-9.3

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
