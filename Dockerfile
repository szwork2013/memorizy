from ubuntu:13.10

run apt-get update

# install node.js and npm
run apt-get install -y git nodejs npm

run find / -name "memorizy"

# install app dependencies
run npm install

expose  8080
cmd ["node", "app.js"]
