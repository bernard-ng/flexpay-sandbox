# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM oven/bun:1.4.2 AS bun

FROM --platform=$BUILDPLATFORM node:24-bookworm-slim AS frontend-build

COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /frontend

COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

COPY frontend/src ./src
COPY frontend/vite.config.ts frontend/tsconfig.json ./
RUN bun run build

FROM rust:1.99-bookworm AS backend-build

WORKDIR /build

COPY backend/Cargo.toml backend/Cargo.lock ./
COPY backend/src ./src

RUN --mount=type=cache,target=/usr/local/cargo/registry,sharing=locked \
    --mount=type=cache,target=/build/target,sharing=locked \
    cargo build --release --locked \
    && cp target/release/flexpay_sandbox /usr/local/bin/flexpay_sandbox

FROM debian:bookworm-slim AS release

LABEL org.opencontainers.image.licenses="MIT"

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 sandbox \
    && useradd --uid 10001 --gid sandbox --no-create-home sandbox \
    && mkdir -p /app/data /app/frontend \
    && chown -R sandbox:sandbox /app

WORKDIR /app

COPY --from=backend-build /usr/local/bin/flexpay_sandbox /usr/local/bin/flexpay_sandbox
COPY --from=frontend-build --chown=sandbox:sandbox /frontend/dist/client /app/frontend
COPY LICENSE /usr/share/licenses/flexpay-sandbox/LICENSE

ENV FLEXPAY_BIND=0.0.0.0:8080 \
    FLEXPAY_DATABASE=/app/data/flexpay.db \
    FLEXPAY_FRONTEND=/app/frontend \
    RUST_LOG=flexpay_sandbox=info

USER sandbox

EXPOSE 8080
STOPSIGNAL SIGINT

HEALTHCHECK --interval=5s --timeout=2s --start-period=5s --retries=10 \
    CMD curl --fail --silent http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/usr/local/bin/flexpay_sandbox"]
