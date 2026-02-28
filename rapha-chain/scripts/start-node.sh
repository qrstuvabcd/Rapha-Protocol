#!/bin/bash
# Rapha Chain - Node Startup Script
#
# This script starts a Rapha Chain node with:
# - Tendermint consensus
# - Ethermint EVM layer
# - PoMC consent verification
#
# Usage: ./start-node.sh [--validator] [--seed]

set -e

# Configuration
HOME_DIR=${RAPHA_HOME:-"$HOME/.rapha"}
BINARY="raphad"
LOG_LEVEL=${LOG_LEVEL:-"info"}

# Parse arguments
VALIDATOR_MODE=false
SEED_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --validator)
            VALIDATOR_MODE=true
            shift
            ;;
        --seed)
            SEED_MODE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "========================================="
echo "  Rapha Chain - Starting Node"
echo "========================================="
echo "Home: $HOME_DIR"
echo "Validator Mode: $VALIDATOR_MODE"
echo "Seed Mode: $SEED_MODE"
echo "Log Level: $LOG_LEVEL"
echo ""

# Check if node is initialized
if [ ! -f "$HOME_DIR/config/genesis.json" ]; then
    echo "Error: Node not initialized. Run init-chain.sh first."
    exit 1
fi

# Set up environment
export RAPHA_HOME="$HOME_DIR"

# Build command
CMD="$BINARY start --home $HOME_DIR"

# Add log level
CMD="$CMD --log_level $LOG_LEVEL"

# Validator-specific flags
if [ "$VALIDATOR_MODE" = true ]; then
    CMD="$CMD --minimum-gas-prices 0.0001urapha"
    CMD="$CMD --pruning custom"
    CMD="$CMD --pruning-keep-recent 100"
    CMD="$CMD --pruning-keep-every 0"
    CMD="$CMD --pruning-interval 10"
    echo "Starting as VALIDATOR node..."
fi

# Seed node flags
if [ "$SEED_MODE" = true ]; then
    CMD="$CMD --p2p.seed_mode true"
    echo "Starting as SEED node..."
fi

# Enable EVM JSON-RPC
CMD="$CMD --json-rpc.enable true"
CMD="$CMD --json-rpc.api eth,web3,net,txpool,debug"
CMD="$CMD --json-rpc.address 0.0.0.0:8545"
CMD="$CMD --json-rpc.ws-address 0.0.0.0:8546"

# Enable gRPC
CMD="$CMD --grpc.enable true"
CMD="$CMD --grpc.address 0.0.0.0:9090"

# Enable API server
CMD="$CMD --api.enable true"
CMD="$CMD --api.address tcp://0.0.0.0:1317"

echo ""
echo "Command: $CMD"
echo ""
echo "========================================="
echo "  Node Starting..."
echo "========================================="
echo ""
echo "Endpoints:"
echo "  - Tendermint RPC: http://localhost:26657"
echo "  - EVM JSON-RPC:   http://localhost:8545"
echo "  - EVM WebSocket:  ws://localhost:8546"
echo "  - gRPC:           http://localhost:9090"
echo "  - REST API:       http://localhost:1317"
echo ""
echo "PoMC Consensus active - All medical data requires consent proof"
echo "Gasless transactions enabled for Patient DIDs"
echo ""

# Start the node
exec $CMD
