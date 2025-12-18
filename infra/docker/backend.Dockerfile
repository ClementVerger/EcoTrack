FROM node:20-alpine AS base
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .

FROM base AS development
ENV NODE_ENV=development
EXPOSE 8080
CMD ["npm","run","dev"]
