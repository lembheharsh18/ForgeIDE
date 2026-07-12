# Rebrand to Coders League — Full Overhaul Plan

Rebrand from "Forge IDE" to **Coders League**, remove admin/member role separation, simplify the UI with clean navigation, and restructure around 6 core features.

## Target Features

| #   | Feature                                                                            | Status                                         |
| --- | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | **Normal Contests** — Create using CF links, live leaderboard fetching submissions | Existing (needs admin removal + CF live fetch) |
| 2   | **Reverse Coding Contests** — Interactor + fullscreen IDE (Java, Python, C++)      | Existing (needs UI polish + fullscreen mode)   |
| 3   | **Contest Reminders** — Upcoming contest notifications                             | Stub exists, needs build-out                   |
| 4   | **Leaderboard** — Multi-platform rating aggregation                                | Existing (keep as-is, rebrand)                 |
| 5   | **Collaborative Whiteboard** — Excalidraw-based, real-time sync                    | Existing (promote to top-level feature)        |
| 6   | **Doubt Forum** — Thread-based Q&A for users                                       | **New** — needs full build                     |

---

## Phase 1: Database & Backend — Remove Roles

### [MODIFY] [schema.prisma](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/server/prisma/schema.prisma)

- Remove `Role` enum (`MEMBER` / `ADMIN`)
- Remove `role` field from `User` model
- Add `createdById` field to `Contest` model (track who created it)
- Add new `ForumPost` and `ForumReply` models for the Doubt Forum:

```prisma
model ForumPost {
  id        String       @id @default(cuid())
  title     String
  content   String       @db.Text
  tags      String[]
  userId    String
  resolved  Boolean      @default(false)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  user      User         @relation("ForumPosts", fields: [userId], references: [id], onDelete: Cascade)
  replies   ForumReply[]
}

model ForumReply {
  id        String    @id @default(cuid())
  content   String    @db.Text
  userId    String
  postId    String
  isAnswer  Boolean   @default(false)
  createdAt DateTime  @default(now())
  user      User      @relation("ForumReplies", fields: [userId], references: [id], onDelete: Cascade)
  post      ForumPost @relation(fields: [postId], references: [id], onDelete: Cascade)
}
```

- Add `Contest.createdById` field + relation to `User`
- Add User relations: `forumPosts ForumPost[] @relation("ForumPosts")` and `forumReplies ForumReply[] @relation("ForumReplies")`

### [DELETE] [requireAdmin.ts](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/server/src/middleware/requireAdmin.ts)

### [MODIFY] [jwt.ts](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/server/src/utils/jwt.ts)

- Remove `role` from `TokenPayload`

### [MODIFY] [auth.ts](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/server/src/routes/auth.ts)

- Remove `/register-admin` endpoint and `adminRegisterSchema`
- Remove `role` from all token payloads and response objects

### [MODIFY] [contests.ts](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/server/src/routes/contests.ts)

- Replace `requireAdmin` → `requireAuth` on all mutating routes
- Store `createdById` from `req.user.userId` when creating contests

### [MODIFY] [problems.ts](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/server/src/routes/problems.ts)

- Replace `requireAdmin` → `requireAuth` on POST/PUT/DELETE

### [MODIFY] [chat.ts (routes)](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/server/src/routes/chat.ts)

- Replace `requireAdmin` → `requireAuth` on room creation and message deletion

### [MODIFY] [chat.ts (sockets)](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/server/src/sockets/chat.ts)

- Remove `role` from message includes
- Change delete-message: allow users to delete **their own messages** only (check `userId` match instead of `role === 'ADMIN'`)

### [NEW] [forum.ts](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/server/src/routes/forum.ts)

- `GET /api/forum` — list posts (paginated, filterable by tags/resolved)
- `GET /api/forum/:id` — get post + replies
- `POST /api/forum` — create post (requireAuth)
- `POST /api/forum/:id/reply` — add reply (requireAuth)
- `PATCH /api/forum/:id/resolve` — mark resolved (post author only)
- `PATCH /api/forum/replies/:id/answer` — mark as accepted answer (post author only)

### [MODIFY] [index.ts](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/server/src/index.ts)

- Register `app.use('/api/forum', forumRoutes)`

### [MODIFY] [seed.ts](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/server/prisma/seed.ts)

- Remove `role: Role.ADMIN` references

---

## Phase 2: Client — Remove Admin & Rebrand

### Delete Admin Files

#### [DELETE] `apps/client/src/app/admin/` (entire directory)

#### [DELETE] [AdminLoginForm.tsx](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/client/src/components/auth/AdminLoginForm.tsx)

#### [DELETE] [AdminRegisterForm.tsx](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/client/src/components/auth/AdminRegisterForm.tsx)

### [MODIFY] [authStore.ts](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/client/src/store/authStore.ts)

- Remove `role` from `User` interface

### [MODIFY] [layout.tsx](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/client/src/app/layout.tsx)

- Rebrand metadata: `"Coders League — Competitive Programming Hub"`
- Update keywords, OpenGraph

### [MODIFY] [globals.css](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/client/src/app/globals.css)

