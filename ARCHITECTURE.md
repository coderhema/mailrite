# MailRite — Project Architecture

## Stack
- **Frontend:** React + Tailwind + Vite
- **Backend:** Express + TypeScript
- **Agent Harness:** Flue Framework (@flue/sdk)
- **Social Auth:** Composio SDK (@composio/sdk)
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
│   │   ├── composio.ts        # Composio social auth integration
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
│               Composio SDK      BasePaymentRouter    Poke  │
│            (Social Auth)        (x402 Payments)     (AI)   │
│                     │                                       │
│          ┌──────────┼──────────┐                            │
│          │          │          │                            │
│      LinkedIn    Gmail     Twitter                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Flow

1. **User connects social accounts** via Composio Connect Links (OAuth)
2. **Composio fetches contacts** from LinkedIn, Gmail, Twitter, etc.
3. **Flue agent** searches and ranks contacts by relevance to user prompt
4. **AI generates drafts** personalized per contact
5. **User reviews and sends** — x402 payment verified on Base
6. **Email sent** via Gmail (Composio) or SMTP

## Environment Variables

```bash
# Composio
COMPOSIO_API_KEY=

# Base Chain (x402 payments)
BASE_CHAIN_ID=8453
BASE_PAYMENT_ROUTER_ADDRESS=
X402_SEND_FEE_WEI=1000000000000
X402_STRICT=true

# Social OAuth (handled by Composio)
# No per-provider secrets needed — Composio manages OAuth

# Poke API (optional — fallback to local search)
POKE_API_BASE_URL=
POKE_API_KEY=
POKE_API_PATH=

# SMTP (fallback if Composio Gmail not connected)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# App
APP_URL=http://localhost:3000
```

## Setup

```bash
# Install dependencies
npm install

# Install Flue + Composio
npm install @flue/sdk @composio/sdk

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
| `contact-search` | Searches connected social accounts for matching contacts |
| `outreach-draft` | Generates personalized email drafts |
| `full-outreach-pipeline` | End-to-end: search → rank → draft |

## Composio Integrations

| Source | Toolkit | Key Actions |
|--------|---------|-------------|
| LinkedIn | LINKEDIN | List connections, search people, get profile |
| Gmail | GMAIL | List contacts, list emails, send email |
| Twitter | TWITTER | List followers, search tweets |
| Instagram | INSTAGRAM | List followers, get user info |
| Facebook | FACEBOOK_MARKETING | List accounts, get user info |
