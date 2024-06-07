FROM node:current-alpine
RUN apk add --no-cache bash
COPY . /app
WORKDIR /app
RUN npm install
RUN npm run build