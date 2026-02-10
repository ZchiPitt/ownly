# Ralph Agent Instructions (Codex)

You are an autonomous coding agent working on the Ownly iOS app (Expo + React Native + TypeScript).

## Project Context

- **Existing web app:** React 19 + Vite + Supabase PWA at project root (`src/`)
- **New iOS app:** Expo project to be created under `mobile/` directory
- **Backend:** Supabase (Auth, Postgres, Storage, Edge Functions) — shared with web
- **Shared types:** `src/types/database.ts` and `src/types/api.ts` — reuse directly
- **Edge Functions:** `supabase/functions/` — already deployed, call from mobile client

## Your Task

1. Read the PRD at `src/scripts/ralph/prd.json`
2. Read the progress log at `src/scripts/ralph/progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks: `cd mobile && npx tsc --noEmit && npx expo lint`
7. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
8. Update the PRD to set `passes: true` for the completed story
9. Append your progress to `src/scripts/ralph/progress.txt`

## Technical Constraints

- **iOS only** — no Android configuration needed
- **iOS native UI style** — use iOS-standard navigation patterns, cells, sheets, segmented controls
- **Expo Router** for file-based routing (preferred) or React Navigation
- **TanStack Query** for server state
- **@supabase/supabase-js** with `expo-secure-store` adapter for session persistence
- **expo-camera / expo-image-picker** for photo capture
- **expo-image-manipulator** for compression/resize
- **expo-notifications** for Expo Push
- Strict TypeScript throughout

## Mobile Directory Structure (create under `mobile/`)

```
mobile/
├── app/                  # Expo Router screens
│   ├── (auth)/          # Auth stack (login, signup, reset)
│   ├── (tabs)/          # Main tab layout
│   │   ├── inventory/
│   │   ├── add/
│   │   ├── search/
│   │   ├── marketplace/
│   │   └── settings/
│   └── _layout.tsx
├── components/          # Reusable UI components
├── hooks/               # Custom hooks
├── lib/                 # Supabase client, utils
├── contexts/            # Auth, Toast contexts
├── types/               # Symlink or copy from src/types/
├── app.json
├── package.json
└── tsconfig.json
```

## Reuse Strategy

- **DO reuse:** Supabase schema, Edge Functions, API types (`src/types/`), business logic patterns
- **DO NOT reuse:** React DOM components, Vite config, PWA/service worker code, web-specific hooks
- **Adapt:** Data fetching hooks (same Supabase queries, different UI bindings)

## Quality Requirements

- ALL commits must pass typecheck and lint
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing patterns from the web codebase where applicable

## Skill-First Execution (Codex)

Before implementing, prefer loading and using available Codex skills instead of ad-hoc approaches.

Prioritize these skills when relevant:
- `ios-expo-dev` for Expo/iOS architecture, setup, and validation loops
- `expo-push-ios` for notification permission/token/payload handling
- `playwright-mcp` for browser automation/verification patterns
- `playwright` for CLI browser actions when needed

Rule:
- If a task matches a skill, follow the skill workflow first.
- Only fallback to custom/manual flow if no suitable skill exists.

## Progress Report Format

APPEND to `src/scripts/ralph/progress.txt` (never replace, always append):
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---
```

## Consolidate Patterns

If you discover a **reusable pattern**, add it to the `## Codebase Patterns` section at the TOP of progress.txt:

```
## Codebase Patterns
- Pattern: description
```

## Browser Verification (Required for UI/Web-impact stories)

For any story that changes UI or web-visible behavior, run browser verification with Playwright MCP.

Verification workflow:
1. Ensure local app/dev server is running (use project-specific dev command).
2. Use Playwright MCP to navigate, snapshot, and interact with the changed flow.
3. Capture at least one verification artifact (snapshot/screenshot).
4. Record verification result in `progress.txt`.

Expected commands/pattern:
- `mcporter list` (confirm playwright server healthy)
- `mcporter call playwright.browser_navigate ...`
- `mcporter call playwright.browser_snapshot`
- `mcporter call playwright.browser_click ...` / `browser_type ...`
- `mcporter call playwright.browser_take_screenshot`

If MCP is unavailable, explicitly log that manual browser verification is required and why.

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally.

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep quality checks green
- Read the Codebase Patterns section in progress.txt before starting
