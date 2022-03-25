FROM node:current-alpine

# Working from /app
WORKDIR /app

COPY data/ data/
COPY src/ src/
COPY LICENSE .
COPY package.json .
COPY package-lock.json .

# Upgrade npm first
RUN npm install -g npm
# Install
RUN npm install

WORKDIR /app/src

CMD [ "node", "index.js" ]
