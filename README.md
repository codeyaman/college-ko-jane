<div align="center">
  <img src="https://raw.githubusercontent.com/codeyaman/college-ko-jane/main/src/app/icon.svg" alt="College Ko Jano Logo" width="120" height="120" />

  <h1>🎓 College Ko Jano — Enterprise AI Campus Assistant</h1>

  <p>
    <strong>A next-generation, high-performance Knowledge Studio engineered to transform how students interact with campus data.</strong>
  </p>

  <p>
    <a href="https://collage-ko-jano.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-collage--ko--jano.vercel.app-F59E0B?style=for-the-badge&logo=vercel" alt="Live Demo" /></a>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB Atlas" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  </p>

  <p>Students interact in plain English or their native language. The AI instantly retrieves context from officially uploaded documents, generates strictly grounded responses, and clearly cites its sources. Zero hallucinations—if it isn't in the knowledge base, it won't be in the answer.</p>
</div>

---

## ✨ Enterprise-Grade Features

- 💬 **Dynamic Chat Interface** — NDJSON streaming responses, interactive suggestion chips, typing indicators, and per-message confidence badges.
- 🗣️ **Native Voice Intelligence** — Speak your questions via the built-in Microphone (Speech-to-Text) and listen to answers via the Speaker (Text-to-Speech) using high-performance, native Web Speech APIs—zero external bloat.
- 🌍 **Multilingual Translation Layer** — Ask questions in Hindi, Tamil, Telugu, or any native language. The AI seamlessly translates to English for highly precise Vector Search, then translates the answer back to your native language!
- 🗂️ **Knowledge Studio (Admin)** — Drag-and-drop document upload, automated chunking, and instant TF-IDF embedding. 
- 🔄 **Document Version Management** — Upload an updated file and the system intelligently increments the version (e.g., `v2`), purges outdated vector chunks, and synchronizes the knowledge base automatically.
- 🤖 **Auto-Generated FAQs Engine** — The system autonomously reads newly uploaded documents, extracts the most critical information, and generates conversational FAQs to populate a dedicated dashboard.
- 📊 **Feedback & Analytics** — Interactive thumbs up/down (👍/👎) system seamlessly integrated into an Admin Analytics dashboard to track AI performance and student satisfaction.
- 🔍 **In-DB Vector Search** — Top-K cosine similarity ranking executed entirely inside MongoDB Atlas Vector Search.

## 🛠 Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | Next.js (App Router), React 19, Tailwind CSS v4, Framer Motion, Lucide Icons |
| **Backend** | Next.js Route Handlers (Node.js runtime), Vercel AI SDK |
| **Database** | MongoDB Atlas, Mongoose ORM |
| **Retrieval Engine** | Custom RAG Pipeline, MongoDB Atlas Vector Search |
| **Embeddings** | Deterministic local TF-IDF feature hashing (1024-dim) |
| **Authentication** | Firebase Client & Admin SDK, Secure HTTP-only Sessions |

## 🚀 Quick Start Guide

Deploy the **College Ko Jano** enterprise environment locally in under 5 minutes.

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Database URI
- Firebase Project Configurations
- OpenRouter or Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/codeyaman/college-ko-jane.git
cd college-ko-jane
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and securely add the following keys:
```env
# Database
DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/db"

# LLM Providers (Provide at least one)
GEMINI_API_KEY="your-gemini-key"
OPENROUTER_API_KEY="your-openrouter-key"

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

### 4. Initialize the Knowledge Base
*(Optional: Run the seeder to populate the demo corpus for Vidya Vihar Institute of Technology and create demo user accounts).*
```bash
npx tsx src/db/seed.ts
```

### 5. Launch the Application
```bash
npm run dev
```
Access the Knowledge Studio at [http://localhost:3000](http://localhost:3000)!

---

## 🏗 Architecture & Data Flow

The core of College Ko Jano is its highly optimized, hallucination-resistant RAG (Retrieval-Augmented Generation) pipeline:

```mermaid
graph TD
    User([Student]) -->|Multilingual/Voice Query| UI[Chat Interface]
    UI --> Translate[Auto-Translation Layer]
    Translate -->|English| E[Vector Embedding]
    E --> DB[(MongoDB Atlas Vector Search)]
    DB --> R[Hybrid Re-ranker]
    R --> G{Confidence Gate}
    G -- High Confidence --> Gen[Grounded Generation]
    G -- Low Confidence --> U[Unknown/Fallback Handler]
    Gen --> TransOut[Translate back to Native Language]
    TransOut --> UI
```

## 🔐 Security & Privacy First

- **Zero Secrets Leaked:** Environment variables and API keys are strictly confined to the server environment.
- **Robust Database Integrity:** Mongoose schemas enforce rigorous data validation and parameterization.
- **Enterprise Authentication:** Firebase Admin handles JWT token verification entirely server-side; highly secure HTTP-only cookies manage session persistence.

---

<div align="center">
  <p>Engineered with 💛 by <a href="https://github.com/codeyaman">codeyaman</a></p>
</div>
