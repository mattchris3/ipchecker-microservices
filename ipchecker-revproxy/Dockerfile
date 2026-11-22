FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js config.json ./
EXPOSE 3000
USER node
CMD ["node", "server.js"]
