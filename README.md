# FlowEngine

FlowEngine is a real-time data pipeline visualizer. It lets a user build a Directed Acyclic Graph (DAG) of source, transformer, and sink nodes on a React Flow canvas, execute the graph through a Fastify backend, and watch data chunks move through the pipeline over Socket.io.

## What Is Included

- Next.js App Router frontend with TypeScript, Tailwind CSS, React Flow, Zustand, and Socket.io client.
- Fastify backend with TypeScript, Socket.io, BullMQ, Redis-backed execution jobs, and Prisma persistence.
- Shared TypeScript contracts in `shared/types.ts`.
- PostgreSQL schema for saved pipeline graphs.
- DAG validation, topological execution ordering, SSRF URL protection, and unit tests.

## Repository Layout

```text
client/              Next.js frontend
  src/app/           App Router page and global styles
  src/components/    Canvas, node, sidebar, layout, and config UI
  src/hooks/         Socket.io execution hook
  src/lib/           API and graph utilities
  src/store/         Zustand pipeline store and tests

server/              Fastify backend
  prisma/            Prisma schema
  src/routes/        REST API routes
  src/sockets/       Socket.io pipeline namespace
  src/services/      DAG, payload, config, Redis, and SSRF services
  src/nodes/         Node execution implementations
  src/workers/       BullMQ pipeline worker
  src/__tests__/     Backend unit tests

shared/              Shared TypeScript types and event contracts
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL
- Redis

The frontend can start without PostgreSQL or Redis, but saving and executing pipelines require both services.

## Environment

Create a local `.env` from `.env.example` and adjust values for your machine:

```bash
cp .env.example .env
```

The backend and Prisma scripts load the repo-level `.env` first, then `server/.env` if it exists. Shell environment variables still take highest precedence.

Required values:

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flowengine?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/flowengine?schema=public"
REDIS_URL="redis://localhost:6379"
REDIS_TLS="false"
CLIENT_URL="http://localhost:3000"
SERVER_PORT=4000
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000/pipeline"
AUTH_TOKEN_SECRET="change-this-long-random-secret"
```

For Supabase, use the pooled connection string for `DATABASE_URL` and the direct database connection string for `DIRECT_URL`. If your Supabase password contains special URL characters such as `@`, `#`, `/`, `?`, or `:`, percent-encode them in both URLs.

For Redis Cloud, use `rediss://...` when the database requires TLS. If Redis Cloud gives you a `redis://...` URL but TLS is enabled in the dashboard, keep the URL and set `REDIS_TLS="true"`.

Redis Cloud's Node.js snippet may show separate `username`, `password`, `host`, and `port` fields. You can either convert those fields into `REDIS_URL`, or use them directly:

```text
REDIS_HOST="seed-marmalade-plum-71702.db.redis.io"
REDIS_PORT="12730"
REDIS_USERNAME="default"
REDIS_PASSWORD="<password>"
REDIS_TLS="false"
```

If `REDIS_URL` is set, it takes precedence over the separate Redis fields.

## Install

```bash
npm install
npm --workspace @flowengine/server run prisma:generate
```

## Database Setup

Create the `flowengine` database in PostgreSQL, then run the Prisma migration command:

```bash
npm --workspace @flowengine/server run prisma:migrate
```

Migrations create the pipeline tables and the local `User` table used by FlowEngine auth. The first user can be created from the app's sign-up screen.

## Development

Start Redis and PostgreSQL first, then run both apps:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:client
npm run dev:server
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:4000/health`
- Socket namespace: `http://localhost:4000/pipeline`

## Auth

FlowEngine uses local username/password auth backed by PostgreSQL. Passwords are hashed with Node crypto, and the API returns a signed bearer token that the client stores in `localStorage`.

Set a long random `AUTH_TOKEN_SECRET` before running the server:

```text
AUTH_TOKEN_SECRET="replace-with-at-least-24-random-characters"
```

Protected surfaces:

- Pipeline save/load/delete REST endpoints
- Pipeline execution Socket.io namespace

Use the sign-up screen on first launch, then sign in with that account.

## Scripts

```bash
npm run build       # Build/check every workspace
npm run test        # Run frontend and backend tests
npm run lint        # Run Next lint and TypeScript checks
npm run typecheck   # Run TypeScript checks in all workspaces
```

Server-only Prisma scripts:

```bash
npm --workspace @flowengine/server run prisma:generate
npm --workspace @flowengine/server run prisma:migrate
```

## Pipeline Execution Flow

1. The user builds a graph in the canvas.
2. The frontend emits `execute_pipeline` to the `/pipeline` Socket.io namespace.
3. The backend validates node configs and checks that the graph is acyclic.
4. A BullMQ job executes nodes by topological level.
5. The backend emits `node_status_changed` and `data_flow` events.
6. The frontend updates node status and animates a particle along the matching edge path.

## Supported Node Types

- `MOCK_SOURCE`: generates random JSON records in 50-item chunks.
- `HTTP_SOURCE`: fetches JSON from an external HTTP(S) endpoint.
- `DELAY`: simulates processing latency.
- `JSON_FILTER`: filters records with a JSONPath expression.
- `CONSOLE_SINK`: logs processed records on the backend.

## API

REST endpoints:

- `GET /api/pipelines`
- `POST /api/pipelines`
- `PUT /api/pipelines/:id`
- `DELETE /api/pipelines/:id`

Socket events:

- Client to server: `execute_pipeline`
- Server to client: `execution_started`, `node_status_changed`, `data_flow`, `execution_completed`, `execution_error`
