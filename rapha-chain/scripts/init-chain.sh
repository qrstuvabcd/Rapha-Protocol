#!/bin/bash
# Rapha Chain - Node Initialization Script
#
# This script initializes a new Rapha Chain node with:
# - Genesis configuration
# - Validator keys
# - Node identity
#
# Usage: ./init-chain.sh [MONIKER] [CHAIN_ID]

set -e

# Configuration
MONIKER=${1:-"rapha-node-1"}
CHAIN_ID=${2:-"rapha-1"}
HOME_DIR=${RAPHA_HOME:-"$HOME/.rapha"}
BINARY="raphad"

echo "========================================="
echo "  Rapha Chain - Sovereign Medical Blockchain"
echo "  Initializing node: $MONIKER"
echo "  Chain ID: $CHAIN_ID"
echo "========================================="

# Check if binary exists
if ! command -v $BINARY &> /dev/null; then
    echo "Error: $BINARY not found. Please build the chain first:"
    echo "  make install"
    exit 1
fi

# Initialize the node
echo ""
echo "Step 1: Initializing node..."
$BINARY init "$MONIKER" --chain-id "$CHAIN_ID" --home "$HOME_DIR"

# Copy genesis file
echo ""
echo "Step 2: Copying genesis configuration..."
if [ -f "genesis/genesis.json" ]; then
    cp genesis/genesis.json "$HOME_DIR/config/genesis.json"
    echo "Genesis file copied successfully."
else
    echo "Warning: genesis.json not found. Using default genesis."
fi

# Copy configuration files
echo ""
echo "Step 3: Copying configuration files..."
if [ -f "config/config.toml" ]; then
    cp config/config.toml "$HOME_DIR/config/config.toml"
fi
if [ -f "config/app.toml" ]; then
    cp config/app.toml "$HOME_DIR/config/app.toml"
fi

# Generate validator key
echo ""
echo "Step 4: Generating validator key..."
$BINARY tendermint show-validator --home "$HOME_DIR"

# Create node key (for P2P)
echo ""
echo "Step 5: Node P2P identity..."
NODE_ID=$($BINARY tendermint show-node-id --home "$HOME_DIR")
echo "Node ID: $NODE_ID"

# Set up PLONK verification key (placeholder)
echo ""
echo "Step 6: Setting up PLONK verification key..."
echo "Note: PLONK Universal SRS will be configured during genesis ceremony."

# Display keyring information
echo ""
echo "Step 7: Keyring setup..."
echo "To create a new key:"
echo "  $BINARY keys add validator --home $HOME_DIR"
echo ""
echo "To import an existing key:"
echo "  $BINARY keys add validator --recover --home $HOME_DIR"

# Final status
echo ""
echo "========================================="
echo "  Node Initialization Complete!"
echo "========================================="
echo ""
echo "Home directory: $HOME_DIR"
echo "Chain ID: $CHAIN_ID"
echo "Node moniker: $MONIKER"
echo "Node ID: $NODE_ID"
echo ""
echo "Next steps:"
echo "  1. Create or import validator key"
echo "  2. Configure peer connections in config.toml"
echo "  3. Start the node: ./scripts/start-node.sh"
echo ""
echo "For validators (Edinburgh, HKU, CUHK nodes):"
echo "  - Ensure you have the shared PLONK SRS"
echo "  - Share your pubkey for genesis inclusion"
echo "  - Coordinate genesis ceremony"
echo ""
