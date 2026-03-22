# AlphaForge


AlphaForge is an agentic crypto investing agent orchestration that turns prediction-market sentiment into onchain portfolio actions.

Instead of asking a user to read news, interpret macro, decide an allocation, and manually rebalance, AlphaForge runs a pipeline:

1. Pull live markets from Polymarket.
2. Extract relevant crypto and macro signals with an LLM-powered Signal Agent.
3. Convert those signals into a portfolio thesis with a Strategy Agent.
4. Evaluate guardrails with a Risk Agent.
5. Execute swaps and lending actions through Tether's WDK on EVM testnet.
6. Persist the run as an investment record tied to the user.

The frontend presents this flow as a forge-themed experience, while the backend exposes a REST API under `/v1`.

<img src="./logo.png" alt="AlphaForge logo" width="300"/>

## Vision

AlphaForge starts from a simple belief: the next generation of investing software will not stop at dashboards, alerts, or research copilots. It will listen to the market, form a view, apply risk constraints, and act.

In other words, the real unlock is not just AI that can explain the market. It is AI that can operationalize conviction.

This project is of that idea for crypto: a system that treats markets as living inputs, converts them into structured beliefs, and forges those beliefs into executable portfolio behavior.

AlphaForge is designed around the metaphor of a forge because the product is meant to feel like a machine that manufactures conviction.

- raw ore is noisy market data
- fire is macro pressure, sentiment, politics, and probability
- the forge is the agent pipeline that removes ambiguity
- the blade is the final action that can actually be executed onchain

The idea is that alpha is not magically found. It is forged.

That is why the product experience is full of lava flows, stations, heat, and industrial motion. The UI is trying to make the pipeline legible: signal enters as molten noise and exits as shaped intent.

## Why Prediction Markets

Most systems begin from price charts or headlines. AlphaForge begins from prediction markets.

That choice matters because prediction markets are capital-backed expressions of belief about the future. They are closer to "what the market thinks will happen next" than "what already happened."

For a system trying to reason about macro regimes and crypto positioning, that makes prediction markets a powerful source of upstream signal:

- they surface probabilities instead of vibes
- they compress collective expectations into a tradable form
- they often reveal directional belief before slower discretionary workflows catch up

## What It Does

- Authenticated users can sign up, log in, and get an auto-generated wallet.
- The profile page shows wallet balances for `ETH`, `USDT`, `BTC`, and `XAUT`.
- Clicking `Run Forge` triggers the full signal -> strategy -> execution pipeline.
- Completed runs are saved and shown in strategy execution history.
- A separate deterministic Risk Agent can evaluate a strategy before execution.

## Core Belief

AlphaForge is not trying to be only a signal dashboard, a chatbot with opinions, or a portfolio tracker with prettier charts.

It is trying to become an end-to-end decision engine.

The important shift is this:

> insight is useful, but execution is where intelligence becomes real.

## Product Flow

```text
Polymarket markets
  -> Signal Agent
  -> Strategy Agent
  -> Risk Agent
  -> Execution Agent
  -> WDK / onchain actions
  -> Investment history
```

![AlphaForge system flow](./user-flow.png)

## The Forge In One Sentence

AlphaForge takes live market belief, tempers it through AI reasoning and risk controls, and forges it into executable onchain strategy.

## Design Principles

- `Forward-looking over backward-looking`
  Start from predictive markets, not just lagging indicators.
- `Structured reasoning over intuition alone`
  Convert ambiguity into explicit signals, regimes, and actions.
- `Execution completes the loop`
  A thesis is unfinished until it can be deployed.
- `Risk belongs inside the pipeline`
  Guardrails are part of the system, not an afterthought.
- `Interfaces should reveal the machine`
  The forge metaphor exists to make the hidden pipeline visible and understandable.

## Architecture

### Frontend

- `frontend/` is a Next.js 16 app with React 19 and Framer Motion.
- Main routes:
  - `/` - landing page and animated pipeline walkthrough
  - `/signup` - account creation
  - `/login` - authentication
  - `/profile` - balances, AI run trigger, and investment history
- The UI uses `localStorage` with `alphaforge_token` for client-side auth persistence.

### Backend

- `backend/` is an Express + TypeScript API.
- Core services and agents:
  - `Signal Agent` - classifies Polymarket events into structured crypto-relevant signals
  - `Strategy Agent` - produces a regime, confidence score, and WDK-style actions
  - `Risk Agent` - deterministic rule-based guardrails
  - `Execution Agent` - LLM-guided tool loop for swaps, lending, and withdrawals
- Data is stored in PostgreSQL via Prisma.
- Authentication uses JWT + bcrypt.

## User Journey

The user experience is intentionally simple even though the system underneath is multi-step:

1. Create an account.
2. Receive a wallet identity.
3. Open the forge dashboard.
4. Run the pipeline.
5. Watch prediction-market signal turn into regime, strategy, and execution history.

That simplicity is part of the product thesis. The complexity should live inside the machine, not in the user's workflow.

## Main Pipeline

The primary user action is `GET /v1/signals`.

![AlphaForge data flow](./data-flow.png)

When the frontend runs this endpoint, the backend currently:

