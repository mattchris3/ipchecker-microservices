FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src/ ./src/
# The saved lists live on a Docker volume mounted here (see docker-compose.yml).
RUN mkdir -p data && chown node:node data
EXPOSE 3000
USER node
CMD ["node", "src/app.js"]
