# Personal AI Journal — Project Context

## 1. Product

A **private, professional-first AI digital notebook**.

The core experience is a beautiful digital journal where users write naturally. Gemini is an **AI companion inside the notebook**, not the primary interface.

### Product principle

> **A beautiful private notebook with an AI companion.**

The product should feel personal, calm, premium, and reflective rather than like a chatbot or an administrative SaaS dashboard.

---

## 2. Core UX Principle

### Notebook first, AI second

The journal must feel like a real digital notebook.

Users should be able to:

- Open a journal entry
- Write freely
- Continue editing their thoughts
- Navigate between entries
- Search previous entries
- See dates and journal metadata
- Invoke Gemini only when they want assistance

The journal itself must **NOT** be a chat window.

Gemini should appear as a contextual assistant/panel when invoked.

---

## 3. Gemini Interaction

Gemini can be invoked from inside the notebook using slash commands.

Initial commands:

- `/gem`
- `/ask`
- `/summarise`
- `/prompt`
- `/quotes`

Examples:

`/gem`
- Opens the Gemini assistance experience.

`/ask`
- Ask Gemini a question about the current entry/context.

`/summarise`
- Summarise the current journal entry.

`/prompt`
- Generate a useful reflection prompt based on the current context.

`/quotes`
- Extract notable quotes/thoughts from the entry.

These commands should feel like lightweight writing tools, not a replacement for the notebook.

---

## 4. Work / Personal Mode

The application supports:

- Work
- Personal

### Important UX rule

There must be **ONE application interface**.

Do NOT create:

- Separate Work dashboard
- Separate Personal dashboard
- Separate navigation
- Separate entry lists
- Separate application layouts

The mode is simply contextual metadata and affects relevant prompts/features.

### Default

Default mode: **Work**

The user can switch modes whenever needed.

### Context-specific rendering

Only show features/prompts relevant to the current mode.

Example:

If a prompt is:

> "What decision did you make?"

and it is relevant only to Work mode, it should **not render in Personal mode**.

Do not merely grey it out.

---

# 5. Main Navigation

Use a simple left navigation:

- Journal
- Memories
- Search
- Integrations
- Settings

The Journal is the primary destination.

---

# 6. Planned Features

Implement progressively. Do not build everything at once.

### Core

- Firebase Google Authentication
- Protected routes
- User-isolated Firestore
- Notebook-style journal
- Journal entry history
- Search
- Gemini interaction
- Light/dark mode

### Memory

- Journaling streak
- Weekly reflections
- Monthly reflections
- AI-generated memory cards / flashcards
- Recurring themes
- Notable moments
- Timeline / memory history

### Integrations

- Slack
- Google Calendar
- Custom integrations

### Location

- Leaflet
- OpenStreetMap
- Private map showing the user's own journal-related locations

The map is for personal exploration.

It is NOT a public/social map.

### Voice

- Voice journaling
- Voice input should eventually create/edit journal content

---

# 7. Integrations

Integrations should be explicit and user-controlled.

## Slack

Slack should NOT become a surveillance or full-message-ingestion system.

Preferred interaction:

**Slack → Save to Journal**

The user explicitly chooses a Slack message to save.

Also potentially:

**Journal → Share to Slack**

The user explicitly chooses when something is shared.

Do not automatically ingest all Slack conversations.

## Calendar

Calendar integration can eventually provide useful context around journal entries, reflections, and events.

Do not automatically expose unnecessary calendar data.

## Custom integrations

Provide an Integrations section where additional integrations can eventually be configured.

---

# 8. Visual Design

The visual source of truth is the frontend created in **Google Stitch**.

Preserve the Stitch design when modifying functionality.

### Desired aesthetic

- Digital notebook
- Editorial
- Calm
- Premium
- Human
- Reflective
- Excellent typography
- Generous whitespace
- Subtle backgrounds
- Atmospheric visual elements
- Smooth transitions
- Subtle micro-interactions
- Responsive
- Beautiful light/dark themes

### Avoid

- Generic admin dashboard appearance
- ChatGPT-style interface
- Chat-first layout
- Excessive glassmorphism
- Neon colors
- Overly futuristic AI visuals
- Excessive cards
- Excessive gradients
- Unnecessary UI complexity

The application should look like a **real premium journal product**.

---

# 9. Technical Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Authentication

- Firebase Authentication
- Google Sign-In

## Database

- Cloud Firestore

## AI

- Gemini API

Gemini API keys must NEVER be exposed to the client.

## Backend

Backend architecture should be compatible with Google Cloud Run.

Cloud Run deployment is currently postponed because billing is not available.

Do not make deployment-dependent assumptions during local development.

