#!/bin/bash
# Aura Health - CDK Devnet Startup Script
# Uses Mock Prover for 16GB RAM environments

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CDK_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting Aura Health CDK Devnet (Mock Prover Mode)"
echo "=================================================="

cd "$CDK_DIR"

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Pull images if needed
echo "📦 Pulling required images..."
docker-compose pull

# Start services
echo "🔄 Starting CDK services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Health check
echo "🔍 Checking node health..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -X POST http://localhost:8545 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
        | grep -q "0x3e9"; then
        echo "✅ CDK Node is healthy! Chain ID: 1001 (0x3e9)"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Retry $RETRY_COUNT/$MAX_RETRIES..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "⚠️  Node not responding. Check logs with: docker-compose logs cdk-node"
    exit 1
fi

echo ""
echo "🎉 Aura Health CDK Devnet is running!"
echo "=================================================="
echo "RPC URL:       http://localhost:8545"
echo "WebSocket:     ws://localhost:8546"
echo "Bridge API:    http://localhost:8080"
echo "Chain ID:      1001"
echo ""
echo "Test Accounts (Prefunded with 100,000 ETH):"
echo "  Account 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "  Account 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
echo "  Account 2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
echo ""
echo "⚠️  Mock Prover Mode: ZK proofs are simulated"
echo "=================================================="
