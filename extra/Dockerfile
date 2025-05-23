# Étape 1 : Builder
FROM node:18-alpine as builder

WORKDIR /app

COPY . .

RUN npm install --legacy-peer-deps
RUN npm run build:web

# Étape 2 : Image NGINX minimale
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
