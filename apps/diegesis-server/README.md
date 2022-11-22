# diegesis-server
An Apollo-based server that caches Scripture from remote sources and serves them via a unified GraphQL interface.
Locally stored resources are converted to a succinct format using the Proskomma engine. test

Diegesis Server can currently interact with the following libraries
- DBL
- DCS
- eBible
- Vachan2

For these sources it provides
- catalog information, with very basic metadata, about available content
- a mechanism to download and cache USFM or USX for a particular translation
- conversion of USFM or USX to a Proskomma succinct JSON file for the entire docSet,
  either via an optional cron process or via an explicit GraphQL mutation
- augmented metadata for downloaded translations
- per-book USFM/USX via GraphQL
- per-translation succinct JSON via GraphQL

## Installation
* Clone this repository
```
git clone git@github.com:proskomma/diegesis-server
cd diegesis-server
npm install
node src/index.js # most things disabled, listening on port 2468, OR
node src/index.js config/debug_config.json # Most things enabled, listening on port 1234
# Point browser at http://localhost:<portNo> - the GraphQL sandbox is at /graphql
```

* Or pull the docker image from [here](https://hub.docker.com/r/mvhsolutions/diegesis-server)
```
docker pull mvhsolutions/diegesis-server
```

* Or build your own docker image with the help of the provided Dockerfile
_Make sure you are in the root of the monorepo folder_
```
docker build -t proskomma/diegesis-server -f diegesis-server/Dockerfile .
```

See also the Docker documentation at the end of this document

## Overview of the GraphQL
Note that the Apollo sandbox will only work when `debug` is enabled, because the sandbox relies on cross-site scripting which is generally Not What We Want In Production.
### Queries
#### Organizations
The data sources from which Diegesis Server may cache content.
```
{orgs { name } }
```
#### Catalog Entries
Translations available from the organizations (which may or may not be cached locally).
```
{
  org(name: "eBible") {
    catalogEntries {
      id
      languageCode
      title
      hasLocalUsfm
      hasLocalUsx
      hasLocalSuccinct
    }
  }
}

{
  org(name: "eBible") {
    catalogEntries(withLanguageCode: ["fra", "eng"]) {
      id
    }
  }
}

# There are several other filter options for `catalogEntries`

{
  org(name: "eBible") {
    catalogEntry(id:"fraLSG") {
      id
    }
  }
}
```

#### Local Translations
Translations for which Scripture content plus additional metadata has been cached. The cached USFM or USX for a book may be read from a single endpoint. If succinct JSON has been generated (either via the cron process or via an explicit mutation), this can also be read from a single endpoint.
```
# Uninteresting until some translations have been cached using mutation or cron.
{
  org(name: "eBible") {
    localTranslations(withLanguageCode:"fra") {
      id
      textDirection
      script
      copyright
      abbreviation
      nUsfmBooks
      hasUsfmBookCode(code:"PHM")
      usfmForBookCode(code:"PHM")
      hasSuccinct
      succinct
      hasVrs
      vrs
    }
  }
}

{
  org(name: "eBible") {
    localTranslation(id:"fraLSG") {
      id
    }
  }
}
```

### Mutations
Note that `includeMutations` must be enabled for this to work...
#### Fetch USFM/USX
```
mutation {
  fetchUsfm(org: "eBible", translationId: "fraLSG")
}

mutation {
  fetchUsx(org: "DBL", translationId: "de4e12af7f28f599")
}
```
#### Make Succinct
This may also happen via the cron, if configured.
```
mutation {
  makeSuccinct(org: "eBible", translationId: "fraLSG")
}
```

## Configuration
See
- `config/default_config.json`: the standard, (excessively) prudent config
- `config/debug_config.json`: an 'everything enabled' config for debugging
- `config/docker_config.json`: minor tweaks for Docker usage

### HTTP
- `hostName`: default is 'localhost'.
- `port`: default is 2468.

### Directory usage
- `dataPath`: the directory within which Scripture data will be stored. Default is 'data' within the repo.
- `staticPath`: The directory from which static content will be stored. There is no default.

### Security
- `useCors`: whether to enable wildcard CORS. Default is false.
- `debug`: Default is false. When enabled, this
    - relaxes Helmet security settings to allow the Apollo sandbox to function
    - enables some convenience HTML endpoints
    - enables stack traces in GraphQL errors
- `includeMutations`: whether to include mutations. Without this, the GraphQL becomes read-only, ie it is impossible to download or process new content. The default is false.

### Data sources and processing
- `orgs`: an array of organization names for which handlers should be loaded. Default is [] which means 'all'.
- `localUsfmPath`: the directory from which local USFM translations should be copied into the data directory. There is no default.
- `localUsxPath`: the directory from which local USX translations should be copied into the data directory. There is no default.
- `cronFrequency`: Controls how often the cron job that generates succinct JSON is run. Default is 'never'.

### Reporting
- `logAccess`: whether to log HTTP access. Default is false.
- `logFormat`: the Morgan format to use for HTTP logs, if enabled. Default is 'combined', ie combined Apache format.
- `accessLogPath`: the path to which HTTP access logs should be written, if enabled. There is no default.
- `verbose`: whether to output startup information. Default is false.

## Writing a new org handler
New org handlers go in `orgHandlers`

Look at the existing examples. Your org handler directory should include
- JSON called `org.json` containing a unique `name` and `translationDir`.
- a module called `translations.js` that returns `getTranslationsCatalog`, `fetchUsfm` and `fetchUsx`

## Using Docker
_We assume you went with the pre-built image_

### Running with standard configuration
```
docker run --rm -d -p 3060:2468 --name=diegesis-server mvhsolutions/diegesis-server
```

### Running with custom configuration
Put your `config.json` file inside a directory `config` and then run
```
docker run --rm -d -p 3060:2460 -v /abs/path/to/config/:/app/config/ --name=diegesis-server mvhsolutions/diegesis-server
```
* `--rm` removes container after use
* `-d` runs as daemon
* `-p 3060:1234` exposes container port 2468 on local port 3060
* `-v /abs/path/to/config/:/app/config/` 'bind mounts' the external config directory into your Docker container. This enables you to edit the configuration on the fly.

### Stopping
```
docker stop diegesis-server
```

### Removing (when --rm option not used to run)
```
docker rm diegesis-server
```

### Error log (when --rm option not used to run)
```
docker logs diegesis-server
```

### Monitoring
#### Overview
```
docker ps
```

#### Resource usage
```
docker stats
```