## Secrets

Use Google Cloud Secret Manager for production secrets.

Never commit:

- API keys
- Service account private keys
- passwords
- `.env` files containing real secrets

Use `.env.example` for documentation.

---

# 10. Authentication Architecture

Authentication flow:

```text
Landing Page
      ↓
Google Sign-In
      ↓
Firebase Authentication
      ↓
Authenticated User
      ↓
Protected Application
```

Use the Firebase Authentication UID as the canonical user identity.

Do not trust a UID supplied manually by the client.

---

# 11. Firestore Architecture

Use strict user-scoped data.

Recommended structure:

```text
users/{uid}

users/{uid}/entries/{entryId}

users/{uid}/conversations/{conversationId}

users/{uid}/memories/{memoryId}
```

Potential future collections can follow the same user-scoped pattern.

A user's data must never be accessible to another authenticated user.

---

# 12. Firestore Security

Security must be enforced at the database/backend level.

Do NOT rely only on:

- frontend route protection
- hidden UI elements
- client-side UID checks

Firestore rules must verify that the authenticated user owns the requested data.

Example principle:

```text
request.auth.uid == uid
```

Users must not be able to access another user's data by manipulating:

- URLs
- document IDs
- requests
- frontend state

---

# 13. Gemini Security

Never expose the Gemini API key in browser code.

Correct architecture:

```text
Browser
   ↓
Authenticated request
   ↓
Backend
   ↓
Secret Manager
   ↓
Gemini API
```

The backend should determine the authenticated user's UID from the Firebase authentication token.

Do not allow the client to arbitrarily specify another user's UID.

---

# 14. Development Rules

When modifying the project:

### Preserve existing functionality

Do not rewrite working authentication, Firestore, or routing code unnecessarily.

### Preserve Stitch UI

If changing functionality, preserve:

- typography
- spacing
- layout
- animations
- backgrounds
- responsive behavior
- visual hierarchy

Do not redesign the application unless explicitly requested.

### Avoid unnecessary dependencies

Prefer existing dependencies.

Only add a dependency when it provides clear value.

### Keep components modular

Separate:

```text
UI
Authentication
Firestore/data access
Gemini/backend
Integrations
Types
Configuration
```

---

# 15. Development Priorities

Build in this order:

## Phase 1 — Foundation

- Next.js scaffold
- Firebase Authentication
- Google Sign-In
- Protected routes
- Firestore
- Firestore security rules
- Basic application shell
- Stitch UI integration

## Phase 2 — Notebook

- Journal entries
- Notebook editor
- Entry history
- Search
- Work/Personal context
- Light/dark mode
- Streak

## Phase 3 — Gemini

- `/gem`
- `/ask`
- `/summarise`
- `/prompt`
- `/quotes`
- Context-aware Gemini responses
- Entry summaries

## Phase 4 — Memory

- Weekly reflections
- Monthly reflections
- AI memory cards
- Recurring themes
- Timeline

## Phase 5 — Integrations

- Slack
- Google Calendar
- Custom integrations
- Leaflet/OpenStreetMap

## Phase 6 — Voice

- Voice journaling
- Voice-to-text workflow

---

# 16. Current Development State

The initial application was generated using Google AI Studio.

The visual frontend was designed using Google Stitch.

The generated project has been pushed to GitHub.

Development is now moving primarily to **VS Code**.

Cloud Run deployment is currently postponed because a billing account is not available.

Firebase remains the persistent backend service and should continue using the existing Firebase project.

---

# 17. Current Goal

The immediate goal is:

```text
Stitch UI
    +
Next.js application
    +
Firebase Authentication
    +
Firestore
    +
Secure user isolation
```

Get this foundation stable before implementing advanced features.

Do not implement all future features simultaneously.

---

# 18. AI Coding Assistant Rules

When working on this repository:

1. Read this `context.md` before making significant architectural changes.
2. Preserve the notebook-first UX.
3. Never turn the journal into a chat application.
4. Preserve the Stitch visual design.
5. Do not create separate Work and Personal UIs.
6. Do not make Work/Personal mode mandatory.
7. Default to Work.
8. Render only contextually relevant prompts/features.
9. Never expose Gemini API keys to the client.
10. Never weaken Firestore user isolation.
11. Do not introduce unnecessary dependencies.
12. Prefer small, incremental changes.
13. Do not rewrite working systems without a clear reason.
14. Keep the application responsive.
15. Keep the codebase modular and easy to maintain.

---

# 19. Product North Star

The final product should feel like:

> **Your private digital notebook that remembers, understands, and helps you reflect.**

Not:

> An AI chatbot with a journal interface.