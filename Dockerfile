FROM    ubuntu:13.10

# Install Node.js and npm
RUN     apt-get install -y nodejs npm

# Install app dependencies
RUN npm install

EXPOSE  8080
CMD ["node", "/src/index.js"]
