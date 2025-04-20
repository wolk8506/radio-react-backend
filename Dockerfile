FROM node:23-alpine

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 8080

CMD ["node", "bin/server"]
