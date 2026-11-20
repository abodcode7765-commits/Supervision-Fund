# Project memory

## Product intent & audience

- Project: **Supervision-Fund** (صندوق الإشراف) — Arabic website built with an AI website builder, now in Bolt.
- User wants to preserve the existing design exactly and continue extending the project.
- Latest goal: **convert the website into a mobile app while keeping the same design**.

## Brand personality & voice

- User communicates in **Arabic**; assistant should respond in Arabic.
- Tone: helpful, direct, concise.

## Visual design & UX direction

- Stack: **Vite + React + Tailwind CSS**.
- Arabic-language UI; professional look with **blue / royal color palette**.
- Already includes a **MobileBottomNav** component (bottom navigation for mobile).
- Design is the reference baseline — must not change layout, fonts, colors, spacing, or components unless explicitly requested.
- No detailed token/component inventory captured yet.

## Decisions, constraints & rationale

- Imported as static files; **no git history**, no live GitHub link; Bolt changes won't auto-sync back.
- User's top priority: visual fidelity to the original site.
- Two mobile-conversion options identified:
  1. **PWA** (installable web app) — recommended; achievable in Bolt; no design change; can be wrapped later.
  2. **Capacitor** (native APK/IPA) — requires external build tools not available in Bolt.
- Assistant recommended starting with PWA; **user has not yet confirmed the choice**.

## Open questions & assumptions

- Which mobile approach the user wants to proceed with (PWA vs Capacitor) is unconfirmed.
- Exact product purpose and feature set of "Supervision-Fund" still unconfirmed.
- Whether user intends to re-export to GitHub or work solely within Bolt is unknown.
- State management and backend choices not yet explored.
- Specific features/modifications beyond mobile conversion not yet specified.