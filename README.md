# TradeChat MVP

This repository contains the source for a Next.js based prototype.

## Setup

1. Install dependencies (requires [pnpm](https://pnpm.io/)):
   ```bash
   pnpm install
   ```
2. Create a `.env.local` file and set the following variables:
   ```
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_BITGET_API_URL=https://api.bitget.com
   NEXT_PUBLIC_BITGET_WS_URL=wss://ws.bitget.com/v2/ws/public
   NEXT_PUBLIC_ENABLE_DEMO_MODE=false
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   OPENAI_API_KEY=
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

A local SQLite database file `memory.db` will be created automatically on first run. Log files (`*.log`) and the database are ignored from version control.

See [docs/development-guide.md](docs/development-guide.md) for more details.
