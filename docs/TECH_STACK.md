# LogYourMeal — Tech Stack

## Frontend
- **Framework:** React (Vite, JSX)
- **Styling:** CSS (styles.css)
- **Entry:** index.html → main.jsx → App.jsx

## Backend
- **Runtime:** Node.js
- **Framework:** Express (minimal proxy)
- **Purpose:** Proxies Anthropic API calls to avoid exposing keys client-side

## AI / LLM
- **Food parsing:** Anthropic API (`claude-sonnet-4-20250514`) via backend proxy at `POST /api/parse-food`
- **Goal calculation:** LLM reasoning (Claude Opus 4.5)
- **Planning/orchestration:** Claude Opus 4.5
- **UI suggestions:** Gemini Pro (where available)
- **Supported languages:** Hindi, Urdu, Bengali, Punjabi, Tamil, Telugu, English

## Auth & Database
- **Authentication:** Firebase Auth (email + Google)
- **Database:** Firestore
  - `users/{uid}/profile` — stats + appearance
  - `users/{uid}/food_logs/{date}` — meal entries
  - `users/{uid}/weight_logs` — weight + measurements

## Hosting & Deployment
- **Platform:** Firebase Hosting
- **Build tool:** Vite

## Environment Variables
- `VITE_ANTHROPIC_API_KEY` — via backend proxy only (never exposed to client)
- `VITE_FIREBASE_*` — Firebase config vars
- `ANTHROPIC_API_KEY` — backend only
