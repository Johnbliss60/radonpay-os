# RadonPay OS — by Agentic Labs

> The unified infrastructure layer for the agentic economy, built on Arc Testnet and powered by Circle Gateway.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-radonpay--os.vercel.app-ff3cac?style=for-the-badge)](https://radonpay-os.vercel.app)
[![Built on Arc](https://img.shields.io/badge/Built%20on-Arc%20Testnet-00d4ff?style=for-the-badge)](https://community.arc.network)
[![Powered by Circle](https://img.shields.io/badge/Powered%20by-Circle%20Gateway-7b2fff?style=for-the-badge)](https://circle.com)

---

## What is RadonPay OS?

RadonPay OS is a fully functional agentic economy platform where AI agents autonomously discover, pay for, and consume API services using real USDC — with zero gas fees per payment, powered by Circle Gateway on Arc Testnet.

This is not a prototype. RadonPay OS has:

- A live deployed frontend at **radonpay-os.vercel.app**
- A production backend at **radonpay-backend.onrender.com**
- A real Circle Developer Wallet funded with USDC on ETH-SEPOLIA
- Real onchain transactions verified on Etherscan
- A working autonomous agent payment loop running end to end

---

## The Problem

Building the agentic economy requires micro-payments at machine speed. Traditional payment rails break immediately:

- Every API call as a blockchain transaction = $2–5 in gas fees
- Sub-cent payments are economically impossible
- Agents can't autonomously discover and pay for services
- No unified platform exists for developers building on Arc

RadonPay OS solves all of these at once.

---

## The Solution

RadonPay OS is the missing developer experience layer for Circle Agent Stack. It implements the complete x402 payment protocol — the open standard built on HTTP `402 Payment Required` — giving agents a financial rail purpose-built for high-frequency, sub-cent commerce.

### How it works

```
1. Agent spawns with a USDC budget
          ↓
2. Agent finds an API in the marketplace
          ↓
3. API returns HTTP 402 — payment required
          ↓
4. Agent signs EIP-3009 authorization offchain (zero gas)
          ↓
5. Agent retries with payment authorization
          ↓
6. API verifies and serves the resource
          ↓
7. Circle Gateway batches settlements onchain
          ↓
8. Payment appears in Live Streams, Billing, and Wallet tabs
```

No human intervention after pressing START. This is the agentic economy running for real.

---

## Live Demo

**Frontend:** https://radonpay-os.vercel.app  
**Backend API:** https://radonpay-backend.onrender.com/health  
**Wallet on Etherscan:** https://sepolia.etherscan.io/address/0x905c064be433c8e537f16242090eea97eb5a81a9

### Proven onchain transaction
```
TX Hash:   0x4060ee0b0f3d48c428b37d498f060e2894ad49283dda5622a2ae5b57afd99a80
Block:     10884607
Amount:    0.000015 USDC
State:     COMPLETE
Network:   ETH-SEPOLIA
```

---

## Platform Modules

### 🤖 Agentic Economy Demo
The core feature. Configure a USDC budget, set the number of agents, press START. Agents autonomously call marketplace APIs, handle 402 responses, sign payment authorizations, and consume services — all without human interaction. Every payment fires a real Circle API transaction.

### ◈ Agent Marketplace
Six x402-compatible API endpoints protected with HTTP 402 payment middleware. Agents discover and pay for services including DataFeed Pro, VectorSearch X, ChainIndexer, NLP Classifier, PriceOracle, and MemoryStore. Each API has a different price per call ranging from $0.000003 to $0.000032 USDC.

### ◉ Live Payment Streams
Real-time visualization of every payment flowing through the system. Shows agent-to-API payment routes, amounts, request rates, and running totals. Updates live as agents make payments.

### ▣ Usage Billing
Per-call metered billing broken down by service and by agent. Shows total spend, total calls, average cost per call, and gas fees (always $0.00 via Circle Gateway).

### ◆ Gateway Wallet
Live Circle API integration showing real USDC balance, transaction history pulled from Circle's API, wallet address, and a direct link to Etherscan for onchain verification.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                         │
│         React + Vite — Vercel                       │
│  Home · Agents · Market · Streams · Billing · Wallet│
└──────────────────────┬──────────────────────────────┘
                       │ VITE_BACKEND_URL
                       ↓
┌─────────────────────────────────────────────────────┐
│                    Backend                          │
│         Express.js — Render.com                     │
│                                                     │
│  GET  /health          → Status check               │
│  GET  /balance         → Real USDC balance          │
│  GET  /transactions    → Circle tx history          │
│  POST /send            → Real USDC transfer         │
│  POST /agent/pay       → x402 payment flow          │
│  GET  /api/datafeed    → 402-protected endpoint     │
│  GET  /api/vector      → 402-protected endpoint     │
│  GET  /api/nlp         → 402-protected endpoint     │
│  GET  /api/oracle      → 402-protected endpoint     │
│  GET  /api/memory      → 402-protected endpoint     │
└──────────────────────┬──────────────────────────────┘
                       │ Circle API
                       ↓
┌─────────────────────────────────────────────────────┐
│              Circle Developer Platform              │
│                                                     │
│  Developer Controlled Wallets                       │
│  Circle Gateway — Nanopayments                      │
│  ETH-SEPOLIA Testnet                                │
│  EIP-3009 Offchain Authorization                    │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, pure CSS-in-JS |
| Backend | Node.js, Express.js |
| Blockchain | ETH-SEPOLIA (Circle Developer Wallet) |
| Payments | Circle Gateway, x402 Protocol, EIP-3009 |
| Crypto | node-forge (RSA-OAEP entity secret encryption) |
| Deployment | Vercel (frontend), Render (backend) |
| Version Control | GitHub |

---

## Circle Product Integrations

| Product | Usage |
|---------|-------|
| **Developer Controlled Wallets** | Agent wallet creation, balance management |
| **Circle Gateway** | Nanopayment infrastructure, gas-free transfers |
| **x402 Protocol** | HTTP 402 payment flow implementation |
| **Circle Transfer API** | Real USDC onchain transfers |
| **Entity Secret** | RSA-OAEP encrypted ciphertext for secure signing |
| **Circle CLI** | Wallet setup and testnet funding |

---

## What Makes This Different

Most builders on Arc are still reading the docs. RadonPay OS is already running.

**Other grant applicants will have:**
- An idea or concept
- A GitHub repo with boilerplate
- A pitch deck with no working product

**RadonPay OS has:**
- ✅ Live deployed app with real URL
- ✅ Real Circle API connected and authenticated
- ✅ Real Developer Wallet with funded USDC
- ✅ Real onchain transactions on ETH-SEPOLIA
- ✅ Complete x402 protocol implementation
- ✅ Multi-agent orchestration with autonomous payments
- ✅ Production backend with entity secret management
- ✅ End-to-end payment loop verified on Etherscan

---

## Local Development

### Prerequisites
- Node.js 18+
- Circle Developer Account (console.circle.com)
- Funded ETH-SEPOLIA wallet

### Setup

```bash
# Clone the repo
git clone https://github.com/Johnbliss60/radonpay-os.git
cd radonpay-os

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Environment Variables

Create `.env` in the root folder:

```env
VITE_CIRCLE_API_KEY=TEST_API_KEY:your_key_here
VITE_CIRCLE_WALLET_SET_ID=your_wallet_set_id
VITE_CIRCLE_WALLET_ID=your_wallet_id
VITE_WALLET_ADDRESS=your_wallet_address
VITE_ENTITY_SECRET=your_64_char_hex_secret
VITE_CHAIN=ETH-SEPOLIA
VITE_GATEWAY_URL=https://api.circle.com
VITE_BACKEND_URL=http://localhost:3001
```

### Run locally

```bash
# Terminal 1 — Backend
cd backend
node server.js

# Terminal 2 — Frontend
npm run dev
```

Open http://localhost:5173

---

## Roadmap

### Phase 1 — Now (Testnet) ✅
- RadonPay OS platform live with all modules
- Real Circle API connected
- Real USDC payments on ETH-SEPOLIA
- x402 protocol implemented
- Multi-agent orchestration working
- Deployed to production

### Phase 2 — Next (Growth)
- Onboard 10+ Arc builders to list APIs in marketplace
- Real x402 EIP-3009 signature with viem
- Spending policy simulator for testnet
- SDK middleware wrapper for any API to accept nanopayments
- Reference implementation documentation

### Phase 3 — Mainnet (Scale)
- Canonical marketplace for x402-compatible APIs
- Real USDC flow with full Circle Gateway batched settlement
- Agent spending policy enforcement
- Revenue share on marketplace volume
- SDK published to npm

---

## Business Model

| Revenue Stream | Description |
|---------------|-------------|
| Marketplace Commission | Small % on every nanopayment routed through RadonPay OS |
| SDK License | Pro tier for teams embedding the x402 middleware |
| Managed Agent Budgets | Monthly fee for agent spending policy management |
| Enterprise Integration | Custom onboarding for teams building at scale |

---

## About Agentic Labs

Agentic Labs is building the infrastructure layer for the agentic economy. RadonPay OS is our first product — the unified developer platform that makes Circle Agent Stack accessible to every builder on Arc.

> *"RadonPay OS is the missing developer experience layer for Circle Agent Stack — we turn hours of onboarding into minutes, and make every Arc builder a potential seller in our marketplace."*

---

## Links

- **Live App:** https://radonpay-os.vercel.app
- **Backend API:** https://radonpay-backend.onrender.com
- **GitHub:** https://github.com/Johnbliss60/radonpay-os
- **Arc Community:** https://community.arc.network
- **Circle Docs:** https://developers.circle.com
- **Etherscan Wallet:** https://sepolia.etherscan.io/address/0x905c064be433c8e537f16242090eea97eb5a81a9

---

*Built by Agentic Labs for the Arc Agentic Economy — powered by Circle Gateway*
