FROM node:13-buster-slim 
RUN yarn global add gatsby-cli
WORKDIR /app
COPY . ./
RUN yarn --pure-lockfile
CMD ["./gatsby-start.sh"]
