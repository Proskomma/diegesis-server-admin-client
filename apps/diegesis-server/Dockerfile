#Stage 1: client builder
FROM node:current-alpine
ARG client_loc=./diegesis-user-client

# Working inside build
WORKDIR /build

COPY $client_loc/src/ src/
COPY $client_loc/public/ public/
COPY $client_loc/node_modules/ node_modules/
COPY $client_loc/package.json .
COPY $client_loc/package-lock.json .

# Install
RUN npm install --legacy-peer-deps
RUN npm run build

#Stage 2: runner
FROM node:current-alpine
ARG server_loc=./diegesis-server

# Working from /app
WORKDIR /app

# This copies the just built client-code straight into the static folder
COPY --from=0 /build/build/ static/

COPY $server_loc/data/ data/
COPY $server_loc/src/ src/
COPY $server_loc/LICENSE .
COPY $server_loc/package.json .
COPY $server_loc/package-lock.json .
COPY $server_loc/config/docker_config.json config/config.json

# Install
RUN npm install

CMD [ "node", "src/index.js", "config/config.json" ]
