# ⚡ BookLeaf — Quick Setup Guide

## Step 1 — Install dependencies

Open TWO terminal windows.

**Terminal 1 (Backend):**
```
cd bookleaf\backend
npm install
```

**Terminal 2 (Frontend):**
```
cd bookleaf\frontend
npm install
```

---

## Step 2 — Configure your .env

The file `backend\.env` already exists. Open it and set your AI API key:

```env
# Use Gemini (free tier available at https://aistudio.google.com/app/apikey)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here

# OR use OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your_key_here
```

> ⚠️ The app works without an AI key — it falls back to rule-based classification automatically.

---

## Step 3 — Seed the database ← YOU MUST DO THIS

**In Terminal 1 (backend folder):**
```
npm run seed
```

You should see:
```
✅ Connected to MongoDB
✅ Admin user created
   Email: admin@bookleaf.com
   Password: Admin@123
✅ 10 authors seeded
✅ 5 sample tickets created
🎉 Database seeded successfully!
```

> ❌ If you see "MongoServerError: connect ECONNREFUSED" — MongoDB is not running.
> Start it with: `mongod` (or start the MongoDB service from Windows Services)

---

## Step 4 — Start both servers

**Terminal 1 (Backend):**
```
cd bookleaf\backend
npm run dev
```
→ Should say: `✅ Connected to MongoDB` and `🚀 Server running on port 5000`

**Terminal 2 (Frontend):**
```
cd bookleaf\frontend
npm run dev
```
→ Should say: `Local: http://localhost:5173/`

---

## Step 5 — Open the app

Go to: **http://localhost:5173**

### Login credentials:

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@bookleaf.com | Admin@123 |
| Author | priya.sharma@email.com | Author@123 |
| Author | rohit.kapoor@email.com | Author@123 |
| Author | sneha.kulkarni@email.com | Author@123 |
| Author | diya.chatterjee@email.com | Author@123 |
| Author | ananya.reddy@email.com | Author@123 |
| Author | vikram.joshi@email.com | Author@123 |
| Author | meera.nair@email.com | Author@123 |
| Author | arjun.malhotra@email.com | Author@123 |
| Author | farhan.sheikh@email.com | Author@123 |
| Author | kavita.deshmukh@email.com | Author@123 |

---

## ❓ Troubleshooting

**Login returns 401 "Invalid email or password"**
→ You haven't run `npm run seed` yet. Run it in the backend folder.

**"connect ECONNREFUSED 127.0.0.1:27017"**
→ MongoDB is not running. Start it with `mongod` in a new terminal, or start "MongoDB" from Windows Services.

**Frontend shows blank page / network error**
→ Make sure backend is running on port 5000 first.

**AI draft not generating**
→ Set `GEMINI_API_KEY` or `OPENAI_API_KEY` in `backend\.env`. The app still works without it using rule-based fallback.

**Re-seed (reset all data):**
```
cd backend
npm run seed
```
This wipes and recreates everything cleanly.
