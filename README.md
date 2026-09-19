# Lexikon

Lexikon is a vocabulary-learning web app: users sign up with a unique **username + password**
(Instagram-style), save English words, get AI-generated definitions/etymology/examples, capture
words from photos with the camera, run daily quizzes, build a Memory Palace, chat with "Lexi"
(AI coach), compete on a leaderboard, and upgrade to Pro via Instamojo.

This README is the complete blueprint. Hand it to Lovable (or any dev) and the app can be
rebuilt end-to-end.

---

## 1. Tech Stack

- **Frontend:** Vite 5 + React 18 + TypeScript 5, React Router, TailwindCSS 3, shadcn/ui, Sonner (toasts), TanStack Query
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions in Deno)
- **AI:** Google Gemini (`gemini-flash-latest`) via multi-key failover (`GEMINI_API_KEY`, `GEMINI_API_KEY_2..5`)
- **Payments:** Instamojo one-time Payment Links (INR). Stripe scaffolding exists but is disabled in v1.
- **Auth providers:** Username/password (primary, Instagram-style) + Google OAuth
- **Hosting:** Vercel (frontend), Supabase (backend)

Backend project used by this build: `hwxyeutnuojfbamomkit.supabase.co`.

---

## 2. Environment Variables

### Frontend `.env` (Vite)
```
VITE_SUPABASE_PROJECT_ID="hwxyeutnuojfbamomkit"
VITE_SUPABASE_URL="https://hwxyeutnuojfbamomkit.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon/publishable key from Supabase → Settings → API>"

# Optional Instamojo link overrides (fallbacks live in src/lib/billing.ts)
VITE_INSTAMOJO_MONTHLY_LINK=https://imjo.in/S9NDB4
VITE_INSTAMOJO_QUARTERLY_LINK=https://imjo.in/Zd3BDM
VITE_INSTAMOJO_YEARLY_LINK=https://imjo.in/qQbXfY
```

### Supabase Edge Function Secrets (set via `supabase secrets set`)
| Name | Purpose |
|---|---|
| `GEMINI_API_KEY`, `GEMINI_API_KEY_2..5` | Gemini API keys (rotated on quota/5xx) |
| `SUPABASE_URL` | Auto-provided by Supabase |
| `SUPABASE_ANON_KEY` | Auto-provided |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided; used by webhook/delete-account functions |
| `SUPABASE_JWKS` | Auto-provided (used by `getClaims`) |
| `INSTAMOJO_API_KEY` | Only if you enable Instamojo webhook verification |
| `INSTAMOJO_AUTH_TOKEN` | Same as above |
| `INSTAMOJO_SALT` | For payload signature check |
| `STRIPE_SECRET_KEY` | Reserved (Stripe not in production v1) |
| `STRIPE_WEBHOOK_SECRET` | Reserved |

---

## 3. Database Schema (Postgres / Supabase `public` schema)

Every `CREATE TABLE` is followed by `GRANT` statements and RLS policies scoped to
`auth.uid()`. Timestamps `created_at` / `updated_at` on every table (updated_at via
trigger `update_updated_at_column`).

### Tables

**`profiles`** — one row per user (created by `handle_new_user` trigger on `auth.users`)
- `user_id uuid PK → auth.users`, `username citext UNIQUE`, `display_name text`, `avatar_url text`
- The user's real email is **not** stored (privacy). Auth uses a synthetic email
  `{username}@users.lexikon.app`.
- RLS: users read/update own row; `SELECT` allowed via `get_profile_by_username` RPC for lookups.

**`words`** — user's saved vocabulary
- `id uuid`, `user_id uuid`, `word text`, `pronunciation`, `spelling`, `meaning_english`, `meaning_hindi`, `part_of_speech`, `word_forms`, `example_sentence`, `synonyms`, `antonyms`, `notes`, `source`
- RLS: full CRUD scoped to `user_id = auth.uid()`.
- **Free plan limit:** trigger `enforce_free_word_limit` (statement-level AFTER INSERT) blocks
  inserts once a free user has **2,000 words**. Pro bypasses via `is_user_pro(user_id)`.

**`word_stats`** — per-word quiz counters (`correct_count`, `incorrect_count`, `last_seen_at`, `streak`).

**`quiz_sessions`** — `quiz_date`, `score`, `total_questions`, `duration_seconds`, `completed`. Feeds `get_leaderboard()` and `get_learner_quiz_history()`.

**`memory_palace_anchors`** — 5 fixed anchors per user (`name`, `anchor_order`, `style`).
**`memory_palace_placements`** — `word_id`, `anchor_id`, `imagery_text`, `status` ('active'|'stable'|'archived'), `recall_correct/incorrect`.
- Trigger `validate_memory_palace_placement` enforces max 2 active per anchor and 10 active total.

