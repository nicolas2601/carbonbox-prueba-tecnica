FROM oven/bun:1.3.12 AS backend-dependencies
WORKDIR /app/backend
USER root
COPY backend/package.json backend/bun.lock backend/prisma.config.ts ./
COPY backend/prisma ./prisma
RUN bun install --frozen-lockfile

FROM backend-dependencies AS backend-build
COPY backend/src ./src
RUN bun run db:generate \
    && bun build src/main/index.ts --target=node --packages=external --outfile=dist/api.js \
    && bun build src/workers/FileProcessingWorker.ts --target=node --packages=external --outfile=dist/worker.js

FROM oven/bun:1.3.12 AS backend-runtime-dependencies
WORKDIR /app/backend
USER root
COPY backend/package.json backend/bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts

FROM node:26.2-slim AS api
ENV NODE_ENV=production
WORKDIR /app/backend
COPY --from=backend-runtime-dependencies --chown=node:node /app/backend/node_modules ./node_modules
COPY --from=backend-build --chown=node:node /app/backend/dist ./dist
COPY --from=backend-build --chown=node:node /app/backend/src/generated/prisma ./src/generated/prisma
COPY --chown=node:node backend/package.json ./package.json
RUN mkdir -p /app/storage && chown node:node /app/storage
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3001/health/ready').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/api.js"]

FROM node:26.2-slim AS worker
ENV NODE_ENV=production
WORKDIR /app/backend
COPY --from=backend-runtime-dependencies --chown=node:node /app/backend/node_modules ./node_modules
COPY --from=backend-build --chown=node:node /app/backend/dist ./dist
COPY --from=backend-build --chown=node:node /app/backend/src/generated/prisma ./src/generated/prisma
COPY --chown=node:node backend/package.json ./package.json
RUN mkdir -p /app/storage && chown node:node /app/storage
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "try { process.kill(1, 0); process.exit(0); } catch { process.exit(1); }"
CMD ["node", "dist/worker.js"]

FROM backend-build AS migrate
USER bun
CMD ["bun", "run", "db:deploy"]
