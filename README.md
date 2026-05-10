## Milestone status

Milestone 1 is in progress, the Base payment routing contract draft has been added, and the Poke-backed outreach adapter plus x402 payment scaffolding are now wired into the server layer.

## Run locally

Prerequisites, Node.js

1. Install dependencies:
   npm install
2. Set the environment variables in [.env.local](.env.local)
3. Run the app:
   npm run dev

## Configuration

Use the following environment variables for the new flow,

- POKE_API_BASE_URL, the base URL for the Poke API adapter
- POKE_API_PATH, the request path used by the outreach adapter
- POKE_API_KEY, the bearer token used to call the Poke API
- BASE_CHAIN_ID, Base chain id, defaults to 8453
- BASE_PAYMENT_ROUTER_ADDRESS, the contract address used by the x402 quote flow
- X402_SEND_FEE_WEI, the per-send amount in wei
- X402_STRICT, set to true if the send endpoint should require an x402 receipt header before sending
