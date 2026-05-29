# MailRite — Project Architecture

## Stack
- **Frontend:** React + Tailwind + Vite
- **Backend:** Express + TypeScript
- **Agent Harness:** Flue Framework (@flue/sdk)
- **Data Layer:** Coral SQL (SQL-over-API queries to LinkedIn, Gmail)
- **Blockchain:** Base L2 (Solidity — BasePaymentRouter.sol)
- **AI:** Google GenAI + Poke API

## Directory Structure

```
mailrite/
├── agents/                    # Flue agent harness files
│   └── outreach.agent.ts      # Main outreach agent (search, draft, pipeline)
├── contracts/
│   └── BasePaymentRouter.sol  # Base L2 payment routing (x402)
├── src/
│   ├── services/
│   │   ├── coralService.ts    # Coral SQL query layer
│   │   └── geminiService.ts   # AI contact search + draft generation
│   ├── App.tsx                # Main React UI
│   ├── types.ts               # TypeScript interfaces
│   └── main.tsx               # Entry point
├── server.ts                  # Express server (auth, payments, email)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mailrite App                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  React UI  ←→  Express Server  ←→  Flue Agent Harness      │
│                                         │                   │
│                     ┌───────────────────┼───────────────┐   │
│                     │                   │               │   │
│                     ▼                   ▼               ▼   │
│               Coral SQL          BasePaymentRouter    Poke  │
│            (LinkedIn/Gmail)      (x402 Payments)     (AI)   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Flow

1. **Coral SQL queries** LinkedIn, Gmail, etc. for contacts
2. **Flue agent** searches and ranks contacts by relevance to user prompt
3. **AI generates drafts** personalized per contact
4. **User reviews and sends** — x402 payment verified on Base
5. **Email sent** via SMTP

## Environment Variables

```bash
# Base Chain (x402 payments)
BASE_CHAIN_ID=8453
BASE_PAYMENT_ROUTER_ADDRESS=
X402_SEND_FEE_WEI=1000000000000
X402_STRICT=true

# Poke API (optional — fallback to local search)
POKE_API_BASE_URL=
POKE_API_KEY=
POKE_API_PATH=

# SMTP — Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Coral — SQL Query Layer
CORAL_BINARY_PATH=coral
CORAL_QUERY_TIMEOUT=30000

# App
APP_URL=http://localhost:3000
```

## Setup

```bash
# Install dependencies
npm install

# Deploy contract to Base mainnet
forge create contracts/BasePaymentRouter.sol:BasePaymentRouter \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY

# Set contract address in .env
echo "BASE_PAYMENT_ROUTER_ADDRESS=0x..." >> .env

# Run dev server
npm run dev
```

## Flue Skills

| Skill | Purpose |
|-------|---------|
| `coral-query` | Run SQL queries against LinkedIn, Gmail via Coral |
| `contact-search` | Searches connected social accounts for matching contacts |
| `outreach-draft` | Generates personalized email drafts |
| `full-outreach-pipeline` | End-to-end: search → rank → draft |
