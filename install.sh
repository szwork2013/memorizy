#!/bin/bash

PROJECT_NAME="memorizy"
DB_NAME="memorizy"
PG_USER="postgres"
PG_VERSION="9.1"
PSQL_FUNCTIONS_DIR=`dirname "$0"`/db/functions

NODE_PACKAGES="nodejs npm"
POSTGRES_PACKAGES="postgresql-9.1 postgresql-client-9.1 postgresql-common postgresql-contrib-9.1 postgresql-server-dev-9.1"

# Setup node and npm

apt-get install "$NODE_PACKAGES"

node_location=`which node || which nodejs || echo "Node could not be found" && exit -1`
filename=`basename "$node_location"`

if [[ "$filename" == "nodejs" ]]; then
  dirname=`dirname "$node_location"`
  ln -s "$node_location" "$dirname"/node
fi

NPM_GLOBAL_PACKAGES="express mocha phantomjs"
npm install -g $NPM_GLOBAL_PACKAGES
npm install

# Setup postgres and connect-pg (for session storage)

apt-get install "$POSTGRES_PACKAGES"

pg_createcluster "$PG_VERSION" "$PROJECT_NAME"
createdb "$PROJECT_NAME"

# install pgtap for connect-pg tests
wget http://api.pgxn.org/dist/pgtap/0.94.0/pgtap-0.94.0.zip
unzip pgtap-0.94.0.zip
rm -vf pgtap-0.94.0.zip
cp pgtap-0.94.0/ /tmp/
chmod /tmp/pgtap-0.94.0 777 -R
old_pwd=`pwd`
cd /tmp/pgtap-0.94.0

echo "postgres password (system user, not db)" 
su postgres -c "make && make installcheck && make install || exit -1"

cd ..
rm -rf pgtap-0.94.0
cd $old_pwd

psql -U "$PG_USER" -h localhost -d "$DB_NAME" -c "create extension pgtap" -e 
psql -U "$PG_USER" -h localhost -d "$DB_NAME" -c "\i $PSQL_FUNCTIONS_DIR/all.sql" -e 
psql -U "$PG_USER" -h localhost -d "$DB_NAME" -f ./node_modules/connect-pg/lib/session_install.sql -e
psql -U "$PG_USER" -h localhost -d "$DB_NAME" -c "alter user nodepg with password 'nodepg'"
