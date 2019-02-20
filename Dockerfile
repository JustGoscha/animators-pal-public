FROM node:latest
WORKDIR /usr/app

COPY package*.json ./
COPY tsconfig.json ./
COPY tslint.json ./
COPY src ./

RUN npm install

CMD [ "npm", "start" ]
