# Multi-stage build: compile in slim Rust image, ship in distroless ~80 MB.
# Caches the dependency layer separately so most rebuilds are fast.

FROM rust:1-bookworm AS builder
WORKDIR /app

# Pre-fetch deps via a stub main.rs so the cargo registry layer caches.
COPY Cargo.toml Cargo.lock ./
RUN mkdir -p src \
    && echo "fn main() {}" > src/main.rs \
    && cargo build --release \
    && rm -rf src target/release/deps/analytics_ingest* target/release/analytics-ingest*

# Now copy the real source and rebuild — only this layer changes on code edits.
COPY src ./src
RUN cargo build --release

# Distroless runtime — minimal attack surface, no shell, no package manager.
FROM gcr.io/distroless/cc-debian12
WORKDIR /
COPY --from=builder /app/target/release/analytics-ingest /usr/local/bin/analytics-ingest
EXPOSE 3000
USER nonroot:nonroot
ENTRYPOINT ["/usr/local/bin/analytics-ingest"]
