from ubuntu:13.10

run apt-get update

# install node.js and npm
run apt-get install -y git nodejs npm

#Make ssh dir
RUN mkdir /root/.ssh/

# Copy over private key, and set permissions
run ssh-keygen -f id_rsa -t rsa -N 'hello world !'
run ls
ADD id_rsa /root/.ssh/id_rsa

# Create known_hosts
RUN touch /root/.ssh/known_hosts
# Add github key
RUN ssh-keyscan github.com >> /root/.ssh/known_hosts

run git clone git@github.com:CLevasseur/memorizy.git

run cd memorizy

# install app dependencies
run npm install

expose 8080
cmd ["node", "server/src/app.js"]