- Keep the existing design tokens (they're clean)
- No major changes needed

---

## Phase 3: New Navigation & Landing Page

The app navigation should be simple and feature-driven:

```
CODERS LEAGUE logo | Contests | IDE | Whiteboard | Leaderboard | Forum | [User Avatar]
```

### [MODIFY] [Topbar.tsx](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/client/src/components/layout/Topbar.tsx)

- Replace "FORGE IDE" logo with "CODERS LEAGUE" branding
- Update `navItems` to:
  - `Contests` → `/contests`
  - `IDE` → `/ide`
  - `Whiteboard` → `/whiteboard`
  - `Leaderboard` → `/leaderboard`
  - `Forum` → `/forum`
- Remove `CLUB`, `PROBLEMS`, `COMMUNITY` nav items (features absorbed into above)

### [MODIFY] [page.tsx (landing)](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/client/src/app/page.tsx)

- Complete rewrite of landing page:
  - Hero: "CODERS LEAGUE" with tagline "Code. Compete. Collaborate."
  - 6 feature cards matching the target features
  - Keep the animated typing code block (nice touch)
  - Keep leaderboard preview
  - Update nav, footer, all "Forge IDE" → "Coders League"
  - Update CTA buttons: "JOIN NOW" → `/register`, "EXPLORE" → `/contests`

---

## Phase 4: Feature Pages — Contests (Normal + RC)

### [MODIFY] [contests/page.tsx](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/client/src/app/contests/page.tsx)

- Remove `isAdmin` check — show "Create Contest" button for all users
- Change link from `/admin/contests/add` to `/contests/create`
- Keep `ContestCard` component, remove admin "Edit" button (or make it visible to contest creator)

### [NEW] [contests/create/page.tsx](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/client/src/app/contests/create/page.tsx)

- Move contest creation form from deleted admin page here
- Accessible to all authenticated users
- Fields: Name, Type (Normal/RC), Platform, CF Contest URL, Start/End time, Description

### IDE — Fullscreen Mode for RC

### [MODIFY] [ide/page.tsx](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/client/src/app/ide/page.tsx)

- Add fullscreen toggle button
- When in RC contest mode, auto-enter fullscreen
- Languages limited to Java, Python, C++ in RC mode

---

## Phase 5: New Feature Pages

### Whiteboard (Promoted to Top-Level)

### [NEW] [whiteboard/page.tsx](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/client/src/app/whiteboard/page.tsx)

- Standalone whiteboard page using existing `Whiteboard` component
- Room picker sidebar (reuse from community page)
- Any user can create whiteboard rooms
- Full-width Excalidraw canvas
- Real-time collaboration via existing socket infrastructure

### Doubt Forum

### [NEW] [forum/page.tsx](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/client/src/app/forum/page.tsx)

- Thread-based Q&A interface
- List view: title, author, tags, reply count, resolved badge
- Filter: All / Resolved / Unresolved, tag filter
- "Ask a Doubt" button → create form

### [NEW] [forum/[id]/page.tsx](file:///d:/Coding/Personal_Projects/CodeIDE/forge-ide/apps/client/src/app/forum/[id]/page.tsx)

- Single post view with replies
- Post author can mark as resolved and accept answer
- Markdown rendering for post content

---

## Phase 6: Cleanup

### Delete Unused Files

- `apps/client/src/app/club/` — absorb useful parts into top-level pages, delete the rest
- `apps/client/src/components/home/DailyProblemCard.tsx` — landing page no longer needs this
- `apps/server/src/routes/club.ts` — club home endpoint no longer needed
- `apps/server/src/routes/dailyProblems.ts` — remove if not part of core features

### Update References

- `apps/client/src/app/community/page.tsx` — absorb chat into whiteboard page, then delete
- All references to "Forge IDE" or "FORGE" in the codebase → "Coders League"

---

## Open Questions

> [!IMPORTANT]
> **Problems section**: The current app has a full problems listing (`/club/problems`) with CF scraping. Should I:
>
> - **A)** Keep it as a standalone `/problems` route (part of IDE experience)?
> - **B)** Remove it entirely — contests are the only way to interact with problems?

> [!IMPORTANT]
> **Community Chat**: The current community page has chat + whiteboard + voice. If whiteboard becomes its own page, should:
>
> - **A)** Chat stay alongside the whiteboard page (sidebar)?
> - **B)** Chat be removed entirely — the Forum replaces it for discussions?

> [!IMPORTANT]
> **Club dashboard page** (`/club`): This has top solvers, leaderboard preview, daily problems. Should:
>
> - **A)** The landing page (post-login) redirect to `/contests` (main feature)?
> - **B)** Keep a simple dashboard page with an overview?

---

## Verification Plan

### Automated

```bash
cd apps/server && npx prisma validate          # Schema valid
cd apps/server && npx prisma migrate dev        # Migration runs
cd apps/server && npx tsc --noEmit              # No type errors
cd apps/client && npx tsc --noEmit              # No type errors
npm run dev                                      # App starts
```

### Manual

- Register as user → no role assigned, full access
- Create a contest → verify it saves with `createdById`
- Visit whiteboard → real-time collaboration works
- Create a doubt post → post + reply flow works
- All "Forge IDE" references replaced with "Coders League"
- Admin pages return 404
- Navigation matches the new structure
