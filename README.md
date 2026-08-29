<div align="center">
  <img src="https://raw.githubusercontent.com/codeyaman/college-ko-jane/main/src/app/icon.svg" alt="College Ko Jano Logo" width="120" height="120" />

  <h1>🎓 College Ko Jano — कॉलेज को जानो</h1>

  <p>
    <strong>A highly-performant, RAG-based College Assistant built for the modern student.</strong>
  </p>

  <p>
    <a href="https://collage-ko-jano.vercel.app/"><img src="https://img.shields.io/badge/Live_Demo-ollage-ko-jano.vercel.app-F59E0B?style=for-the-badge&logo=vercel" alt="Live Demo" /></a>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/MangoDB-Atlas-4169E1?style=for-the-badge&logo=mangodbatlas" alt="MangoDB-Atlas" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  </p>

  <p>Students ask questions in plain English. The assistant instantly retrieves passages from officially uploaded college documents, generates a strictly grounded answer, and cites its sources. No hallucinations—if it doesn't know, it says so.</p>
</div>

---

## ✨ Features That Stand Out

- 💬 **Intelligent Chat Interface** — NDJSON streaming responses, typewriter effect, suggestion chips, and per-message confidence badges.
- 📚 **Dynamic RAG Pipeline** — Retrieve → Hybrid Re-Rank → Confidence Gate → Grounded Generate.
- 🔐 **Secure Role-based Auth** — Seamless Firebase Authentication integrated securely via Server-Side Admin SDK.
- 🗂️ **Knowledge Studio (Admin)** — Drag-and-drop file upload, automatic text extraction, overlap-aware chunking, and instant TF-IDF embedding.
- 🔍 **In-DB Vector Search** — Top-K cosine similarity ranking executed entirely inside PostgreSQL via custom `dot_product()` functions.
- 🚀 **Lightning Fast** — Built on Next.js App Router and optimized for maximum speed and SEO.

## 🛠 Tech Stack

| Category | Technologies |
| --- | --- |
| **Frontend** | Next.js (App Router), React 19, Tailwind CSS v4, Framer Motion, Lucide Icons |
| **Backend** | Next.js Route Handlers (Node.js runtime) |
| **Database** | PostgreSQL 15, Drizzle ORM |
| **Vector Engine** | PostgreSQL-native `real[]` column with in-DB `dot_product()` |
| **Embeddings** | Deterministic local TF-IDF feature hashing (1024-dim) |
| **Authentication** | Firebase Client & Admin SDK, Secure HTTP-only Sessions |

## 🚀 Quick Start Guide

Want to run **College Ko Jano** locally? It only takes a few minutes!

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (e.g., Supabase, Neon)
- Firebase Project

### 1. Clone the repository
```bash
git clone https://github.com/codeyaman/college-ko-jane.git
cd college-ko-jane
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add the following keys:
```env
# Database
DATABASE_URL="postgres://user:password@host:port/db"

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"

# Firebase Admin (Server-Side)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-client-email"
FIREBASE_PRIVATE_KEY="your-private-key"
```

### 4. Push Database Schema & Seed Data
```bash
npx drizzle-kit push
npx tsx src/db/seed.ts
```
*(The seed script automatically generates a demo corpus for Vidya Vihar Institute of Technology and creates demo student/admin accounts).*

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🏗 System Architecture

The core of College Ko Jano is its blazing fast RAG (Retrieval-Augmented Generation) pipeline:

```mermaid
graph LR
    Q[User Question] --> E[Embed Vector]
    E --> DB[(Postgres Vector Search)]
    DB --> R[Hybrid Re-ranker]
    R --> G{Confidence Gate}
    G -- High Confidence --> Gen[Grounded Generation]
    G -- Low Confidence --> U[Unknown/Fallback]
    Gen --> A[Answer + Cited Sources]
```

## 🔐 Security & Privacy First

- **Zero Secrets Leaked:** No environment variables or API keys are ever bundled into the client.
- **SQL-Injection Safe:** Drizzle ORM strictly parameterizes all database queries.
- **Safe Authentication:** Firebase Admin handles token verification server-side; passwords are never sent in plain text.

---

<div align="center">
  <p>Built with 💛 by <a href="https://github.com/codeyaman">codeyaman</a></p>
</div>
