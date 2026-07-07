FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY docker-entrypoint.js ./

EXPOSE 5000

CMD ["node", "docker-entrypoint.js"]
