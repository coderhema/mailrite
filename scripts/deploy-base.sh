#!/bin/bash
# Deploy BasePaymentRouter to Base mainnet
# Usage: ./scripts/deploy-base.sh $PRIVATE_KEY $BASESCAN_API_KEY

set -e

PRIVATE_KEY=${1:?"Error: PRIVATE_KEY required (arg 1)"}
BASESCAN_API_KEY=${2:?"Error: BASESCAN_API_KEY required (arg 2)"}

echo "🚀 Deploying BasePaymentRouter to Base mainnet..."

# Check if forge is installed
if ! command -v forge &> /dev/null; then
    echo "Installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    source ~/.bashrc
    foundryup
fi

# Deploy contract
CONTRACT_ADDRESS=$(forge create contracts/BasePaymentRouter.sol:BasePaymentRouter \
    --rpc-url https://mainnet.base.org \
    --private-key "$PRIVATE_KEY" \
    --verify \
    --etherscan-api-key "$BASESCAN_API_KEY" \
    --json | jq -r '.deployedTo')

echo "✅ Contract deployed to: $CONTRACT_ADDRESS"
echo ""
echo "Add to your .env:"
echo "BASE_PAYMENT_ROUTER_ADDRESS=$CONTRACT_ADDRESS"
echo "X402_STRICT=true"
