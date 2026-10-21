# Stage 1: build the static site with Eleventy (production mode: drafts skipped, review comments stripped)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG OGE_PREVIEW=1
ENV ELEVENTY_ENV=production OGE_PREVIEW=$OGE_PREVIEW
RUN npx eleventy

# Stage 2: serve the generated files with nginx (tiny image, ~10 MB)
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/_site /usr/share/nginx/html
EXPOSE 80
