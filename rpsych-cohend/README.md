
# Interpreting Cohen's d Effect Size: An Interactive Visualization 

This is the source code for ["Interpreting Cohen's d Effect Size: An Interactive Visualization"](https://rpsychologist.com/d3/cohend/).

## Running a local copy
The site is built using Gatsby/React, you can build it using Docker (`docker-compose`) or install it using `yarn` and then build it using `gatsby-cli`.

### Using Docker
#### Start a local copy in Gatsby's dev mode
```shell
docker-compose build
docker-compose up
```
Open [http://localhost:8000/](http://localhost:8000/)

#### Serve a local copy of the production version
```shell
docker-compose -f docker-compose.serve.yml build
docker-compose -f docker-compose.serve.yml up
```
Open [http://localhost:2015/d3/cohend](http://localhost:2015/d3/cohend)

### Without Docker
Requires Node.js and yarn.
```shell
yarn install
gatsby development
```
Open [http://localhost:8000/](http://localhost:8000/)