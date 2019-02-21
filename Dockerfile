FROM node:latest
WORKDIR /usr/app

COPY animators-pal.json ./
COPY package*.json ./
COPY tsconfig.json ./
COPY tslint.json ./
COPY src ./src

RUN npm install
RUN npm run build

CMD node dist/bin/start-bot
