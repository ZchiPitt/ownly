# Clekee

> Smart Home Inventory App - Track household belongings with AI-powered photo recognition

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF)](https://vite.dev/)

**Clekee** is a Progressive Web App (PWA) that helps you track household belongings through AI-powered photo recognition. Never forget where you stored something again!

## Features

- **AI-Powered Photo Recognition** - Automatically identify items, suggest categories, and extract metadata
- **Hierarchical Location Tracking** - Organize items by room, shelf, box, etc.
- **Semantic Search** - Find items by name, category, location, tags, or voice
- **Smart Shopping Assistant** - Check if you already own similar items before buying
- **Expiration Tracking** - Get reminders for food, cosmetics, and other dated items
- **Offline Support** - Works without internet connection (PWA)
- **Push Notifications** - Reminders for unused items and expiring goods
- **Gallery & List Views** - Browse your inventory the way you prefer

## Tech Stack

- **Frontend:** React 19.2 + TypeScript + Vite
- **Styling:** Tailwind CSS 4.x
- **Routing:** React Router v6
- **State Management:** TanStack React Query
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI:** OpenAI Vision API + Embeddings (pgvector)

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase project (create one at [supabase.com](https://supabase.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/clekee.git
cd clekee

# Install dependencies
npm install
```

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure your environment variables in `.env`:

```bash
# Required - Get from your Supabase project settings
# https://app.supabase.com/project/_/settings/api
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional - For Web Push notifications
# Generate with: npx web-push generate-vapid-keys
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

### Database Setup

The database schema is managed through Supabase migrations. Run the migration files in order:

1. **Enable extensions:** `pgvector` for similarity search
2. **Create tables:** profiles, user_settings, categories, locations, items, notifications, push_subscriptions
3. **Enable RLS:** Row Level Security policies
4. **Create triggers:** Automatic profile/user_settings creation, location item_count maintenance

See `scripts/ralph/prd.json` for detailed migration specifications (US-003 through US-010).

### Storage Setup

Create a Supabase Storage bucket named `items` with:
- **Public:** false
- **File size limit:** 10MB
- **Allowed MIME types:** image/jpeg, image/png, image/webp, image/heic
- **RLS Policy:** Users can only upload to `items/{user_id}/*`

### Edge Functions

Deploy the following Supabase Edge Functions (Deno):

```bash
# From your Supabase project directory
supabase functions deploy analyze-image
supabase functions deploy shopping-analyze
supabase functions deploy generate-embedding
```

Each function requires environment variables for OpenAI API access.

## Running the App

```bash
# Development server (http://localhost:5173)
npm run dev

# Type check
npm run build  # or: tsc -b

# Lint
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
clekee/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── layout/      # AppShell, BottomNav
│   │   └── *.tsx        # Feature components
│   ├── contexts/        # React contexts (Auth, Offline, Toast)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities (supabase, imageUtils)
│   ├── pages/           # Route components
│   ├── types/           # TypeScript definitions
│   └── App.tsx          # Root component with routing
├── docs/
│   ├── requirements.md  # Product requirements
│   └── USAGE.md         # User guide
├── scripts/ralph/       # Ralph autonomous agent files
│   ├── prd.json         # Product requirements with 90 user stories
│   ├── progress.txt     # Implementation progress
│   └── CLAUDE.md        # Ralph agent instructions
├── public/              # Static assets, PWA manifest
├── .env.example         # Environment template
├── vite.config.ts       # Vite + PWA configuration
└── tsconfig.json        # TypeScript configuration
```

## Development

### Path Aliases

Use `@/` prefix for all imports from `src/`:

```ts
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
```

### Type Safety

This project uses strict TypeScript. Always run `npm run build` before committing to ensure type safety.

### Component Patterns

- **AppShell** - Main layout with header, content, and bottom nav
- **ItemEditor** - Reusable form for creating/editing items
- **Bottom Sheets** - Used for filters and pickers
- **Toast Notifications** - Use `useToast()` hook (not Toast component)

### Conventions

- **Commit format:** `feat: [US-XXX] - Story Title` (see PRD for user stories)
- **File naming:** PascalCase for components, camelCase for hooks
- **Barrel exports:** Use `index.ts` files for clean imports

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines.

## User Documentation

- **[User Guide](./docs/USAGE.md)** - Complete guide for end users
- **[Product Requirements](./docs/requirements.md)** - Feature specifications

## Roadmap

Current status: 83 of 90 user stories completed

See `scripts/ralph/prd.json` for the full product roadmap and implementation status.

### Remaining Features

- **US-084:** Confirmation dialog component
- **US-085:** Bottom sheet component (refactor)
- **US-086:** Item Detail loading/error states
- **US-087:** Settings - view preferences
- **US-088:** Settings - account section
- **US-089:** Complete app router with 404
- **US-090:** App update detection and prompt

## FAQ

**Q: Can I run this without Supabase?**

A: No. Clekee requires Supabase for authentication, database, and storage. You'll need to create a free Supabase account and project.

**Q: Do I need OpenAI API keys?**

A: Yes, for AI features (photo recognition, shopping assistant, embeddings). These are configured in Supabase Edge Functions, not in the frontend.

**Q: Can I use this offline?**

A: Yes! Clekee is a PWA with offline support. Cached content remains viewable without internet, and an offline banner appears when disconnected.

**Q: How do I deploy this?**

A: Build the app (`npm run build`) and deploy the `dist/` folder to any static hosting service (Vercel, Netlify, Cloudflare Pages, etc.). You'll also need to deploy the Supabase Edge Functions.

**Q: What's the Ralph agent?**

A: Ralph is an autonomous coding agent that works through the PRD user stories. See `scripts/ralph/CLAUDE.md` for details.

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with [Vite](https://vite.dev/)
- Backend by [Supabase](https://supabase.com/)
- AI powered by [OpenAI](https://openai.com/)
- PWA support from [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa)
