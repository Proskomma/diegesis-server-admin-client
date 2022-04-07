FROM node:current-alpine

# Working from /app
WORKDIR /app

COPY data/ data/
COPY src/ src/
COPY LICENSE .
COPY package.json .
COPY package-lock.json .
COPY default_config.json config.json

# Install
RUN npm install

CMD [ "node", "src/index.js", "config.json" ]
