# LogYourMeal — Orchestration Plan
# Layer 2 | Anti-Gravity Task List + Implementation Schedule

---

## ASSUMPTIONS
- Stack: React + Vite (frontend), Node/Express (backend proxy), Firebase Auth + Firestore
- Deployment: Firebase Hosting (frontend) + Cloud Functions or standalone Node server (backend)
- Auth: Email/Password + Google Sign-In
- AI: Claude API via backend proxy (never exposed to frontend)
- Character: SVG human, sex-aware body fat % visual system

---

## ORDERED TASK LIST

### PHASE 1 — ENVIRONMENT SETUP
| # | Task | Type | Who |
|---|------|------|-----|
| 1 | Install Node.js LTS from nodejs.org | install | Human |
| 2 | Install Git from git-scm.com | install | Human |
| 3 | Install Anti-Gravity from antigravity.google | install | Human |
| 4 | Create Firebase project at console.firebase.google.com | human-action | Human |
| 5 | Enable Email/Password auth in Firebase console | human-action | Human |
| 6 | Enable Google Sign-In auth in Firebase console | human-action | Human |
| 7 | Create Firestore database (production mode) | human-action | Human |
| 8 | Copy Firebase config object from Project Settings | human-action | Human |
| 9 | Get Anthropic API key from console.anthropic.com | human-action | Human |
| 10 | Create GitHub account + empty repo named logyourmeal | human-action | Human |

### PHASE 2 — PROJECT INITIALIZATION
| # | Task | Type | Who |
|---|------|------|-----|
| 11 | Open Anti-Gravity, open logyourmeal-antigravity folder | agent | Agent |
| 12 | Verify claude.md exists at root | check | Agent |
| 13 | cd execution/frontend && npm create vite@latest . -- --template react | shell | Agent |
| 14 | cd execution/frontend && npm install | shell | Agent |
| 15 | npm install firebase react-router-dom recharts | shell | Agent |
| 16 | cd execution/backend && npm init -y | shell | Agent |
| 17 | cd execution/backend && npm install express cors dotenv node-fetch | shell | Agent |
| 18 | Create execution/frontend/.env with VITE_ placeholders | create-file | Agent |
| 19 | Create execution/backend/.env with ANTHROPIC_API_KEY placeholder | create-file | Agent |
| 20 | Replace placeholders with real values from Phase 1 | human-action | Human |

### PHASE 3 — BUILD FRONTEND
| # | Task | Type | Who |
|---|------|------|-----|
| 21 | Create execution/frontend/src/firebase.js | create-file | Agent |
| 22 | Create execution/frontend/src/components/Login.jsx | create-file | Agent |
| 23 | Create execution/frontend/src/components/Onboarding.jsx | create-file | Agent |
| 24 | Create execution/frontend/src/components/Customize.jsx | create-file | Agent |
| 25 | Create execution/frontend/src/components/HumanCharacter.jsx (sex-aware BF%) | create-file | Agent |
| 26 | Create execution/frontend/src/components/MacroBar.jsx | create-file | Agent |
| 27 | Create execution/frontend/src/components/MacroTracker.jsx | create-file | Agent |
| 28 | Create execution/frontend/src/components/WeightTracker.jsx | create-file | Agent |
| 29 | Create execution/frontend/src/components/History.jsx | create-file | Agent |
| 30 | Create execution/frontend/src/App.jsx (main app + routing) | create-file | Agent |
| 31 | Create execution/frontend/src/styles.css | create-file | Agent |
| 32 | Update execution/frontend/src/main.jsx | update-file | Agent |

### PHASE 4 — BUILD BACKEND
| # | Task | Type | Who |
|---|------|------|-----|
| 33 | Create execution/backend/index.js (Express proxy) | create-file | Agent |
| 34 | Test backend locally: node index.js → expect "Server running on 3001" | shell+test | Agent |

### PHASE 5 — WIRE FIRESTORE
| # | Task | Type | Who |
|---|------|------|-----|
| 35 | Create Firestore security rules (users/{uid} only) | create-file | Agent |
| 36 | Add save/load profile to App.jsx via Firestore | update-file | Agent |
| 37 | Add save/load food_logs to MacroTracker.jsx | update-file | Agent |
| 38 | Add save/load weight_logs to WeightTracker.jsx | update-file | Agent |

### PHASE 6 — LIVE TESTS
| # | Task | Type | Who |
|---|------|------|-----|
| 39 | Run npm run dev in frontend folder | shell | Agent |
| 40 | Run node index.js in backend folder | shell | Agent |
| 41 | Execute all assertions in tests/test_plan.md | test | Agent+Human |
| 42 | Fix any failures with minimal patches | fix | Agent |
| 43 | Re-run failed tests after patches | re-test | Agent |

### PHASE 7 — FIREBASE MCP + DEPLOY
| # | Task | Type | Who |
|---|------|------|-----|
| 44 | Install Firebase MCP in Anti-Gravity (see mcp/firebase_mcp_config.md) | mcp | Agent+Human |
| 45 | Authenticate Firebase via MCP session code | mcp | Human |
| 46 | cd execution/frontend && npm run build | shell | Agent |
| 47 | firebase init hosting (select dist folder) | shell | Agent |
| 48 | firebase deploy --only hosting | shell | Agent |
| 49 | Validate public URL against test checklist | test | Agent+Human |
| 50 | Report final public URL to user | report | Agent |

---

## IMPLEMENTATION SCHEDULE (estimated)

| Phase | Time |
|-------|------|
| 1 Environment Setup | 30 min (human actions) |
| 2 Project Init | 5 min |
| 3 Build Frontend | 20 min |
| 4 Build Backend | 5 min |
| 5 Wire Firestore | 10 min |
| 6 Live Tests | 15 min |
| 7 Deploy | 10 min |
| **Total** | **~95 min** |

---

## KNOWN RISKS + MITIGATIONS

| Risk | Mitigation |
|------|-----------|
| Firebase MCP session expires | Re-run login flow from mcp/firebase_mcp_config.md |
| Anthropic API key exposed in frontend | Always route through /api/parse-food backend proxy |
| Food parsing returns empty JSON | Fall back to local FOOD_DB in MacroTracker.jsx |
| White text on white background (known UI bug) | See tests/test_plan.md patch section |
| Firestore rules block reads | Check rules allow users/{uid} read/write |
