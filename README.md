# College Ko Jano — कॉलेज को जानो

**A RAG-based (Retrieval-Augmented Generation) college information chatbot.**
Students ask questions in plain English; the assistant retrieves relevant
passages from officially uploaded college documents, generates a grounded
answer, and cites its sources. When the knowledge base can't support an
answer, it says so honestly instead of hallucinating.

Demo corpus: *Vidya Vihar Institute of Technology (VVIT), Bhopal* (fictional).

---

## 1. Project Overview

| Item | Detail |
| --- | --- |
| Project | College Ko Jano |
| Type | Full-stack RAG chatbot (SDD capstone — RAG track) |
| Difficulty | Medium (recommended track) |
| Users | Students (chat) · Admins (knowledge-base management) |
| Core promise | Every answer is retrieved from real documents, ranked by vector similarity, synthesized from evidence, and cited with sources — with an explicit "I don't know" path for out-of-corpus questions. |

**RAG flow implemented:**

```
User Question → Embed (TF-IDF vector) → Postgres vector search (cosine top-K)
  → Hybrid re-rank (cosine + IDF term-coverage) → Confidence gate
  → Grounded generation (built-in synthesizer, or OpenAI if configured)
  → Answer + cited sources        |        below gate → honest "unknown"
```

---

## 2. Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, Lucide icons |
| Backend | Next.js Route Handlers (`src/app/api/*`) — Node.js runtime |
| Database | PostgreSQL 15 + Drizzle ORM |
| Vector store | PostgreSQL-native: `real[]` embedding column + in-database `dot_product()` PL/pgSQL function (normalized vectors ⇒ dot product = cosine similarity) |
| Embeddings | Deterministic local TF-IDF feature hashing — 1024-dim, unigram+bigram, stemmed, corpus-IDF weighted (`src/lib/embed.ts`) |
| Generation | Built-in extractive answer synthesizer (`src/lib/synthesize.ts`); auto-upgrades to OpenAI chat completions when `OPENAI_API_KEY` is set |
| PDF parsing | `unpdf` (serverless-safe) |
| Auth | Credential sessions — bcrypt password hashing, 256-bit opaque tokens, httpOnly cookies, DB-backed 7-day sessions |
| Validation | Zod-free hand-rolled validators, server-side on every route |

> The vector layer is dimension-agnostic; to switch to API embeddings
> (e.g. OpenAI `text-embedding-3-small`), change `embed()` and re-embed the
> corpus (`reembedCorpus()`). See §10 Development Phases.

---

## 3. Core Features

- **Chat interface** — streaming NDJSON responses with a typewriter renderer,
  suggestion chips, per-message confidence badges
- **User authentication** — signup / login / logout, role-based access
- **Document upload** — admin Knowledge Studio, drag & drop PDF/TXT/MD (≤10 MB)
- **Document processing** — text extraction (`unpdf`), whitespace
  normalization, overlap-aware chunking (~1000 chars, 160-char carry-over)
- **Embedding generation** — TF-IDF weighted signed feature hashing into
  1024-dim L2-normalized vectors
- **Vector database / semantic search** — top-K cosine ranking executed
  *inside PostgreSQL* via `dot_product()`
- **RAG pipeline** — retrieve → hybrid re-rank → grounded generate
- **AI-generated answers** — synthesized strictly from retrieved chunks
- **Source/reference display** — expandable citation chips with match score and
  snippet under every grounded answer
- **Unknown-question handling** — dual gate (hybrid score + IDF term coverage)
  with helpful suggestions of covered topics
- **Chat history / context** — conversation sidebar, per-user threads,
  last-6-turn context passed to generation
- **Admin document management** — upload, list, inspect chunk counts, delete;
  corpus auto-re-indexes (IDF refresh + re-embed) after every mutation
- **Database/storage integration** — all state in PostgreSQL via Drizzle
- **Deployed & testable end-to-end** — see §13 checklist

---

## 4. Authentication

