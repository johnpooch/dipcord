FROM node:current-alpine
COPY . /app
WORKDIR /app
RUN npm install
RUN npm run build
ENTRYPOINT ["npm", "run", "deploy-commands-and-start"]