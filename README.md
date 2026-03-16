# LogYourMeal
## South Asian Nutrition Tracker — Anti-Gravity Project

---

## WHAT THIS IS
LogYourMeal is a nutrition tracker for South Asian users with:
- Multilingual food logging (Hindi, Urdu, Bengali, Punjabi, Tamil, Telugu, English)
- AI-powered food parser (Claude API) — understands "chaar roti, ek katori moong daal"
- Human SVG character reflecting your actual body fat % (sex-aware: male + female ranges)
- Weight + measurements tracker with charts
- Firebase Auth (email + Google) + Firestore persistence

---

## PREREQUISITES
- Node.js LTS (nodejs.org)
- Git (git-scm.com)
- Firebase project (console.firebase.google.com)
- Anthropic API key (console.anthropic.com)

---

## STEP 1 — CLONE / OPEN

If starting fresh in Anti-Gravity:
1. Open Anti-Gravity
2. File → Open Folder → select this logyourmeal-antigravity folder
3. Anti-Gravity reads claude.md automatically

---

## STEP 2 — SET UP ENVIRONMENT VARIABLES

**Frontend** — copy .env.template to .env:
```bash
cd execution/frontend
copy .env.template .env
```
Open .env and fill in your Firebase values from:
Firebase Console → Project Settings → Your Apps → Web App → Config

**Backend** — copy .env.template to .env:
```bash
cd execution/backend
copy .env.template .env
```
Open .env and add your Anthropic API key.

---

## STEP 3 — INSTALL DEPENDENCIES

```bash
# Frontend
cd execution/frontend
npm install

# Backend
cd ../backend
npm install
```

---

## STEP 4 — RUN LOCALLY

Open two terminals:

**Terminal 1 (backend):**
```bash
cd execution/backend
npm start
# → LogYourMeal backend running on port 3001
```

**Terminal 2 (frontend):**
```bash
cd execution/frontend
npm run dev
# → Local: http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## STEP 5 — RUN TESTS

Follow tests/test_plan.md — execute all 10 tests in order.
All must pass before deploying.

---

## STEP 6 — DEPLOY TO FIREBASE HOSTING

Follow mcp/firebase_mcp_config.md exactly.

Quick summary:
```bash
# Login to Firebase
npx firebase-tools login --no-localhost

# Set project
npx firebase-tools use YOUR_PROJECT_ID

# Build frontend
cd execution/frontend
npm run build

# Init hosting (first time only)
cd ../..
npx firebase-tools init hosting
# Public dir: execution/frontend/dist
# Single-page app: Yes

# Deploy
npx firebase-tools deploy --only hosting
```

Your app will be live at: https://YOUR_PROJECT_ID.web.app

After deploy, add your-project.web.app to:
Firebase Console → Authentication → Settings → Authorized domains

---

## BODY FAT % VISUAL SYSTEM

The character's body shape changes based on BF% and sex:

**Male ranges:**
| BF% | Category | Character |
|-----|----------|-----------|
| 2–5% | Essential | Extremely lean, sharp definition |
| 6–13% | Athlete | Lean, abs visible when fueled |
| 14–17% | Fitness | Toned, slight waist |
| 18–24% | Average | Normal build |
| 25–29% | Overweight | Visible belly bulge |
| 30%+ | Obese | Wide torso, large belly |

**Female ranges:**
| BF% | Category | Character |
|-----|----------|-----------|
| 10–13% | Essential | Very lean, narrow |
| 14–20% | Athlete | Athletic, visible curves |
| 21–24% | Fitness | Fit, hourglass shape |
| 25–31% | Average | Normal female silhouette |
| 32–37% | Overweight | Fuller torso + hips |
| 38%+ | Obese | Wide silhouette |

---

## PROJECT STRUCTURE

```
logyourmeal-antigravity/
├── claude.md                    ← Anti-Gravity agent instruction (3-layer)
├── README.md                    ← This file
├── directives/README.md         ← File destination map
├── orchestration/plan.md        ← Task list + phases
├── execution/
│   ├── frontend/                ← React + Vite app
│   └── backend/                 ← Express API proxy
├── mcp/firebase_mcp_config.md   ← Firebase deploy guide
├── brand/reference_image.txt    ← UI design reference
└── tests/test_plan.md           ← Live test assertions
```

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| White text invisible | Add styles.css fix from tests/test_plan.md Bug #1 |
| Food parsing empty | Check backend is running + ANTHROPIC_API_KEY is set |
| Firebase auth fails | Check .env VITE_FIREBASE_* values are correct |
| Google Sign-In blocked | Add domain to Firebase Auth → Authorized Domains |
| Deploy blank page | Check firebase.json public path = execution/frontend/dist |
