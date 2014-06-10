FROM    ubuntu:13.10

RUN     apt-get update

# Install Node.js and npm
RUN     apt-get install -y ls nodejs npm

RUN     ls

# Install app dependencies
RUN     npm install

EXPOSE  8080
CMD ["node", "app.js"]
