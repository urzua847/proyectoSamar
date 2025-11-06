FROM node:20-alpine AS builder

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./

RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app/server

COPY server/package.json server/package-lock.json ./

RUN npm install --production

COPY server/ ./

COPY --from=builder /app/client/dist ./public/

EXPOSE 5000
CMD [ "node", "src/index.js" ]