FROM node:current-alpine
RUN apk add --no-cache bash

RUN mkdir -p /home/node/app
RUN chown -R node:node /home/node/app

USER node

WORKDIR /home/node/app

COPY package.json .
RUN npm install

COPY . .

RUN npm run build

ENTRYPOINT ["npm", "start"]