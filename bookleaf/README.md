# BookLeaf — Author Support & Communication Portal

A full-stack web application for managing author support queries at BookLeaf Publishing.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| AI/LLM | Google Gemini 1.5 Flash (or OpenAI GPT-4o-mini) |
| Real-time | Server-Sent Events (SSE) |
| Auth | JWT (email + password) |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI

### 1. Clone & install

```bash
# Backend
cd backend
npm install
cp .env.example .env   # then fill in your values

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bookleaf
JWT_SECRET=your_secret_here

# Pick ONE AI provider:
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key

# OR:
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your_openai_key
```

### 3. Seed the database

```bash
cd backend
npm run seed
```

This creates:
- 1 admin user
- 10 author users (from the provided sample JSON)
- 5 sample tickets

### 4. Start the servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@bookleaf.com | Admin@123 |
| Author | priya.sharma@email.com | Author@123 |
| Author | rohit.kapoor@email.com | Author@123 |
| Author | sneha.kulkarni@email.com | Author@123 |
| Author | diya.chatterjee@email.com | Author@123 |
| (all authors) | (see .env seed output) | Author@123 |

---

## API Documentation

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |

### Author
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/author/profile` | Author | Profile + all books |
| GET | `/api/author/books` | Author | Author's books list |

### Tickets
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/tickets` | Author | Create ticket (triggers AI classification) |
| GET | `/api/tickets` | Author/Admin | List tickets (authors see own only) |
| GET | `/api/tickets/:id` | Author/Admin | Get single ticket |
| POST | `/api/tickets/:id/messages` | Author/Admin | Add reply or internal note |
| PATCH | `/api/tickets/:id` | Admin | Update status, category, priority, assignment |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Admin | Stats, category breakdown, recent tickets |
| GET | `/api/admin/tickets` | Admin | All tickets with filters (status, priority, category, search) |
| GET | `/api/admin/authors` | Admin | All authors with book data |

### AI
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/generate-draft/:ticketId` | Admin | Generate/regenerate AI draft response |
| POST | `/api/ai/reclassify/:ticketId` | Admin | Re-run AI classification |

### Real-time
| Endpoint | Description |
|---|---|
| GET `/api/events?token=JWT` | SSE stream for live updates |

---

## Architecture Decisions

### AI Integration

**Provider choice:** Google Gemini 1.5 Flash as default, with OpenAI GPT-4o-mini as alternative. Both are cost-effective and fast for this use case. Configurable via `AI_PROVIDER` env var.

**Prompt strategy:**
- Classification prompt asks for structured JSON output with category, priority (0-100 score), and reasoning. Short and targeted — we only send the subject, description, and book title (not the full KB).
- Draft generation sends the full BookLeaf Knowledge Base + the specific ticket content + the author's actual data (royalty figures, book status). This produces specific, data-aware responses rather than generic boilerplate.
- Prompts are designed to output in BookLeaf's voice: empathetic, specific, professional.

**Cost management:**
- KB is ~900 tokens. Only included for draft generation, NOT for classification (which only needs subject + description).
- Author data is fetched and embedded per-request only for draft generation.
- AI draft is generated once on ticket creation (async, non-blocking) and cached in MongoDB. Admins regenerate on demand only.
- We use `gemini-1.5-flash` / `gpt-4o-mini` — both are ~10x cheaper than full models.

**Graceful degradation:**
- If AI is unavailable or rate-limited, classification falls back to rule-based keyword matching.
- Ticket creation never fails due to AI errors — classification simply uses the fallback.
- Draft generation failure is silent — admins can manually regenerate.

### Real-time Updates

Server-Sent Events (SSE) over WebSockets. Rationale: this is a one-way push from server → client (status updates, new replies). SSE is simpler, works over HTTP/1.1, requires no extra library, and reconnects automatically.

### Database Schema

Three collections:
- `users` — auth records (admin + author accounts)
- `authors` — author profiles and embedded book data (mirrors JSON shape)
- `tickets` — full ticket lifecycle with embedded message thread

Messages are embedded in tickets (not a separate collection) because they're always accessed together and the volume per ticket is bounded.

### Role-Based Access

- JWT middleware extracts user role on every request
- Authors are hard-filtered: tickets query always includes `{ authorId: req.user._id }` — no way to see others' data
- Internal notes are stripped server-side before sending to author clients

---

## Known Limitations / Future Improvements

- **File attachments** — UI exists, actual upload not implemented (would need S3/Cloudinary)
- **Email notifications** — tickets send SSE, but no email on new response (would add Nodemailer/SendGrid)
- **Multi-admin SSE** — current SSE stores one connection per userId in-memory; would use Redis pub/sub in production for multi-instance deployments
- **Pagination on author ticket list** — frontend shows all; would add infinite scroll for large datasets
- **Ticket search for authors** — currently only admins have search; could add for authors
- **Audit log** — no record of who changed what when; production would need this for compliance

---

## Write-Up

**What I prioritised:** AI integration quality and the ticket lifecycle (the core of the assignment). The classification + draft generation system is designed to actually be useful in production — not just call an API and show the result, but degrade gracefully, cache smartly, and produce responses that sound like a real support team.

**Trade-offs made:** I chose SSE over WebSockets for real-time — slightly less capable but much simpler for this one-directional use case. Embedded messages vs. separate collection — optimises for the most common read pattern (open a ticket, see the full thread) at the cost of flexibility for analytics queries.

**How I'd evolve this:** In production, I'd add Redis for SSE broadcasting across instances, S3 for attachments, a proper email layer (new response → email to author), Sentry for error tracking, and a rate limiter on the AI endpoints. I'd also add a ticket analytics page for the admin team to track resolution times, category trends, and author satisfaction.
