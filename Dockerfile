FROM node:lts-alpine

WORKDIR /server

RUN apk add git
RUN apk add --no-cache python3
RUN apk add --no-cache build-base

ADD package*.json ./
ADD out ./

RUN npm install

RUN mkdir -p /app
EXPOSE 3001

CMD ["npm", "run", "start"]
