# LogYourMeal — Directives
# Layer 1 | File Destinations + Rules

Every file the agent creates must land in the exact path listed here.
Do not deviate. Do not create files outside this structure.

---

## ROOT
| File | Purpose |
|------|---------|
| claude.md | Root agent instruction — Anti-Gravity reads this first |
| README.md | Human-readable run + deploy guide |

## DIRECTIVES
| File | Purpose |
|------|---------|
| directives/README.md | THIS FILE — file destination map |

## ORCHESTRATION
| File | Purpose |
|------|---------|
| orchestration/plan.md | Ordered task list, phases, schedule, risks |

## EXECUTION — FRONTEND
| File | Purpose |
|------|---------|
| execution/frontend/package.json | Vite + React dependencies |
| execution/frontend/vite.config.js | Vite config with proxy to backend |
| execution/frontend/index.html | HTML entry point |
| execution/frontend/.env | VITE_ environment variables (git-ignored) |
| execution/frontend/src/main.jsx | React entry point |
| execution/frontend/src/App.jsx | Root component, routing, auth state, Firestore |
| execution/frontend/src/firebase.js | Firebase init + exports |
| execution/frontend/src/styles.css | Global styles |
| execution/frontend/src/components/Login.jsx | Email + Google auth screen |
| execution/frontend/src/components/Onboarding.jsx | Stats input (name, age, weight, BF%, goal) |
| execution/frontend/src/components/Customize.jsx | Character appearance picker |
| execution/frontend/src/components/HumanCharacter.jsx | SVG human, sex-aware BF% body shape |
| execution/frontend/src/components/MacroBar.jsx | Reusable macro progress bar |
| execution/frontend/src/components/MacroTracker.jsx | Today tab — food log + macros |
| execution/frontend/src/components/WeightTracker.jsx | Weight + measurements + charts |
| execution/frontend/src/components/History.jsx | Full meal + weight history |

## EXECUTION — BACKEND
| File | Purpose |
|------|---------|
| execution/backend/package.json | Express + dependencies |
| execution/backend/index.js | Proxy server — /api/parse-food, /api/coach |
| execution/backend/.env | ANTHROPIC_API_KEY (git-ignored) |

## MCP
| File | Purpose |
|------|---------|
| mcp/firebase_mcp_config.md | Firebase MCP install, auth, deploy steps |

## BRAND
| File | Purpose |
|------|---------|
| brand/reference_image.txt | UI design reference — paste Dribbble URL here |

## TESTS
| File | Purpose |
|------|---------|
| tests/test_plan.md | Live test steps, assertions, patch recipes |

---

## GIT IGNORE RULES
The agent must create a .gitignore at root with:
```
node_modules/
.env
dist/
.firebase/
```

## SECRET RULES
- NEVER commit .env files
- NEVER put ANTHROPIC_API_KEY in frontend code
- NEVER put Firebase config in backend (it belongs in frontend only)
- Backend only needs ANTHROPIC_API_KEY
