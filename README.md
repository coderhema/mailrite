## Milestone status

Milestone 1 is in progress, the Base payment routing contract draft has been added, and the Poke-backed outreach adapter plus x402 payment scaffolding are now wired into the server layer.

## Run locally

Prerequisites, Node.js

1. Install dependencies:
   npm install
2. Set the environment variables in [.env.local](.env.local)
3. Run the app:
   npm run dev

## Coral SQL Query Layer

MailRite integrates [Coral](https://withcoral.com) — an open-source query layer that turns APIs, databases, and files into SQL tables. Query LinkedIn connections, Gmail contacts, and more in a single SQL statement with cross-source JOINs.

### Setup Coral CLI

```bash
# macOS
brew install withcoral/tap/coral

# Linux
curl -fsSL https://raw.githubusercontent.com/withcoral/coral/main/install.sh | bash

# Or use the helper script
./scripts/setup-coral.sh
```

**Windows (native):** Download the ZIP and run the PowerShell setup script:

```powershell
# Automated setup (recommended)
.\scripts\setup-coral.ps1

# Or manually:
# 1. Download coral-x86_64-pc-windows-msvc.zip from:
#    https://github.com/withcoral/coral/releases/latest
# 2. Extract coral.exe to %USERPROFILE%\.local\bin\
# 3. Add that folder to your user PATH
# 4. Verify: coral --version
```

**Windows (WSL):** If you use WSL with Ubuntu, install Coral inside WSL and call it from Windows:

```bash
# Inside WSL/Ubuntu terminal:
curl -fsSL https://withcoral.com/install.sh | sh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
coral --version
```

Then set `CORAL_BINARY_PATH` in your `.env` file to call the WSL Coral from your Windows Node.js server:

```
CORAL_BINARY_PATH=wsl -d Ubuntu -e /home/YOUR_USERNAME/.local/bin/coral
```

### Add Data Sources

```bash
# Add LinkedIn as a Coral data source
coral source add --file coral-sources/linkedin-source.yaml

# Add Google People contacts as a Coral data source
coral source add --file coral-sources/gmail-people-source.yaml

# Add Gmail threads as a Coral data source
coral source add --file coral-sources/gmail-threads-source.yaml

# List configured sources
coral source list
```

### Run SQL Queries

```sql
-- Find contacts across all sources
SELECT name, email, role, company, 'linkedin' AS source
FROM linkedin.connections
UNION ALL
SELECT name, NULL, NULL, NULL, 'google' AS source
FROM google_people.contacts
LIMIT 20;

-- Cross-source lookup: find LinkedIn contacts with Google People data
SELECT li.name, li.email, li.role, li.company, gp.name AS google_name
FROM linkedin.connections li
LEFT JOIN google_people.contacts gp ON LOWER(li.email) = LOWER(gp.email)
WHERE li.email IS NOT NULL
LIMIT 15;

-- Recent Gmail threads
SELECT subject, from_name, from_email, received_at
FROM gmail.threads
ORDER BY received_at DESC
LIMIT 10;
```

Preset queries are available in the Coral SQL panel inside the app, or as `.sql` files in `src/queries/`.

### API Endpoints

- `GET /api/coral/check` — Check if Coral CLI is installed
- `GET /api/coral/sources` — List configured Coral sources
- `POST /api/coral/query` — Run a SQL query via Coral
- `POST /api/coral/query/file` — Run a query from a `.sql` file
- `GET /api/coral/queries/presets` — List preset query templates
- `POST /api/coral/source/add` — Add a new Coral data source

### Environment Variables

- `CORAL_BINARY_PATH` — Path to coral binary or command (default: `coral`)
  - Simple: `coral` (on PATH)
  - Windows native: `C:\Users\me\.local\bin\coral.exe`
  - Windows WSL: `wsl -d Ubuntu -e /home/me/.local/bin/coral`
- `CORAL_QUERY_TIMEOUT` — Query timeout in ms (default: `30000`)

## Flue Agent

MailRite uses [Flue](https://flueframework.com) — an agent harness framework — to run autonomous outreach agents. The agent lives in `agents/outreach.agent.ts` and supports four actions:

| Action | Description |
|--------|-------------|
| `coral-query` | Run SQL queries against LinkedIn, Gmail via Coral |
| `search` | Search contacts by relevance to a prompt |
| `draft` | Generate personalized email drafts for a contact |
| `full-pipeline` | End-to-end: search contacts → fetch details via Coral → generate drafts |

### Agent setup

The Flue agent requires no additional environment variables beyond Coral config. It uses the `env` bindings passed by the Flue runtime.

## Configuration

Use the following environment variables:

- `POKE_API_BASE_URL` — Base URL for the Poke API adapter
- `POKE_API_PATH` — Request path used by the outreach adapter
- `POKE_API_KEY` — Bearer token used to call the Poke API
- `SMTP_HOST` — SMTP server hostname
- `SMTP_PORT` — SMTP server port (default: `587`)
- `SMTP_USER` — SMTP username
- `SMTP_PASS` — SMTP password
- `SMTP_FROM` — From address for sent emails
- `BASE_CHAIN_ID` — Base chain ID (default: `8453`)
- `BASE_PAYMENT_ROUTER_ADDRESS` — Contract address for x402 quote flow
- `X402_SEND_FEE_WEI` — Per-send amount in wei
- `X402_STRICT` — Set to `true` to require x402 receipt header before sending

## Todo

- [ ] Implement Flue skills: `contact-search`, `outreach-draft`, `full-outreach-pipeline`
- [ ] Wire Flue agent routes into `server.ts`
- [ ] Replace mock contacts in `App.tsx` with real Coral queries
- [ ] Verify Coral source YAMLs (`coral-sources/`) work end-to-end
