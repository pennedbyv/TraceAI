# Trace — Private AI Journal & Contemplative Digital Notebook

Trace is a professional-first private digital notebook equipped with an ambient, contemplative Gemini AI companion. It delivers the serene tactility of unbleached archival paper paired with user-isolated data persistence on Cloud Firestore and server-side secret management via Google Cloud Secret Manager.

---

## 1. Threat Model & Security Countermeasures

| Threat Zone | Threat Scenario / Risk | Countermeasure & Defensive Architecture |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Injection payloads, malformed JSON, prompt tampering | Strict schema validation, defensive input destructuring, and payload length truncation. |
| **2. Planning & Reasoning** | Indirect prompt injection attempting companion override | Explicit input boundary delimitation, strict system instruction pinning Trace to an archival notebook persona. |
| **3. Tool Execution / API** | Unauthorized API usage, client-side secret exfiltration | Zero client-side API keys: all Gemini calls proxied through server-side `/api/*` routes with automatic fallback ladder. |
| **4. Memory & State** | Cross-user data leakage, unauthenticated reads/writes | Path isolation at `/users/{userId}/...` enforced by hardened Firestore security rules (`request.auth.uid == userId`). |
| **5. Inter-System Communication** | Leakage of Gemini or GCP service credentials | Operational secrets managed through Google Cloud Secret Manager and injected at Cloud Run runtime. |

---

## 2. Cloud Firestore Security Rules

Deploy the following rules to guarantee complete user isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User-scoped data isolation: strictly enforce that a user can only read, write, and list
    // documents where the path matches their authenticated Firebase UID.
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /conversations/{conversationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /memories/{memoryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Default deny: prevent any access to arbitrary collections or root queries
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 3. Google Cloud Secret Manager Setup

Secure operational credentials by provisioning them directly in Google Cloud Secret Manager:

```bash
# 1. Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com

# 2. Create the Gemini API key secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 3. Add your Gemini API key secret version
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 4. Grant the default Compute Engine / Cloud Run service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Google Cloud Run Deployment Flow

Deploy the containerized full-stack application to Cloud Run with automatic secret injection:

```bash
# 1. Deploy the service to Cloud Run
gcloud run deploy trace-private-journal \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000

# 2. Apply the Mandatory Verification Resource Label
gcloud run services update trace-private-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 5. Functional Stability Walkthrough & Test Suite

The following scenarios detail test cases covering all observable interactions:

### Test Scenario 1: Unauthenticated User Landing & Authentication Flow
* **Pre-condition**: The user is unauthenticated or has opened a fresh browser session.
* **Step 1**: Visit the base application URL (`/`).
* **Expected Result**: The user sees the archival landing screen displaying the title *"Your thinking space for decisions, breakthroughs & work that actually matters"*, the *Stationery Pass* badge, and the *Continue with Google* button.
* **Step 2**: Click **Continue with Google**.
* **Expected Result**: A secure Google Sign-In authentication session is established. Upon success, the user is redirected away from the landing page directly into the private journal dashboard.
* **Step 3**: Click **Sign Out** from the user profile card at the bottom of the sidebar.
* **Expected Result**: The session is immediately cleared, all cached user data in memory is unmounted, and the user is redirected back to the landing page.

### Test Scenario 2: Journal Entry Authoring & Firestore Persistence
* **Pre-condition**: The user is authenticated under their private UID.
* **Step 1**: Click **+ New Entry** in the sidebar.
* **Expected Result**: A new manuscript leaf is initialized with title *"Untitled Reflection"*, default word count of 0, current timestamp, and category pill.
* **Step 2**: Type a title: *"Principles of Tactile Architecture"* and body content.
* **Expected Result**: The word counter dynamically computes words, reading time is calculated, and the top sync indicator updates from *"Persisting to Firestore..."* to *"All notes synced to private vault"*.
* **Step 3**: Change category to *"Work / Strategy"* and add a tag `#Architecture`.
* **Expected Result**: The entry updates in Firestore under `/users/{userId}/entries/{entryId}` with zero `undefined` values.

### Test Scenario 3: AI Companion Multi-Turn Reflections & Margin Notes
* **Pre-condition**: An entry is loaded in the editor.
* **Step 1**: Click **/ Companion Commands** or type `/`.
* **Expected Result**: A menu opens offering `/gem` (Reflective Companion), `/summarise` (Condense Breakthrough), `/prompt` (Catalytic Question), and `/quotes` (Resonant Citations).
* **Step 2**: Select `/summarise`.
* **Expected Result**: A thinking indicator appears showing server execution across the fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite`). A structured sidecar leaf renders the distilled essence of the entry.
* **Step 3**: Click **+ Insert as margin note**.
* **Expected Result**: The summary is appended to the entry's margin notes list and persisted in Firestore.

### Test Scenario 4: User Data Isolation & Permanent Shredding (Danger Zone)
* **Pre-condition**: User has existing entries in their vault.
* **Step 1**: Navigate to **Settings** in the sidebar.
* **Expected Result**: Displays authenticated Firebase UID, associated email, and active Firestore security rule status (`request.auth.uid == userId`).
* **Step 2**: In the *Irreversible Danger Zone*, click **Permanent Vault Purge & Key Shredding** and type `SHRED`.
* **Expected Result**: All documents belonging to the user are purged from Firestore, the vault resets, and isolated data cannot leak across any other user sessions.
