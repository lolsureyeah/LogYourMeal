# LogYourMeal — Architecture

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| AI — Food Parser | Gemini 2.5 Flash |
| AI — Embeddings | Gemini Embedding 001 |
| Deployment | Firebase Hosting (frontend) |

---

## Project Structure
LogYourMeal/
├── execution/
│   ├── frontend/          # React + Vite app
│   │   └── src/
│   │       ├── MacroTracker.jsx
│   │       ├── NINInfo.jsx
│   │       ├── Onboarding.jsx
│   │       └── ...
│   └── backend/           # Express API
│       ├── index.js        # Server + all routes
│       ├── indianFoods.js  # NIN food database (150+ foods)
│       ├── ninMatcher.js   # RAG embedding matcher
│       └── nin_vectors.json # Generated cache (git-ignored)
├── docs/
│   ├── CHANGELOG.md
│   └── ARCHITECTURE.md
└── ...

---

## Backend Routes

| Route | Auth | Description |
|---|---|---|
| POST /api/parse-food | ✅ | Multilingual food parsing via Gemini. Runs NIN RAG verification on results. |
| POST /api/coach | ✅ | Brutally honest AI coach comment based on daily progress. |
| POST /api/calculate-goals | ✅ | LLM-reasoned macro goal calculation with timeline math. |

---

## NIN Verification Pipeline
User input ("2 roti aur daal")
↓
Gemini 2.5 Flash parser
↓
[{ name: "roti", grams: 240, cal: 280 ... }]
↓
applyNINVerification()
↓
For each item:

Embed item.name via Gemini Embedding 001
Cosine similarity vs 180 cached NIN vectors
Score >= 0.75 → replace macros with NIN values
Score < 0.75  → keep Gemini estimate
↓
[{ name: "roti", grams: 240, cal: 713, source: "NIN-verified" }]
↓
Frontend renders ✓ NIN badge


---

## Vector Store Lifecycle

1. Server starts
2. Check for `nin_vectors.json` on disk
3a. File exists → load into memory in ~50ms
3b. File missing → embed 180 foods via API (~20s), write cache to disk
4. Store remains in memory for the server lifetime
5. Each food parse query embeds the food name and runs cosine search against store

---

## Security

- Firebase ID token verified on all `/api/` routes via `requireAuth` middleware
- User input sanitised before touching any prompt (`sanitiseInput()`)
- Prompt injection prevented via `<food_input>` tag isolation in Gemini prompts
- Firestore rules: users can only read/write their own data
- Rate limiting: 30 requests/min via `express-rate-limit`
- `serviceAccount.json` and `nin_vectors.json` excluded from git
