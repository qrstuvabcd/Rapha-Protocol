# Rapha Chain Makefile
# Sovereign Medical-First Blockchain

BINARY := raphad
BUILD_DIR := ./build
GO_MODULE := github.com/rapha-chain/rapha
VERSION := v1.0.0
COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
LDFLAGS := -X github.com/cosmos/cosmos-sdk/version.Name=rapha \
           -X github.com/cosmos/cosmos-sdk/version.AppName=$(BINARY) \
           -X github.com/cosmos/cosmos-sdk/version.Version=$(VERSION) \
           -X github.com/cosmos/cosmos-sdk/version.Commit=$(COMMIT)

.PHONY: all build install clean test lint proto genesis

all: build

# Build the binary
build:
	@echo "Building $(BINARY)..."
	@go build -ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/$(BINARY) ./cmd/raphad

# Install the binary to GOPATH
install:
	@echo "Installing $(BINARY) to GOPATH..."
	@go install -ldflags "$(LDFLAGS)" ./cmd/raphad

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@rm -rf ~/.rapha

# Run tests
test:
	@echo "Running tests..."
	@go test -v ./x/consent/...
	@go test -v ./x/registry/...
	@go test -v ./x/taco/...
	@go test -v ./x/pharma/...
	@go test -v ./x/labvault/...
	@go test -v ./x/bounty/...
	@go test -v ./precompiles/...

# Run specific module tests
test-consent:
	@go test -v ./x/consent/...

test-pharma:
	@go test -v ./x/pharma/...

test-taco:
	@go test -v ./x/taco/...

# Run benchmarks
bench:
	@echo "Running benchmarks..."
	@go test -bench=. ./x/pharma/... -benchtime=5s
	@go test -bench=. ./x/consent/... -benchtime=5s

# Lint code
lint:
	@echo "Linting code..."
	@golangci-lint run --timeout 5m

# Generate protobuf files
proto:
	@echo "Generating protobuf files..."
	@cd proto && buf generate

# Initialize a local test chain
init-local:
	@echo "Initializing local test chain..."
	@$(BUILD_DIR)/$(BINARY) init test-node --chain-id rapha-test-1 --home ~/.rapha-test
	@cp genesis/genesis.json ~/.rapha-test/config/genesis.json

# Start a local test node
start-local:
	@echo "Starting local test node..."
	@$(BUILD_DIR)/$(BINARY) start --home ~/.rapha-test \
		--log_level info \
		--json-rpc.enable true \
		--json-rpc.address 0.0.0.0:8545

# Genesis commands
genesis:
	@echo "Genesis commands:"
	@echo "  make genesis-add-validator  - Add a validator to genesis"
	@echo "  make genesis-verify         - Verify genesis file"

genesis-verify:
	@echo "Verifying genesis file..."
	@$(BUILD_DIR)/$(BINARY) validate-genesis genesis/genesis.json

# Docker commands
docker-build:
	@echo "Building Docker image..."
	@docker build -t rapha-chain:$(VERSION) .

docker-run:
	@echo "Running Docker container..."
	@docker run -it --rm \
		-p 26656:26656 \
		-p 26657:26657 \
		-p 8545:8545 \
		-p 9090:9090 \
		rapha-chain:$(VERSION)

# Documentation
docs:
	@echo "Generating documentation..."
	@godoc -http=:6060 &
	@echo "Documentation available at http://localhost:6060/pkg/$(GO_MODULE)/"

# PLONK ceremony (for initial trusted setup)
plonk-setup:
	@echo "Running PLONK Universal Trusted Setup..."
	@echo "Note: This generates the Structured Reference String (SRS)"
	@go run ./scripts/plonk-ceremony/main.go

# State migration from existing contracts
migrate-state:
	@echo "Migrating state from existing contracts..."
	@./scripts/migrate-state.sh

# Help
help:
	@echo "Rapha Chain - Makefile Commands"
	@echo ""
	@echo "Build:"
	@echo "  make build        - Build the binary"
	@echo "  make install      - Install to GOPATH"
	@echo "  make clean        - Clean build artifacts"
	@echo ""
	@echo "Test:"
	@echo "  make test         - Run all tests"
	@echo "  make test-consent - Run consent module tests"
	@echo "  make test-pharma  - Run pharma module tests"
	@echo "  make bench        - Run benchmarks"
	@echo ""
	@echo "Development:"
	@echo "  make init-local   - Initialize local test chain"
	@echo "  make start-local  - Start local test node"
	@echo "  make lint         - Run linter"
	@echo "  make proto        - Generate protobuf files"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run Docker container"
	@echo ""
	@echo "Genesis:"
	@echo "  make genesis-verify - Verify genesis file"
	@echo ""
	@echo "Advanced:"
	@echo "  make plonk-setup    - Run PLONK trusted setup"
	@echo "  make migrate-state  - Migrate state from contracts"
