# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # ESLint
npx tsc --noEmit # type check without emitting
```

## Environment

Copy `.env.local` and fill in Upstash Redis credentials before running:

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## Architecture

**Stack**: Next.js 15 App Router · TypeScript · Tailwind CSS · Upstash Redis (`@upstash/redis`) · Server Actions · RSC

### Data flow

All database access is funneled through `lib/kv.ts` — no page or action imports `@upstash/redis` directly. Session state lives in a single HttpOnly cookie (`voting-session`) managed exclusively through `lib/session.ts`. Server Actions in `app/actions/` are the only place that mutate KV or the session cookie.

### KV key structure

| Key | Type | Value |
|-----|------|-------|
| `users` | Redis Set | all user name strings |
| `card-ids` | Redis Set | all card ID strings |
| `card:{id}` | String | JSON-serialised `Card` object |
| `votes:card:{id}` | Hash | `{ [userName]: JSON.stringify(string[]) }` — selected answer IDs per user |

Cards are stored as JSON strings (not hashes) because the `answers` field is an array. Votes use `hset`/`hgetall` so each user's write is atomic.

Each `Answer` carries a stable `id` (uuid). Votes reference answers by `id`, never by positional index — so concurrent answer add/delete can't misalign in-flight votes. All card-and-votes mutations (add/edit/delete answer, submit vote) run as atomic Lua scripts via `EVAL`. Legacy cards without `answer.id` (and their legacy index-based vote values) are migrated on first read of `getCard` in a single atomic script.

### Auth model

"Soft auth" — no passwords. The session is an array of selected user names stored in the `voting-session` cookie. A single session can represent multiple users (proxy voting). `getSession()` is safe to call from Server Components; `setSession()`/`clearSession()` must only be called from Server Actions.

### Routing & page responsibilities

- `/` — login: select existing users or add new ones, sets cookie, redirects to `/home`
- `/home` — lists all cards sorted by bucket: **action-required** → **waiting** → **completed**
- `/create` — form to create a new card; on submit redirects creator straight to the card detail page
- `/card/[id]` — voting UI when session users haven't voted yet; results UI otherwise; vote is always mutable via "Change vote"

### Client vs Server split

Pages and `Header` are Server Components. Client Components (`'use client'`) are used only where local state is required: `LoginForm`, `CreateCardForm`, `VoteForm`, `AddAnswerForm`, and `SubmitButton` (which uses `useFormStatus` from `react-dom` to show pending state — it must be a child of the `<form>`, not the same component).

### Important patterns

- `redirect()` from `next/navigation` must always be called **outside** `try/catch` — it works by throwing a special exception that catch blocks silently swallow.
- `VoteForm` controls both the voting and results states locally (`isEditing`). After a Server Action fires and `revalidatePath` triggers a server re-render, the client component remounts with fresh props.
- Dynamic Tailwind classes must use full class name strings — do not construct them dynamically (e.g. `bg-${color}-500`) as they will be purged.
