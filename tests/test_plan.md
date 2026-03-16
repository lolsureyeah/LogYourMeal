# LogYourMeal — Live Test Plan
# Layer 3 | Test Assertions + Patch Recipes

---

## HOW TO RUN TESTS

Start both servers:
```bash
# Terminal 1
cd execution/backend && node index.js
# Expect: "LogYourMeal backend running on port 3001"

# Terminal 2
cd execution/frontend && npm run dev
# Expect: "Local: http://localhost:5173"
```

Open http://localhost:5173 and execute each test below in order.

---

## TEST 1 — Auth Screen
**Action:** Open http://localhost:5173
**Expected:** Dark screen with "LOGYOURMEAL" label, "Welcome Back" heading, email + password inputs, "Sign In" button, "Continue with Google" button
**Pass criteria:** All elements visible, no white-on-white text, no console errors

**PATCH if text invisible (white on white):**
File: execution/frontend/src/components/Login.jsx
Find: `color: "#e8e8f0"` on input styles
Ensure: input style includes `color: "#e8e8f0"` — this is the known white-text bug fix
```css
/* Minimal fix — add to styles.css */
input, textarea {
  color: #e8e8f0 !important;
  background: #13132b !important;
}
```

---

## TEST 2 — Sign Up
**Action:** Click "Create account" → enter test@test.com / password123 → click "Create Account"
**Expected:** Redirected to Onboarding screen showing stats form
**Pass criteria:** No auth error, Onboarding renders with name/age/weight/height/BF%/sex/goal fields

---

## TEST 3 — Onboarding
**Action:** Fill in: Name=TestUser, Age=25, Weight=72, Height=175, BF%=18, Sex=Male, Goal=Maintain, TargetWeight=70
**Expected:** "DESIGN CHARACTER →" button enabled and clickable
**Action:** Click "DESIGN CHARACTER →"
**Expected:** Customize screen shows live SVG character preview, skin/hair/shirt/pants colour pickers

---

## TEST 4 — Character Body Fat Visual (CRITICAL)
**Action:** In browser console, test character renders:
- BF% 5 (male) → character should be very lean, narrow waist, abs visible at progress>50
- BF% 18 (male) → average build, no abs
- BF% 30 (male) → wide waist, large belly bulge visible
- BF% 20 (female) → athletic female silhouette, wider hips than male equivalent
- BF% 35 (female) → fuller female silhouette, wider hips + torso
**Expected:** Each BF% category shows a VISUALLY DISTINCT body shape
**Expected:** BF% badge shows correct category label + colour:
  - Male 6-13% → "Athlete" green
  - Male 18-24% → "Average" yellow
  - Male 30%+ → "Obese" red
  - Female 14-20% → "Athlete" green
  - Female 25-31% → "Average" yellow
  - Female 38%+ → "Obese" red

---

## TEST 5 — Food Logging (English)
**Action:** In Today tab → enter meal name "Lunch" → type "200g chicken breast, 100g rice" → click LOG IT
**Expected:** Items parsed and displayed with calories + macros
**Expected:** Macro bars update with new values
**Expected:** Character AI comment appears within 3 seconds
**Pass criteria:** cal > 0, protein > 0, carbs > 0 for the logged items

---

## TEST 6 — Multilingual Food Logging (Hindi)
**Action:** Enter "chaar roti, ek katori moong daal" → click LOG IT
**Expected:** Parsed as approximately 4 rotis (~160g) + 1 bowl moong dal (~150g)
**Expected:** Reasonable calorie values returned (roughly 400-600 kcal total)
**Pass criteria:** Items array length ≥ 2, all cals > 0

---

## TEST 7 — Character Progress Animation
**Action:** Log enough food to reach >50% of calorie goal
**Expected:** Character eyes open (was sleepy at 0%), smile appears, arms raise slightly
**Action:** Log to >85%
**Expected:** Character arms raise to flex position
**Action:** Log to >95%
**Expected:** Sparkles appear, full glow effect, "PEAK MODE ✦" stage label

---

## TEST 8 — Weight Tracking
**Action:** Click "Weight" tab → enter weight 72.4, waist 82, chest 96, hips 90 → click SAVE ENTRY
**Expected:** Entry saved and shown in list
**Action:** Add 2 more entries on different dates (change system date or mock data)
**Expected:** Line chart renders with weight over time
**Expected:** Target weight reference line visible if target was set in onboarding

---

## TEST 9 — Data Persistence (Firestore)
**Action:** Log a meal, then refresh the page (F5)
**Expected:** User is still logged in, today's meals are still visible
**Action:** Log out and log back in
**Expected:** Profile (name, stats, appearance) reloads correctly

---

## TEST 10 — Google Sign-In
**Action:** Click "Sign Out" → click "Continue with Google" → complete Google OAuth popup
**Expected:** Redirected to Onboarding (if new) or main app (if returning)
**Pass criteria:** No CORS errors, no "unauthorized domain" error

---

## KNOWN BUGS + PATCHES

### BUG 1: White text on white/light background
**Symptom:** Input fields show invisible text
**File:** execution/frontend/src/styles.css
**Fix:**
```css
* { box-sizing: border-box; }
body { background: #0a0a14; color: #e8e8f0; margin: 0; }
input, textarea, select {
  color: #e8e8f0 !important;
  background: #13132b !important;
  -webkit-text-fill-color: #e8e8f0;
}
```

### BUG 2: Character shows same shape for all BF%
**Symptom:** No visual difference between lean and obese
**File:** execution/frontend/src/components/HumanCharacter.jsx
**Fix:** Verify getFatness() returns different values — add console.log(fat) temporarily

### BUG 3: Food parsing returns empty array
**Symptom:** "Couldn't recognise that food"
**Check:** Is backend running on port 3001? Check terminal 1.
**Check:** Is ANTHROPIC_API_KEY set in execution/backend/.env?
**Fix:** curl test:
```bash
curl -X POST http://localhost:3001/api/parse-food \
  -H "Content-Type: application/json" \
  -d '{"text":"200g chicken, 100g rice"}'
```
Expected: `{"items":[{"name":"chicken breast","grams":200,...}]}`

### BUG 4: Firebase auth "unauthorized domain" on deployed URL
**Fix:** Firebase Console → Auth → Settings → Authorized domains → Add your-project.web.app

---

## POST-DEPLOY VALIDATION
After `firebase deploy`, open the public URL and repeat:
- Test 1 (auth screen loads)
- Test 2 (sign up works)
- Test 5 (food logging works)
- Test 9 (data persists)
If all pass → deployment successful. Report URL to user.
