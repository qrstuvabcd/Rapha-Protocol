#!/bin/bash
# Aura Health - CDK Devnet Shutdown Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CDK_DIR="$(dirname "$SCRIPT_DIR")"

echo "🛑 Stopping Aura Health CDK Devnet..."

cd "$CDK_DIR"

# Stop all containers
docker-compose down

echo "✅ CDK Devnet stopped."
echo ""
echo "To remove all data, run:"
echo "  docker-compose down -v"
