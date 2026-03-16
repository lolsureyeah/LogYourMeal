# LogYourMeal — Firebase MCP Configuration
# Layer 3 | MCP Install + Auth + Deploy Flow

---

## STEP 1 — INSTALL FIREBASE MCP IN ANTI-GRAVITY

In Anti-Gravity, open the MCP panel (left sidebar → plug icon).
Click "Add MCP Server" and enter:

```
Server name:    firebase
Command:        npx -y @firebase/mcp
```

Click "Allow" on all requested actions:
- firebase_list_projects
- firebase_deploy
- firebase_get_hosting_config
- firestore_get_rules
- firestore_set_rules

---

## STEP 2 — FIREBASE LOGIN (Human Action Required)

The agent will pause here and display this exact message to the user:

---
**[AGENT MESSAGE TO USER]**

I need you to log in to Firebase so I can deploy LogYourMeal.
Please do the following:

1. Open a terminal (Command Prompt or the terminal inside Anti-Gravity)
2. Run this command:
   ```
   npx firebase-tools login --no-localhost
   ```
3. A URL will appear in the terminal — copy it and open it in your browser
4. Sign in with your Google account (the same one you used to create the Firebase project)
5. After signing in, you will see a code on the screen — copy it
6. Paste that code back here and press Enter

**Paste your session code here:** {{MCP_SESSION_CODE}}

---

## STEP 3 — SET FIREBASE PROJECT

After login, the agent runs:
```
npx firebase-tools use {{FIREBASE_PROJECT_ID}}
```

If you don't know your project ID:
- Go to console.firebase.google.com
- Click your project
- The project ID is shown under the project name (e.g. logyourmeal-abc123)

---

## STEP 4 — INIT FIREBASE HOSTING

The agent runs these commands from execution/frontend/:
```bash
cd execution/frontend
npm run build
cd ../..
npx firebase-tools init hosting
```

When prompted:
- "What do you want to use as your public directory?" → type: `execution/frontend/dist`
- "Configure as a single-page app?" → Yes
- "Set up automatic builds with GitHub?" → No

This creates firebase.json at the root. Contents will be:
```json
{
  "hosting": {
    "public": "execution/frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

---

## STEP 5 — DEPLOY

The agent runs:
```bash
npx firebase-tools deploy --only hosting
```

Expected output:
```
✔  Deploy complete!
Project Console: https://console.firebase.google.com/project/{{FIREBASE_PROJECT_ID}}/overview
Hosting URL: https://{{FIREBASE_PROJECT_ID}}.web.app
```

The agent reports the Hosting URL to the user.

---

## STEP 6 — FIRESTORE SECURITY RULES

The agent applies these rules via MCP or manual paste in Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures each user can only read and write their own data.

---

## TROUBLESHOOTING

| Problem | Fix |
|---------|-----|
| "Firebase project not found" | Run: npx firebase-tools use --add → select your project |
| "Permission denied" | Re-run login flow from Step 2 |
| "dist folder not found" | Run npm run build in execution/frontend first |
| App shows blank on deploy | Check firebase.json has correct "public" path |
| Auth not working on deployed URL | Add deployed URL to Firebase Console → Auth → Authorized domains |

---

## POST-DEPLOY: ADD AUTHORIZED DOMAIN

After deploying, go to:
Firebase Console → Authentication → Settings → Authorized domains
→ Add your-project-id.web.app

This is required for Google Sign-In to work on the live URL.