**`community_messages`** — `content` (ASCII only, ≤500 chars) via `validate_community_message` trigger.

**`user_subscriptions`** (payments)
- `user_id`, `plan` ('free'|'pro'), `subscription_status` ('active'|'trialing'|'manual'|'canceled'|'past_due'),
  `provider` ('stripe'|'instamojo'|'manual'), `provider_customer_id`, `provider_subscription_id`,
  `provider_payment_id`, `interval` ('monthly'|'quarterly'|'yearly'), `amount_paid`, `currency`,
  `current_period_start`, `current_period_end`, `cancel_at_period_end`.
- Only the user reads their own row; writes are server-only (service_role).

**`payment_events`** — raw provider events (idempotency).
**`stripe_processed_events`** — Stripe event dedupe.
**`payment_verification_requests`** — user-submitted Instamojo payment IDs for admin approval:
- `user_id`, `plan_interval`, `payment_id`, `amount`, `status` ('pending'|'approved'|'rejected'), `admin_notes`.
- User inserts their own row; user/admin reads own; admin (service_role) approves.

**`user_roles`** — `user_id`, `role app_role` ('admin'|'moderator'|'user'), unique per (user, role).
Read via the security-definer `has_role()` function; never grant anon access.

### Security Definer Functions
- `is_user_pro(uuid) → boolean` — used by trigger and UI.
- `has_role(uuid, app_role)` — role check pattern.
- `get_leaderboard()`, `get_learner_quiz_history(uuid, int)`
- `get_memory_palace_anchors(uuid)`, `get_memory_palace_active(uuid)`, `get_unplaced_words(uuid)`
- `get_community_messages(int)`, `get_profile_by_username(text)`, `is_username_available(text)`
- `handle_new_user()` (trigger on `auth.users` AFTER INSERT) creates the `profiles` row.
- `update_updated_at_column()` (BEFORE UPDATE trigger on every table with `updated_at`).

### Storage
- **Bucket `avatars`** — public. Path convention: `avatars/{user_id}/{filename}`. RLS: users can upload/replace/delete own folder; anyone can read.

---

## 4. Authentication

### Username + password (primary, Instagram-style)
- Signup collects **username, full name, password** (min 8 chars, HIBP leaked-password check).
- Username availability is checked live via the `is_username_available` RPC.
- Auth record uses the synthetic email `{username}@users.lexikon.app`; **email confirmation is
  auto-confirm (OFF)** — synthetic emails can't receive mail and confirmation would burn the
  hourly email quota.
- The chosen full name is saved to user metadata and the `profiles.display_name` column at signup.
- Public profile pages live at `/{username}` (`src/pages/UserProfile.tsx`).

### Google OAuth (secondary)
- "Continue with Google" on `/auth` calls `supabase.auth.signInWithOAuth({provider:'google',
  options:{redirectTo: `${window.location.origin}/auth/callback`}})` — direct Supabase OAuth,
  **not** Lovable's managed `/~oauth/initiate` proxy (that only works on Lovable-hosted domains).
- Google Cloud OAuth authorized redirect URI = `https://hwxyeutnuojfbamomkit.supabase.co/auth/v1/callback`.
- Supabase Site URL and Additional Redirect URLs must include the Vercel domain(s) and `http://localhost:8080`.

### Session management
- `/auth/callback` hydrates the session (PKCE) then redirects to the intended `next` param or `/dashboard`.
- `AuthContext` (`src/contexts/AuthContext.tsx`) listens to `onAuthStateChange`, restores sessions
  with a loading state, and toasts on session expiry.
- `ProtectedRoute` gates all app routes; unauthenticated users bounce to `/auth`.

---

## 5. Frontend Routes (`src/App.tsx`)

Public: `/`, `/auth`, `/auth/callback`, `/reset-password`, `/pricing`, `/payment-success`,
`/payment-cancelled`, `/privacy`, `/terms`, `/account-deletion`, `/:username`.

Protected (inside `AppLayout` with sidebar):
- `/dashboard` — stats + recent words
- `/dictionary` — full word list; tokenized partial search across word/meanings/synonyms/antonyms/examples/notes; Excel/CSV import & export
- `/add` — manual add + "Lexi Fill" (calls `lexi-fill-word`)
- `/capture` — camera/upload → `lexi-scan-word` extracts candidate words; user selects multiple via chips and bulk-saves
- `/word/:id` — detail + "Ask Lexi" (calls `lexi-explain-word`, streaming)
- `/word/:id/edit` — edit a word
- `/quiz` — daily quiz, writes `quiz_sessions` + updates `word_stats`
- `/memory-palace` — anchors/placements + imagery from `memory-palace-guide`
- `/community` — chat wall
- `/leaderboard` — `get_leaderboard()` RPC
- `/profile` — profile edit, avatar upload to `avatars` bucket, subscription status, danger zone (account deletion)