1. Fetches top Polymarket markets by volume from the Gamma API.
2. Processes them in batches of 5.
3. Uses Groq-hosted models through LangChain to classify only relevant crypto signals.
4. Runs the Strategy Agent to infer a dominant regime and action plan.
5. Creates a wallet-backed WDK execution context for the authenticated user.
6. Runs the Execution Agent, which can quote and execute swaps or Aave lending actions.
7. Saves the result to the `Investment` table.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Framer Motion
- Backend: Express, TypeScript, Prisma, PostgreSQL
- AI: LangChain, Groq
- Auth: JWT, bcrypt
- Onchain execution: Tether WDK, Aave, Velora
- Data source: Polymarket Gamma API

## Why This Project Is Interesting

A lot of products stop at one layer:

- signal discovery
- strategy generation
- risk review
- execution tooling

AlphaForge is interesting because it tries to connect all of them into one continuous system. The demo is compelling not because any single part is novel in isolation, but because the whole loop is closed.

## Project Structure

```text
.
├── backend/
│   ├── prisma/
│   └── src/
│       ├── controllers/
│       ├── execution-agent/
│       ├── risk-agent/
│       ├── routes/
│       ├── services/
│       ├── strategy-agent/
│       └── utils/
└── frontend/
    ├── app/
    └── components/
```

## API Overview

All backend routes are mounted under `/v1`.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Health check |
| `POST` | `/auth/signup` | No | Create a user and auto-generate a wallet |
| `POST` | `/auth/login` | No | Log in and receive a JWT |
| `GET` | `/auth/profile` | Yes | Return user profile and wallet balances |
| `GET` | `/signals` | Yes | Run signal analysis, strategy generation, and execution |
| `POST` | `/signals/risk-check` | Yes | Run the deterministic Risk Agent on a strategy payload |
| `POST` | `/strategy` | No | Generate a strategy from a supplied `signals` array |
| `GET` | `/execution/test` | No | Run mocked execution scenarios for development |
| `GET` | `/investments` | Yes | Return saved investment executions for the user |
| `GET` | `/docs` | Dev only | Swagger UI in development mode |

## Local Development

### Prerequisites

- Node.js 20+
- A PostgreSQL database
- A Groq API key

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```bash
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=replace_this_in_real_setups
```

Apply Prisma migrations:

```bash
npx prisma migrate dev
```

Start the backend:

```bash
npm run dev
```

Backend will be available at `http://localhost:3001`.

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Story For Builders

If you are reading this as an engineer, AlphaForge can be thought of as a sequence of transformations:

- market probabilities become signals
- signals become a regime
- a regime becomes an allocation thesis
- a thesis becomes executable tool calls
- execution becomes a persistent investment record

Each step changes the shape of the problem, which is why the system is split across multiple agents instead of one monolithic prompt.

## Recommended Demo Flow

1. Create an account on `/signup`.
2. Log in on `/login`.
3. Open `/profile`.
4. Inspect the generated wallet and testnet balances.
5. Click `Run Forge`.
6. Review the returned strategy summary and relevant signal cards.
7. Check strategy execution history after the run is saved.

## Data Model

The core persisted models are:

- `User`
  - email, password hash, wallet address, seed phrase, optional name
- `Investment`
  - dominant regime
  - confidence and time horizon
  - action list
  - execution summary
  - optional risk assessment
  - timestamps

## Environment Variables

### Backend

- `DATABASE_URL` - PostgreSQL connection string used by Prisma
- `GROQ_API_KEY` - required for Signal, Strategy, and Execution agent calls
- `JWT_SECRET` - JWT signing secret
- `PORT` - backend port, defaults to `5000` in code
- `NODE_ENV` - set to `development` to enable Swagger docs

### Frontend

- `NEXT_PUBLIC_API_URL` - base URL for the backend API

## Important Notes

- The product branding is `AlphaForge`, but parts of the backend still use the older `Tether` naming in package metadata and root responses.
- The frontend defaults to `http://localhost:3001`, while the backend defaults to port `5000`. Setting `PORT=3001` is the easiest way to keep local development aligned.
- The app is currently wired to Sepolia-style testnet assets. `XAUT` is mocked to the same address as testnet `USDT` in the execution types.
- `GET /v1/signals` is a heavy route. It performs multiple LLM calls and can take noticeable time to complete.
- The dedicated Risk Agent exists, but the main `/v1/signals` flow currently executes directly and does not enforce the risk check in that path.
- `GET /v1/execution/test` is a development-focused endpoint and should not be exposed as-is in a production environment.
- RPC URLs are currently embedded in source under `backend/src/utils/networks.ts`; these should be moved to environment variables before any real deployment.
- `JWT_SECRET` falls back to a placeholder if unset; treat that as development-only behavior.

## Swagger

When `NODE_ENV=development`, API docs are available at:

```text
http://localhost:3001/v1/docs
```

## Long-Term Direction

The long-term direction is much bigger than the current demo.

AlphaForge could grow into:

- stronger portfolio construction and sizing logic
- enforced risk checks in the primary execution path
- broader protocol and asset support
- richer execution explainability
- better state awareness from real wallet balances
- persistent memory across market regimes and historical runs

The bigger ambition is programmable asset management for an onchain world: systems that do not just interpret markets, but participate in them with discipline.

## Current Status

AlphaForge's complete vertical slice:

- polished frontend
- working auth
- live signal ingestion
- AI-generated strategy output
- onchain execution hooks through WDK
- persisted investment history

It is not yet production-hardened, but it already demonstrates the full signal-to-execution loop.