# diegesis-server-admin-client
A web client for downloading content into Diegesis Server

## Setup
This client is designed to be served by Diegesis Server.
### Building
```
npm install
npm run build 
```
### Configuring Diegesis Server
- Create a directory called `local` at the root of the Diegesis Server directory. (It will be ignored by Git.)
- Copy `debug_config.json` into that directory, rename as, say, `my_admin_config.json`.
- Open that file in a text editor and add a line similar to this:
  ```"staticPath": "/home/myName/repos/diegesis-server-admin-client/build"```
  with an absolute ('begins with a /') path to the build directory in the client repo

## Usage
- Start up Diegesis Server, passing the path to your config file as the only argument
- Visit the homepage of that server, eg `http://localhost:<portNo>/`
- Data will be downloaded into `dataPath` in the config file or, by default, into the `data` directory of the Diegesis Server directory. One succinct file per minute will be generated if the `cron` option is enabled.

## Security
This client is intended for use by admins when setting up Diegesis Server to serve local content. It should not be run on a public network.
A typical production workflow would be
- run as above on localhost, to download content and generate succinct docSets
- run Diegesis Server on a public port (preferably proxied behind another web server such as Apache) with mutations disabled and without a path to this admin client.

Alternatively, if it is not possible to run the client on localhost, the client could be run elsewhere, and then the `dataPath` directory
could be uploaded to the server, with the config on the server pointing to the location of that uploaded directory.