Legal/compliance: `/privacy`, `/terms`, `/account-deletion` (business details: Lexikon, Mumbai,
Maharashtra, India — mr.lonsdaleite@outlook.com). Footer links appear on Auth and Profile.

Global: `LexiChat` floating widget on every protected page, calls `lexi-chat` (SSE). A one-time
`WelcomeTour` (localStorage-gated) runs for new users.

### Android app / Google Play
- `src/lib/platform.ts` detects the Android wrapper build (`?android=1` URL flag, persisted by `main.tsx`).
- On Android, Instamojo payment links are hidden on Pricing/Profile — Play-Billing compliance
  (purchases must flow through Google Play Billing in the wrapped app).
- In-app self-service account deletion (Profile → Danger zone → `delete-account` edge function)
  satisfies Google Play's account-deletion requirement.

Design system: shadcn tokens in `src/index.css`; never hardcode colors. Dark/light via `ThemeProvider`.

---

## 6. Business Logic

### Free vs Pro
- **Free:** up to **2,000 saved words**; all other features (quiz, palace, Lexi, community, leaderboard) work.
- **Pro:** unlimited words.

Enforcement points:
- DB trigger `enforce_free_word_limit` (last line of defense, limit constant 2000).
- Frontend guard `src/lib/wordLimit.ts` (imports `FREE_WORD_LIMIT` from `src/lib/billing.ts`), used by AddWord, CaptureWord (bulk), Dictionary (import).
- `useSubscription()` hook returns `{ isPro, plan, status, periodEnd, ... }`.

### Payments (Instamojo v1)
Plans (`src/lib/billing.ts`):
| Plan | Price | Duration | Link |
|---|---|---|---|
| Monthly | ₹499 | 30 days | https://imjo.in/S9NDB4 |
| Quarterly | ₹1,299 | 90 days | https://imjo.in/Zd3BDM |
| Yearly | ₹3,999 | 365 days | https://imjo.in/qQbXfY |

Flow:
1. User picks plan on `/pricing` → redirected to Instamojo hosted page.
2. Instamojo redirects to `/payment-success` after payment.
3. User submits Instamojo payment ID + plan on that page → inserts into `payment_verification_requests`.
4. Admin approves: sets `user_subscriptions.plan='pro'`, `subscription_status='manual'`, `provider='instamojo'`, `current_period_end = now() + durationDays`.
5. `is_user_pro()` returns true while `current_period_end > now()`.

(Stripe webhook + `create-checkout-session` code is retained for future automation.)

---

## 7. Edge Functions (Deno, in `supabase/functions/`)

All import CORS headers, call `requireUser` from `_shared/auth.ts` for auth (except public
webhooks), and use `_shared/gemini.ts` for multi-key Gemini failover with structured JSON output.

| Function | Purpose | Auth | Streaming |
|---|---|---|---|
| `lexi-chat` | Lexi conversational assistant | required | SSE |
| `lexi-explain-word` | Deep dive for a saved word | required | SSE |
| `lexi-fill-word` | Auto-fill dictionary entry (JSON schema) | required | no |
| `lexi-scan-word` | Extract vocabulary words from a photo | required | no |
| `memory-palace-guide` | Generate imagery text for word ↔ anchor | required | no |
| `delete-account` | Permanently wipe user data + auth record (Google Play compliance) | required | no |
| `create-checkout-session` | (Reserved) Stripe checkout | required | no |
| `stripe-webhook` | (Reserved) Stripe webhook handler | `verify_jwt=false` | no |

`supabase/config.toml` only overrides `verify_jwt` for `stripe-webhook`.

Frontend never surfaces raw function errors: `src/lib/invokeFunction.ts` extracts friendly
messages from JSON responses, and `src/lib/friendlyError.ts` maps error codes to human text.

---

## 8. Key Files

```
src/
  App.tsx                     # routes
  contexts/AuthContext.tsx    # session + expiry toast
  components/AppLayout.tsx    # sidebar shell
  components/LexiChat.tsx     # floating AI chat
  components/WelcomeTour.tsx  # one-time intro tour (localStorage)
  components/ProtectedRoute.tsx
  components/PasswordStrength.tsx  # signup checklist + HIBP feedback
  hooks/useSubscription.ts    # Pro/Free state
  lib/billing.ts              # plans, FREE_WORD_LIMIT, Instamojo links
  lib/wordLimit.ts            # free-plan guard
  lib/username.ts             # username validation rules
  lib/lexi.ts                 # edge-function invokers (sends user JWT)
  lib/invokeFunction.ts       # friendly edge-function error extraction
  lib/friendlyError.ts        # error-code → human message mapping
  lib/siteUrl.ts              # centralized production URL handling
  lib/platform.ts             # Android wrapper detection
  lib/quiz.ts                 # quiz builder
  integrations/supabase/{client.ts, types.ts}
  pages/… (see route list)
supabase/
  functions/…                 # edge functions
  migrations/…                # ordered SQL (single source of truth)
  config.toml                 # project_id + per-function overrides
```

