from ubuntu:13.10

run apt-get update

# install node.js and npm
run apt-get install -y git nodejs npm

run git clone https://github.com/clevasseur/memorizy.git
run cd ./memorizy

# install app dependencies
run npm install

expose  8080
cmd ["node", "app.js"]
