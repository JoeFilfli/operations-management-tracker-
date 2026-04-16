# Stage 1 — build the Vite app
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Bake the backend URL into the JS bundle at build time.
# Pass --build-arg VITE_API_BASE_URL=https://... when building for production.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Stage 2 — serve with nginx
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
# Store as template; envsubst fills in $PORT at container startup
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

EXPOSE 80

# Railway injects $PORT; substitute it into the config then start nginx
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
