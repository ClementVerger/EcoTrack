FROM node:20-alpine AS base
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

FROM base AS development
ENV NODE_ENV=development
EXPOSE 5173
CMD ["npm","run","dev","--","--host","0.0.0.0"]