| Aspect | Implementation |
| --- | --- |
| Registration | `POST /api/auth/signup` — name, email, password (min 8); duplicate email → 409 |
| Login | `POST /api/auth/login` — bcrypt verification, uniform error (no account enumeration) |
| Session | 256-bit random token → `sessions` table (7-day TTL), `ckj_session` httpOnly, sameSite=lax cookie |
| Logout | `POST /api/auth/logout` — token row deleted + cookie cleared |
| Roles | `student` (default) and `admin`; admin routes return 403 for non-admins |
| Route guards | Server components redirect: `/chat` → `/login` when signed out; `/admin` → `/chat` for non-admins |

**Seeded demo accounts** (created by `npx tsx src/db/seed.ts`):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@college.edu` | `admin@123` |
| Student | `student@college.edu` | `student@123` |

---

## 5. Frontend Pages

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | public | Landing: animated hero with live-demo chat card, topic marquee, RAG pipeline diagram, feature bento, showcase answers (incl. unknown example), live stats, CTA |
| `/signup` | public | Account creation (redirects to `/chat` if signed in) |
| `/login` | public | Sign in + one-click demo credential chips |
| `/chat` | authenticated | Main assistant: sidebar with conversations (create/select/delete), streaming answers with citations + confidence, welcome empty state with suggestion chips |
| `/admin` | admin only | Knowledge Studio: corpus stats, drag&drop upload with 4-step pipeline progress, document list with categories/chunk counts, two-tap delete |

UX details: dark editorial theme (ink + saffron), Fraunces display serif ×
Space Grotesk × Tiro Devanagari Hindi accents, film grain, ambient gradients,
marquee ticker, animated pipeline cards, toasts, skeleton/loading states,
mobile slide-over sidebar, fully responsive ≥360px.

---

## 6. Backend Architecture

Route handlers (Node runtime) under `src/app/api/`, layered as:

```
route handler (validation + authz)
  → lib/auth.ts        sessions, bcrypt, role checks
  → lib/rag.ts         orchestration: embed → search → rerank → gate → generate
  → lib/vector.ts      in-DB cosine search + hybrid re-ranker
  → lib/kb.ts          ingestion, corpus IDF stats, re-embedding, deletion
  → lib/embed.ts       tokenize/stem/TF-IDF/hash → 1024-dim vectors
  → lib/chunk.ts       normalize + chunk text
  → lib/synthesize.ts  extractive answer composer + unknown-answer composer
