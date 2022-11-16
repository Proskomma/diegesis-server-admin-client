# diegesis-server-admin-client
The admin-client provides a web GUI to the Diegesis server. 
Currently, it only shows all the Entries per organization, and provides a way to download content into Diegesis for better caching.

_This might be historical very soon_
The build step described below creates a couple of static files (CSS and JS) that are being picked up by Diegesis and shown to the end user.

## Setup
This client is currently designed to connect to Diegesis Server through `localhost` over port `1234`. This is currently hardcoded, but will be made configurable in the near future.

### Building
The following steps will install all the requirements for the app, and subsequently create a directory `build` with all the needed static artifacts.
```
npm install
npm run build 
```

### Configuring Diegesis Server
- Create a directory called `local` at the root of the Diegesis Server directory. (It will be ignored by Git.)
- Copy `debug_config.json` into that directory, rename as, say, `my_admin_config.json`.
_By putting this file in the `local` directory, does it override the original config?_

- Open that file in a text editor and add a line similar to this:
  ```"staticPath": "/home/myName/repos/diegesis-server-admin-client/build"```
  with an absolute ('begins with a /') path to the build directory in the client repo

## Usage
- Start up Diegesis Server, passing the path to your config file as the only argument
- Visit the homepage of that server, eg `http://localhost:<portNo>/`. You should see a page like this (include link to image)
- For every translation that you want to have stored locally, click on the download icon (image).
- Data will be downloaded into `dataPath` in the config file or, by default, into the `data` directory of the Diegesis Server directory. One succinct file per minute will be generated if the `cron` option is enabled.

## Security
This client is intended for use by admins when setting up Diegesis Server to serve local content. This might be needed when internet access is not available or not desired.

Because the admin-client has no password protection and allows mutations on the data, it should not be run on a public network.

A possible production workflow would be
- Setup the diegesis-server + admin-client combo in a development environment. 
- Run as described above to download content and generate succinct docSets
- Run Diegesis Server on a public port (preferably behind a reverse proxy such as Nginx or Apache) with mutations disabled and without a path to this admin client.
- Copy all the content from the `data` directory from the development environment to the public Diegesis server