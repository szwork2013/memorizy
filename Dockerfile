from ubuntu:13.10

# Postgres default port
expose 5432

# Http server's port
expose 8080

run apt-get -qq update

# install node.js and npm
run apt-get install -yq git nodejs npm

# make a link from nodejs to node
run ln -s $(which nodejs) $(dirname $(which nodejs))/node

RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys B97B0AFCAA1A47F044F244A07FCC7D46ACCC4CF8
RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ precise-pgdg main" > /etc/apt/sources.list.d/pgdg.list

RUN apt-get update

RUN apt-get -y -q install python-software-properties software-properties-common
RUN alias adduser='useradd' && DEBIAN_FRONTEND=noninteractive apt-get -y install postgresql postgresql-contrib
VOLUME  ["/etc/postgresql", "/var/log/postgresql", "/var/lib/postgresql"]

add . /memorizy

run cd /memorizy && \
    npm install

user postgres
run service postgresql start &&\
    psql --command "alter user postgres with password 'postgres';" &&\
    createdb memorizy

# Adjust PostgreSQL configuration so that remote connections to the
# database are possible. 
RUN echo "host all  all    0.0.0.0/0  md5" >> /etc/postgresql/9.3/main/pg_hba.conf

# And add ``listen_addresses`` to ``/etc/postgresql/9.3/main/postgresql.conf``
RUN echo "listen_addresses='*'" >> /etc/postgresql/9.3/main/postgresql.conf

run cd /memorizy/server/src/db/plpgsql && \
    psql -f "all.sql"

cmd ["node", "/memorizy/server/src/app.js"]
