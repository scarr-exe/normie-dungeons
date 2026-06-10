# Normie Dungeons

Normie Dungeons is a D&D-style dungeon crawler web app that maps Normie NFT traits to character stats. Runs can be solo or party-based and are narrated live by an AI Dungeon Master. The app uses Supabase for real-time session state and messaging and integrates wallet connections to verify Normie ownership.

---

## Quick links
- Main landing page: [src/app/page.tsx](src/app/page.tsx#L1)
- Game room: [src/app/game/[sessionId]/page.tsx](src/app/game/[sessionId]/page.tsx#L1)
- DM init endpoint: [src/app/api/dm/init/route.ts](src/app/api/dm/init/route.ts#L1)
- DM turn endpoint: [src/app/api/dm/turn/route.ts](src/app/api/dm/turn/route.ts#L1)

---

## Features
- Trait-driven character creation: Normie metadata traits are converted into D&D-style ability scores and a class selection.
- AI Dungeon Master: Groq-based chat completions generate atmospheric narrations and outcome decisions.
- Party mode: create or join sessions with an invite code; turn-based play with up to 4 players.
- Real-time sync: Supabase Realtime (channels) synchronizes messages, game state, and player lists.
- Wallet integration: RainbowKit + wagmi for wallet connect and holder checks.

---

## Tech stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 (project uses a few Tailwind primitives and global CSS)
- Supabase JS for database and realtime events
- RainbowKit, wagmi, viem for wallet features
- Groq (OpenAI-compatible) for AI narration
- framer-motion for UI animation
- React Query for client state caching

---

## Quick start (local)
1. Install dependencies

```bash
npm install
```

2. Create `.env.local` with required variables (see Environment variables below).

3. Run the dev server

```bash
npm run dev
```

4. Open http://localhost:3000

---

## Environment variables
Create `.env.local` in the project root and set the following:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — WalletConnect project id
- `GROQ_API_KEY` — API key for Groq (AI narration)
- `NEXT_PUBLIC_NORMIES_API_BASE` (optional) — defaults to `https://api.normies.art`
- `NORMIES_API_BASE` (optional) — server-side base URL for the Normies API

---

## Scripts
Available npm scripts (from `package.json`):

- `npm run dev` — start Next.js dev server
- `npm run build` — create production build
- `npm run start` — start production server
- `npm run lint` — run ESLint

---

## Routes & API endpoints
Most server logic is implemented as Next.js route handlers under `src/app/api`.

- `POST /api/dm/init` — initialize a dungeon run. See [src/app/api/dm/init/route.ts](src/app/api/dm/init/route.ts#L1).
  - Expects a `players` list and `mode` (solo/party). Returns dungeon name, boss name, opening narration, and an image URL.

- `POST /api/dm/turn` — resolve a player action.
  - Expects `action`, `player`, `allPlayers`, `dungeonName`, current `roomNumber`, `totalRooms`, and recent `messageHistory`. Returns narration, hp changes, room/dungeon progress and dice info. Implemented in [src/app/api/dm/turn/route.ts](src/app/api/dm/turn/route.ts#L1).

- `POST /api/claude/tutorial-demo` — tutorial/demo DM narration. Implemented in [src/app/api/claude/tutorial-demo/route.ts](src/app/api/claude/tutorial-demo/route.ts#L1).

- `GET /api/normies/test` — returns a built Normie character for ID 1. Implemented in [src/app/api/normies/test/route.ts](src/app/api/normies/test/route.ts#L1).

Client pages interact with Supabase and the DM endpoints instead of implementing heavy game logic on the server.

---

## Database model (Supabase)
Tables expected (inferred from code):

- `users` — stores user records with `id`, `username`, `wallet_address`, `badge`, and `session_token`.
- `sessions` — stores active sessions: `id`, `invite_code`, `host_id`, `status`, `mode`, `current_room`, `total_rooms`.
- `session_players` — players in a session: `id`, `session_id`, `user_id`, `normie_id`, `character_class`, `stats`, `hp`, `max_hp`, `turn_order`, `is_active`, `last_seen`.
- `game_state` — per-session state: `session_id`, `current_turn_player_id`, `dungeon_name`, `dungeon_description`, `current_room_description`, `state` (JSON), `updated_at`.
- `messages` — activity log: `session_id`, `player_id`, `type`, `content`, `dice_roll`, `created_at`.

You will need appropriate RLS policies and service roles if deploying to production.

---

## Important files
- `src/app/page.tsx` — landing page and hero UI. ([link](src/app/page.tsx#L1))
- `src/app/game/[sessionId]/page.tsx` — main game room (turn handling, Supabase realtime listeners). ([link](src/app/game/[sessionId]/page.tsx#L1))
- `src/lib/normies.ts` — fetch Normie metadata, convert traits to stats, assign class, build character. ([link](src/lib/normies.ts#L1))
- `src/lib/ai.ts` — Groq chat completion wrapper used by DM endpoints. ([link](src/lib/ai.ts#L1))
- `src/lib/supabase.ts` — Supabase client. ([link](src/lib/supabase.ts#L1))

---

## Development notes & suggestions
- The DM endpoints parse JSON from LLM outputs using a regex. The code contains fallback behaviour but consider improving response validation and adding strict schema checks.
- `src/lib/claude.ts` is empty and available for adding a Claude client if desired.
- Tests and staging Supabase instance are recommended before production deployment.

---

## Contact / Contribution
Open a PR or issue in this repository for changes, or reach out to the maintainers recorded in project settings.

---

## Repository layout

```
normie-dungeons/
├─ README.md
├─ package.json
├─ next.config.ts
├─ postcss.config.mjs
├─ tsconfig.json
├─ public/
│  └─ (static assets)
└─ src/
  ├─ app/
  │  ├─ page.tsx                # Landing page
  │  ├─ layout.tsx
  │  ├─ globals.css
  │  ├─ api/
  │  │  ├─ dm/
  │  │  │  ├─ init/route.ts     # DM init endpoint
  │  │  │  └─ turn/route.ts     # DM turn endpoint
  │  │  ├─ claude/tutorial-demo/route.ts
  │  │  └─ normies/test/route.ts
  │  ├─ lobby/
  │  └─ game/
  │     └─ [sessionId]/page.tsx # Game room UI
  ├─ components/
  │  ├─ game/                   # CharacterSheet, DiceRoll, NormieSelector
  │  └─ ui/                     # UsernameModal, etc.
  ├─ hooks/                     # useUser, useNormie, useWalletNormies
  ├─ lib/                       # ai.ts, normies.ts, sessions.ts, supabase.ts
  └─ types/                     # game.ts, normie.ts
```
