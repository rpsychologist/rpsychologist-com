FROM node:13-buster-slim 
RUN yarn global add gatsby-cli
WORKDIR /app
COPY . ./
RUN yarn --pure-lockfile
RUN chmod +x seed_dummy_data.sh
RUN ./seed_dummy_data.sh
