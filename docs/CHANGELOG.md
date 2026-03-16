# LogYourMeal — Changelog

## v2.0 — NIN Verification System + UX Improvements

### Backend

#### RAG-Based NIN Food Verification
- Replaced fuzzy/Levenshtein matching with semantic embedding-based retrieval
- Embedded 180 NIN food keys using `gemini-embedding-001`
- Cosine similarity search with 0.75 confidence threshold
- Verified NIN macros replace Gemini estimates, scaled by gram weight
- Each food item returns `source: "NIN-verified"` or `source: "AI-estimated"`

#### Persistent Vector Store Cache
- Embeddings saved to `execution/backend/nin_vectors.json` on first build
- Subsequent restarts load from disk — no API calls, instant startup
- Cache-first strategy with automatic fallback to API rebuild if file is missing or corrupted
- `nin_vectors.json` added to `.gitignore`

#### Server Initialization
- `buildNINVectorStore()` called inside `app.listen()` at server boot
- `applyNINVerification()` is now properly awaited — fixes race condition
- Parser model upgraded to `gemini-2.5-flash`

---

### Frontend

#### NIN Verified Badge (MacroTracker.jsx)
- Green `✓ NIN` badge displayed on food items where `item.source === "NIN-verified"`

#### NIN Info Modal (NINInfo.jsx)
- New bottom-sheet modal explaining NIN certification
- Covers: what NIN is, why it matters for South Asian diets
- Dismiss via tap outside or "Got it" button
- Source label changed from static "NIN Certified" to interactive "NIN Certified ⓘ" — tap opens modal

#### Bug Fix — Error Message Visibility
- `localMsg` was being set but never rendered
- Now displays above the log button, styled in red

#### Dark Mode Fix (Onboarding.jsx)
- Stats and Look pages now correctly inherit global dark mode state

#### Global Typography Cleanup
- Removed all em dashes (—) across frontend files
- Replaced with natural punctuation
- Form labels updated: `Body Fat % — optional` → `Body Fat % (optional)`
- All code comments changed from `—` to `-`

#### Copy Update (NINInfo.jsx)
- "a Hindi/Urdu description" → "your native language" for broader South Asian inclusivity

---

## v1.1 — Dark Mode Fix

- Fixed dark mode on Stats and Look pages in Onboarding.jsx
- Commit: bc97342

---

## v1.0 — Initial Release

- Multilingual food logging (Hindi, Urdu, Bengali, Punjabi, Tamil, Telugu, English)
- AI food parser via Gemini API with retry logic
- Macro and calorie tracking
- Custom goal setting with macro lock UI
- AI-calculated goals using LLM reasoning
- Goal timeline (target weight + date → weekly plan)
- Human SVG character with 7 body fat stages
- Weight + measurements tracker with recharts graphs
- History tab with calendar UI
- Meal merging
- Brutally honest AI coach
- Firebase Auth (email + Google) + Firestore persistence
- Backend security: auth middleware, input sanitisation, rate limiting, Firestore rules
