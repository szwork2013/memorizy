from ubuntu:13.10

run apt-get -q update

# install node.js and npm
run apt-get install -yq git nodejs npm

#Make ssh dir
#RUN mkdir /root/.ssh/

# Copy over private key, and set permissions
#ADD /root/.ssh/id_rsa /root/.ssh/id_rsa

## Create known_hosts
#RUN touch /root/.ssh/known_hosts
## Add github key
#RUN ssh-keyscan github.com >> /root/.ssh/known_hosts

#run git clone git@github.com:CLevasseur/memorizy.git

RUN eval `ssh-agent -s` && \
    ssh-add id_rsa && \
    git clone git@github.com:CLevasseur/memorizy.git

run cd memorizy

# install app dependencies
run npm install

# Postgresql
run add-apt-repository ppa:pitti/postgresql 
run apt-get update
run apt-get install -y -q postgresql-client-9.3 postgresql-contrib-9.3 postgresql-client-9.3

user postgres

run service postgresql start &&\
    psql --command "alter user postgres with password 'postgres';" &&\
        createdb -O postgres memorizy

run cd /memorizy/server/src/db/plpgsql
run psql -f "all.sql"
run cd /memorizy

# Postgres default port
expose 5432

# Http server's port
expose 8080

cmd ["node", "server/src/app.js"]
