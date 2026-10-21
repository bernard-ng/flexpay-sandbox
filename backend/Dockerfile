# syntax=docker/dockerfile:1

FROM rust:1.99-bookworm AS build

WORKDIR /build

COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN --mount=type=cache,target=/usr/local/cargo/registry,sharing=locked \
    --mount=type=cache,target=/build/target,sharing=locked \
    cargo build --release --locked \
    && cp target/release/flexpay_sandbox /usr/local/bin/flexpay_sandbox

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 sandbox \
    && useradd --uid 10001 --gid sandbox --no-create-home sandbox \
    && mkdir -p /app/data /app/frontend \
    && chown -R sandbox:sandbox /app

WORKDIR /app

COPY --from=build /usr/local/bin/flexpay_sandbox /usr/local/bin/flexpay_sandbox

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
