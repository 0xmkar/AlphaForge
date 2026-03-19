## AlphaForge

AlphaForge is an AI-driven backend + Next.js UI that extracts macro crypto “signals” from prediction markets (Polymarket) using Groq-hosted Llama models.

Backend API (Express) is exposed under `/v1`:

- `GET /v1/health` - health check
- `GET /v1/signals?limit=50` - fetch top Polymarket markets, analyze them with LLMs, and return only relevant signals
- `GET /v1/docs` - Swagger UI (enabled when `NODE_ENV=development`)

---

## Quick Start

### Backend

1. Install dependencies: `cd backend && npm install`
2. Configure environment variables:
   Edit `backend/.env` and set `GROQ_API_KEY` (required).
   Example values:
   ```bash
   PORT=3001
   NODE_ENV=development
   GROQ_API_KEY=your_key_here
   ```
3. Run the backend: `npm run dev`

API examples (assuming `PORT=3001`):

- Health: `http://localhost:3001/v1/health`
- Signals: `http://localhost:3001/v1/signals?limit=50`
- Docs: `http://localhost:3001/v1/docs`

### Frontend

1. Install dependencies: `cd frontend && npm install`
2. Run: `npm run dev`
3. Open: `http://localhost:3000`

---

## How `GET /v1/signals` works

1. Fetches top markets from Polymarket’s Gamma API.
2. Batches markets (5 at a time) and sends them to Groq for structured JSON classification.
3. Filters to only signals where `is_relevant` is `true`, and returns them as `{ status, count, data }`.

---

## Environment Variables
`GROQ_API_KEY` - required Groq API key used by the LLM signal agent.
`PORT` - optional server port (defaults to `5000`).
`NODE_ENV` - optional; set to `development` to enable Swagger docs at `/v1/docs`.