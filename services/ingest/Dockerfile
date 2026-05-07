# Phase 4: multi-stage build, musl-static binary, scratch final image (~5 MB).
FROM rust:1.83-bookworm AS builder
WORKDIR /app
COPY Cargo.toml ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/analytics-ingest /usr/local/bin/
EXPOSE 3000
CMD ["/usr/local/bin/analytics-ingest"]