```
Errors never leak stack traces; the chat endpoint degrades to a polite
apology message persisted in the thread.

### RAG request lifecycle (`POST /api/chat`)

1. Auth + input validation (non-empty, ≤2000 chars)
2. Resolve/create conversation (auto-titled from the question)
3. Load last 6 turns for conversational context
4. Persist user message
5. Embed question with corpus IDF → vector search top-8 → hybrid re-rank
6. Gate: `final ≥ 0.30` **and** `coverage ≥ 0.22`, else unknown flow
7. Generate grounded answer from top-4 chunks
8. Persist assistant message with sources + confidence
9. Stream NDJSON: `meta` → `delta`×N → `done`

---

## 7. Database Collections (PostgreSQL tables)

| Table | Key columns | Notes |
| --- | --- | --- |
| `users` | id, name, email (unique), password_hash, role, created_at | roles: `student`, `admin` |
| `sessions` | id, token (unique), user_id → users (cascade), expires_at | opaque session tokens |
| `documents` | id, title, category, filename, mime_type, content_text, chunk_count, status, uploaded_by → users, created_at | status: `processing` / `ready` / `failed` |
| `chunks` | id, document_id → documents (cascade), chunk_index, content, **embedding `real[]`**, term_set `jsonb`, token_count | term_set powers IDF stats + coverage gate |
| `kb_stats` | id (`main`), df `jsonb`, chunk_total, updated_at | corpus document frequencies for IDF |
| `conversations` | id, user_id → users (cascade), title, created_at, updated_at | ordered by updated_at |
| `messages` | id, conversation_id → conversations (cascade), role, content, sources `jsonb`, confidence `real`, created_at | sources = cited docs + scores + snippets |

Custom in-DB function: `dot_product(real[], real[]) → real` (created
idempotently by `ensureVectorStore()`).

Apply schema: `npx drizzle-kit push` · Seed: `npx tsx src/db/seed.ts` (idempotent).

---

## 8. API Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | public | Register (201) · errors: 400 validation, 409 duplicate |
| POST | `/api/auth/login` | public | Login · 401 invalid credentials |
| POST | `/api/auth/logout` | session | Destroy session |
| GET | `/api/auth/me` | session | Current user or `{user:null}` |
| GET | `/api/conversations` | user | List own conversations (+ message counts) |
| POST | `/api/conversations` | user | Create conversation (201) |
| GET | `/api/conversations/[id]` | owner | Conversation + messages · 404 if not owned |
| DELETE | `/api/conversations/[id]` | owner | Delete thread (cascades messages) |
| POST | `/api/chat` | user | RAG answer, NDJSON stream · 400/401/404 handled |
| GET | `/api/documents` | user | Knowledge-base listing (title, category, chunks, size, status) |
| POST | `/api/documents` | **admin** | Multipart upload → extract → chunk → embed → store (201) · 400/403/422 handled |
| DELETE | `/api/documents/[id]` | **admin** | Delete doc → chunks cascade → corpus re-index |
| GET | `/api/health` | public | `{ok:true}` + DB check |

---

## 9. Folder Structure

```
project/
├── README.md                      ← this spec (SDD)
├── drizzle.config.json
├── src/
│   ├── app/
│   │   ├── page.tsx               landing (server, live stats)
│   │   ├── layout.tsx             fonts + metadata
│   │   ├── globals.css            design tokens, keyframes, utilities
│   │   ├── icon.svg
│   │   ├── login/page.tsx  signup/page.tsx
│   │   ├── chat/page.tsx          guarded, SSR conversation list
│   │   ├── admin/page.tsx         admin-guarded, SSR docs + stats
│   │   └── api/
│   │       ├── auth/{signup,login,logout,me}/route.ts
│   │       ├── chat/route.ts                      (NDJSON stream)
│   │       ├── conversations/route.ts  conversations/[id]/route.ts
│   │       ├── documents/route.ts      documents/[id]/route.ts
│   │       └── health/route.ts
│   ├── components/
│   │   ├── landing/{landing,hero-chat}.tsx
│   │   ├── auth-form.tsx
│   │   ├── chat/{chat-app,markdown}.tsx
│   │   └── admin/admin-app.tsx
│   ├── db/
│   │   ├── schema.ts              7 tables + enums
│   │   ├── index.ts               pooled Drizzle client
│   │   ├── seed.ts  seed-data.ts  (idempotent demo corpus)
│   └── lib/
│       ├── auth.ts                sessions/bcrypt/guards
│       ├── embed.ts               TF-IDF feature-hashed vectors (1024-d)
│       ├── chunk.ts               text normalization + chunking
│       ├── vector.ts              SQL cosine search + hybrid re-rank
│       ├── kb.ts                  ingestion, IDF stats, re-embed, delete
│       ├── rag.ts                 pipeline orchestrator (+OpenAI upgrade)
│       ├── synthesize.ts          answer composer + unknown composer
│       └── types.ts               client-safe view models
└── scripts/rag-probe.ts           retrieval quality probe (dev utility)
```

Next.js unifies frontend and backend in one deployable; the
`frontend/ + backend/` separation from generic templates maps cleanly onto
`src/app` (UI + route handlers) and `src/lib` + `src/db` (services + data).

---

## 10. Development Phases

1. **Phase 1 — Foundations** ✅ schema, auth (bcrypt + DB sessions), guards
2. **Phase 2 — Ingestion** ✅ extraction, chunking, embedding, vector store
3. **Phase 3 — Retrieval** ✅ SQL cosine top-K, hybrid re-rank, confidence gate
   (calibrated with `scripts/rag-probe.ts` — ANSWER≥0.34, UNKNOWN≤0.17)
4. **Phase 4 — Generation** ✅ extractive synthesizer, sources, unknown copy
5. **Phase 5 — Chat UX** ✅ streaming endpoint, typewriter, history sidebar
6. **Phase 6 — Admin Studio** ✅ upload UX, pipeline progress, delete, re-index
7. **Phase 7 — Polish & deploy** ✅ landing, a11y touches, build validation

**Upgrade paths (Antigravity checklist):**
- `OPENAI_API_KEY` (+ optional `OPENAI_MODEL`) in env → generation switches to
  LLM with grounded system prompt automatically; synthesizer remains fallback
- Swap `embed()` for API embeddings → run a re-embed pass (`reembedCorpus`)
- Enable `secure: true` on the session cookie when serving over HTTPS

---

## 11. UI & UX Requirements (implemented)

- Distinctive dark "warm ink + saffron" identity; Devanagari accents (जानो)
- Landing communicates the pipeline visually (6-step animated diagram)
- Chat: streaming feel, typing indicator ("embedding · searching · grounding"),
  confidence badges, hoverable source chips with snippets, distinct dashed
  styling for unknown answers, char counter near limit
- States everywhere: empty KB, empty history, loading threads, busy buttons,
  form errors, API failure toasts, offline-safe messaging
- Keyboard: Enter sends / Shift+Enter newline; autofocused composer
- Responsive: 360px → 4K; mobile slide-over sidebar; touch targets ≥40px

---

## 12. Security Requirements (implemented)

- Passwords: bcrypt(10) one-way hashing; never stored/returned plain
- Sessions: httpOnly + sameSite=lax cookie; DB-validated with expiry; destroyed
  on logout; tokens are 256-bit CSPRNG hex
- Authorization: every API route re-checks session server-side; admin-only
  mutating document routes return 403; conversation/document ownership checks
  return 404 (no existence leaks)
- Injection-safe: Drizzle parameterized queries / sql templates only
- Input limits: message ≤2000 chars, file ≤10 MB, title/category length caps,
  strict extension allowlist for uploads
- XSS-safe rendering: custom markdown → React elements (no raw HTML injection)
- Uniform login errors (no user enumeration); version disclosure minimal
- Secrets via env only (`DATABASE_URL`, optional `OPENAI_API_KEY`) — nothing
  hardcoded; client bundle receives no secrets
- Document to harden in production: HTTPS + `secure` cookie flag, per-IP rate
  limiting on auth endpoints, CSP headers via `next.config.ts`

---

## 13. Final Expected Outcome

A production-grade, deployable RAG chatbot where:

- students register, log in, and chat with persistent history;
- answers are demonstrably grounded (sources + scores visible);
- unknown questions are refused politely with topic suggestions;
- admins grow/curate the knowledge base through a real UI;
- the retrieval pipeline (vector DB + semantic search) is genuine, not a
  thin LLM wrapper;
- all CRUD (users, sessions, conversations, messages, documents, chunks)
  works against a real database.

**Functional test checklist (run against local/preview or deployed URL):**

- [ ] Home loads, nav/anchors work, live stats show (13 docs / 36+ chunks)
- [ ] Signup → lands in `/chat`; duplicate signup → 409 message
- [ ] Login (student + admin demos); wrong password → uniform 401
- [ ] Ask "What is the B.Tech fee structure?" → answer cites *Fee Structure 2025-26* with confidence badge
- [ ] Ask "Who won the cricket world cup?" → honest unknown + suggestions
- [ ] Follow-up in same thread works (context); new chat; reopen old thread; delete thread
- [ ] Admin: open Knowledge Studio, upload a .txt/.pdf → chunk count toasts; new doc immediately answerable via chat
- [ ] Admin: delete a doc (two-tap) → related answers become unknown
- [ ] Non-admin calling `POST /api/documents` → 403; logged-out `/chat` → redirect
- [ ] Empty message, >2000-char message, oversized/unsupported file → clean errors
- [ ] Logout → cookie cleared, `/chat` redirects to `/login`
- [ ] Mobile viewport: sidebar slide-over, composer usable, no horizontal scroll
- [ ] Browser console: no errors; `/api/health` returns `{"ok":true}`

### Local setup

```bash
npm install
npx drizzle-kit push        # create tables (needs DATABASE_URL in .env)
npx tsx src/db/seed.ts      # demo accounts + 13-document corpus
npm run build && npm start  # or: npm run dev
```

### Deployment notes

Any Node host with a PostgreSQL `DATABASE_URL` works (Vercel, Render, Railway).
Run `drizzle-kit push` + the seed script once per fresh database. Set
`OPENAI_API_KEY` to enable LLM-quality generation; without it the built-in
synthesizer keeps the product fully functional offline.
