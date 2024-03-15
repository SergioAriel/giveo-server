FROM node:21-alpine3.18

WORKDIR /server

RUN apk add --no-cache git

ADD package*.json ./
ADD out ./

RUN npm install 

RUN mkdir -p /app

EXPOSE 3001

CMD ["npm", "run", "start"]