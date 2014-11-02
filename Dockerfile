from ubuntu:14.04

# Http server's port
expose 3000

run apt-get -qq update

# install node.js and npm
run apt-get install -yq git nodejs npm

# make a link from nodejs to node
run ln -s $(which nodejs) $(dirname $(which nodejs))/node

# For deployment only
# add . /memorizy

# run cd /memorizy && \
    # npm install && \

run    npm install -g gulp mocha istanbul

cmd ["node", "/memorizy/app.js"]
