from ubuntu:14.04

run apt-get -qq update

# install node.js and npm
run apt-get install -yq git nodejs npm

# make a link from nodejs to node
run ln -s $(which nodejs) $(dirname $(which nodejs))/node

run npm install -g gulp mocha istanbul karma-cli

cmd ["gulp"]
