FROM oven/bun:1.3.12 AS frontend-dependencies
WORKDIR /app/frontend
USER root
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

FROM node:26.2-slim AS frontend-build
WORKDIR /app/frontend
COPY --from=frontend-dependencies /app/frontend/ ./
COPY frontend/ ./
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ARG NEXT_STANDALONE=1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_STANDALONE=${NEXT_STANDALONE}
ENV NEXT_TELEMETRY_DISABLED=1
RUN node node_modules/next/dist/bin/next build

FROM node:26.2-slim AS frontend
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app/frontend
COPY --from=frontend-build --chown=node:node /app/frontend/.next/standalone ./
COPY --from=frontend-build --chown=node:node /app/frontend/.next/static ./.next/static
COPY --from=frontend-build --chown=node:node /app/frontend/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/').then(response => process.exit(response.status === 200 ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
