# ChatBot — AI Assistant

A full-featured ChatGPT-like chatbot interface built with Next.js 15, featuring real-time streaming responses, multiple LLM providers, file/image uploads, and anonymous access with a 3-question free tier.

## Features

- **Streaming AI responses** — Real-time SSE streaming with blinking cursor animation
- **Multiple LLMs** — OpenAI GPT-4o, GPT-4o mini, and Google Gemini 1.5 Flash
- **Chat history** — Left sidebar with conversation list, grouped by date, persisted in Postgres
- **Authentication** — Secure JWT-based login/signup (httpOnly cookies, bcrypt)
- **Image support** — Paste images from clipboard or attach files → OpenAI Vision API
- **Document uploads** — Upload PDF or TXT files as context for the AI
- **Anonymous access** — 3 free questions without signing up
- **Cross-tab sync** — New chats appear instantly in all open browser tabs via Supabase Realtime
- **Auto-generated titles** — Chat titles generated automatically from the first message

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Data fetching | TanStack Query v5 |
| UI | shadcn/ui + Tailwind CSS |
| LLM | OpenAI API + Google Gemini API |
| Database | Supabase (PostgreSQL) |
| Auth | Custom JWT (jose + bcrypt) |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage |
| Deployment | Vercel |

## Prerequisites

- Node.js 20+
- [Supabase](https://supabase.com) account (free tier works)
- [OpenAI API key](https://platform.openai.com)
- [Google AI API key](https://aistudio.google.com) (optional — for Gemini)

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd chatbot
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration:
   ```
   Copy and paste the contents of supabase/migrations/001_init.sql
   ```
3. Create a Storage bucket:
   - Go to **Storage** → **New bucket**
   - Name: `attachments`, set to **Private**, max file size: `10485760` (10MB)
4. Enable Realtime replication for `chats` table:
   - Go to **Database** → **Replication** → enable `chats` under `supabase_realtime`

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
JWT_SECRET=your-super-secret-32-char-minimum-key
```

**Where to find Supabase keys:**
Project Settings → API → Project URL, `service_role` key (secret), and `anon` key (public)

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables Reference

| Variable | Description | Exposed to browser? |
|----------|-------------|---------------------|
| `OPENAI_API_KEY` | OpenAI API key | No |
| `GEMINI_API_KEY` | Google Gemini API key | No |
| `SUPABASE_URL` | Supabase project URL (server) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (for Realtime) | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (for Realtime) | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | No |

## Deployment to Vercel

1. Push your code to GitHub
2. Import the repository at [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local` in the Vercel project settings
4. Deploy — Vercel builds and deploys automatically on every push

## Architecture

```
src/
├── app/
│   ├── api/          ← REST API routes (server-side only, no DB in components)
│   ├── (auth)/       ← Login/Signup pages
│   └── (main)/       ← Chat interface pages
├── components/       ← React components (fetch via API only)
├── lib/
│   ├── db/           ← Supabase queries (server-only import)
│   ├── llm/          ← LLM providers (server-only import)
│   ├── auth/         ← JWT session management (server-only import)
│   └── storage/      ← File upload helpers (server-only import)
└── hooks/            ← TanStack Query client hooks
```

**Key rules:**
- All DB access is server-side (`import 'server-only'` enforced)
- Components fetch data via `/api/*` routes — no direct DB calls
- `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the client
- Supabase Realtime is the only use of the public client
