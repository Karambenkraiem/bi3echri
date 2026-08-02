# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# ---- dependencies (cached layer) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- dev (hot-reload, used by docker-compose.yml) ----
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN chmod +x docker-entrypoint.sh
EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]

# ---- build (compiles TS + prunes to prod deps) ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

# ---- production (lean runtime image) ----
FROM node:20-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/src/main"]
