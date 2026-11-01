# Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# Run
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=5000 UPLOAD_DIR=/data/uploads
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/shared ./shared
VOLUME ["/data/uploads"]
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:5000/healthz || exit 1
CMD ["node", "dist/index.js"]