---

## 9. Rebuild-From-Scratch Checklist

1. Create Vite React TS project, install shadcn/ui, tailwind, react-router-dom, @supabase/supabase-js, @tanstack/react-query, sonner, lucide-react, xlsx, zod.
2. Create Supabase project. Enable Google OAuth. Turn on HIBP password check. Turn **off** email confirmation (username auth uses synthetic emails). Set Site URL + redirect URLs.
3. Create `avatars` storage bucket (public) with RLS letting users write to `{user_id}/*`.
4. Run all migrations in `supabase/migrations/` in order (via `supabase db push` from a linked CLI). Verify the `handle_new_user` trigger on `auth.users` exists afterwards.
5. Set all Edge Function secrets (§2).
6. Deploy edge functions (§10 below).
7. Set frontend `.env` values (§2).
8. Configure Instamojo Payment Links to redirect to `https://<your-domain>/payment-success`.
9. Deploy frontend to Vercel; add its URL to Supabase Auth redirects and to Google OAuth authorized origins.
10. Create at least one admin: insert a row into `user_roles` with `role='admin'` for your `user_id` if you want an admin UI later.

---

## 10. How to Migrate Edge Functions & Secrets to Your Supabase

Migrate **from this repo** into your own project.

### Prereqs
```bash
npm i -g supabase
supabase login          # opens browser, paste your access token
```

### Link the CLI to your project
```bash
supabase link --project-ref hwxyeutnuojfbamomkit
# it will ask for the database password — paste it from
# Supabase Dashboard → Project Settings → Database → Reset/Show password
```

### Push the database schema
```bash
supabase db push        # runs every file in supabase/migrations/ in order
```
If the project already has some tables and push complains, run only the newer
migrations manually via SQL Editor, or use `supabase db diff` to reconcile.

### Deploy every edge function
```bash
for fn in lexi-chat lexi-explain-word lexi-fill-word lexi-scan-word \
          memory-palace-guide delete-account create-checkout-session stripe-webhook; do
  supabase functions deploy "$fn" --project-ref hwxyeutnuojfbamomkit
done
```
`supabase/config.toml` in the repo already sets `verify_jwt=false` for
`stripe-webhook`; the CLI honours that on deploy. All other functions verify JWTs
in code (`requireUser`), so leave their defaults.

### Set edge-function secrets
```bash
supabase secrets set \
  GEMINI_API_KEY=xxxx \
  GEMINI_API_KEY_2=xxxx \
  GEMINI_API_KEY_3=xxxx \
  GEMINI_API_KEY_4=xxxx \
  GEMINI_API_KEY_5=xxxx \
  INSTAMOJO_API_KEY=xxxx \
  INSTAMOJO_AUTH_TOKEN=xxxx \
  INSTAMOJO_SALT=xxxx \
  STRIPE_SECRET_KEY=sk_test_xxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxx \
  --project-ref hwxyeutnuojfbamomkit

supabase secrets list --project-ref hwxyeutnuojfbamomkit   # verify
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and
`SUPABASE_JWKS` are auto-injected into every function — do not set them.

### Verify
```bash
# 1. Call a function with a valid user JWT (get one by logging into the app)
curl -X POST https://hwxyeutnuojfbamomkit.supabase.co/functions/v1/lexi-fill-word \
  -H "Authorization: Bearer <user-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"word":"ephemeral"}'

# 2. Check function logs
supabase functions logs lexi-fill-word --project-ref hwxyeutnuojfbamomkit
```

---

## 11. Known Gotchas

- **Every new public table needs GRANTs** in the same migration (`authenticated`, plus `service_role`; `anon` only when policy allows). Without them PostgREST returns permission errors.
- Don't hardcode colors — use design tokens in `src/index.css`.
- Google OAuth `redirectTo` must be a full same-origin URL, not a protected route. On non-Lovable
  deployments, never use the `/~oauth/initiate` proxy — call `signInWithOAuth` directly.
- Keep email confirmation **off**; the username system uses synthetic emails.
- `handle_new_user` trigger lives on `auth.users`; verify it exists after restoring — it's created via a migration in this repo.
- `enforce_free_word_limit` is a **statement-level** trigger using a `new_rows` transition table — needed so bulk inserts (imports) are counted atomically. Limit constant: 2000.
- Edge-function AI calls use the `GEMINI_API_KEY*` secrets directly (Google Generative Language
  API), not the Lovable AI Gateway — the `_shared/gemini.ts` helper handles multi-key failover.
