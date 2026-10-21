# syntax=docker/dockerfile:1

FROM oven/bun:1.4.2 AS bun

FROM node:24-bookworm-slim

COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

RUN mkdir -p /app && chown node:node /app

WORKDIR /app
USER node

COPY --chown=node:node package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY --chown=node:node . .
RUN bun run build

EXPOSE 8080

HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=10 \
    CMD node -e "fetch('http://127.0.0.1:8080/').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["bun", "run", "dev", "--host", "0.0.0.0", "--port", "8080", "--strictPort"]
