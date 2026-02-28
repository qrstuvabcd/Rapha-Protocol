# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git make gcc musl-dev

# Copy go mod files
COPY go.mod go.sum* ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o raphad ./cmd/raphad

# Final stage
FROM alpine:latest

WORKDIR /root

# Install ca-certificates for HTTPS
RUN apk add --no-cache ca-certificates

# Copy binary from builder
COPY --from=builder /app/raphad /usr/local/bin/raphad

# Create data directory
RUN mkdir -p /root/.rapha

# Expose ports
# 8545 - EVM JSON-RPC
# 26657 - Tendermint RPC
# 1317 - REST API
# 9090 - gRPC
EXPOSE 8545 26657 1317 9090

# Initialize and start
ENTRYPOINT ["raphad"]
CMD ["start", "--home", "/root/.rapha"]
