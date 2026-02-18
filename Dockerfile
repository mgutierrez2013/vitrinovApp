FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY docker/start-expo.sh /usr/local/bin/start-expo.sh

EXPOSE 8081 19000 19001 19002 19006

CMD ["start-expo.sh"]
