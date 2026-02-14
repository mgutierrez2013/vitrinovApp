FROM node:20-alpine

WORKDIR /app

# Keep this lightweight: source code is mounted as a volume in docker-compose.
COPY package.json ./

EXPOSE 8081 19000 19001 19002

CMD ["sh", "-c", "npm install && npx expo start --host lan --non-interactive"]
