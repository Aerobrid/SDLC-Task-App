# Agile SDLC Task & Workspace Platform (Next.js + Appwrite)

This repository is a production-oriented CRUD and Agile SDLC application for task and workspace management, built with Next.js (App Router) and TypeScript. It demonstrates end-to-end frontend and backend integration, complex state and UI (Kanban, Calendar, Table), and analytics surfaces designed to support software development workflows.

---

## Why this project matters

- Shows a current modern full-stack application design (Next.js app + Hono server routes + Appwrite backend).
- Demonstrates complex client UI (drag-and-drop Kanban with optimistic updates, calendar view, paginated tables).
- Emphasizes data integrity and UX: status normalization, accessibility improvements, and progressive enhancement.

## Key responsibilities demonstrated

- Architected and implemented feature-rich task management UI (Kanban, Calendar, Table).
- Built analytics pages with metric-driven filtering and pagination.
- Implemented server-side APIs with validation, helpful errors, and normalization logic.
- Improved accessibility (ARIA), defensive UI (truncation, scroll containers), and testable typing (TypeScript + Zod schemas).

## Tech stack

- Frontend: Next.js (App Router), React 18, TypeScript, Tailwind CSS
- Backend: Hono server routes (embedded in app), Appwrite admin SDK for persistence
- Libraries: @hello-pangea/dnd, react-big-calendar, react-hook-form, zod, TanStack Query, Sonner, Radix UI primitives

## Highlights & Features

- Kanban board with drag-and-drop and batch reorder persistence
- Calendar view for tasks using react-big-calendar (events colored by status)
- Table view with pagination and task row actions
- Workspace & Project analytics: metric cards, recent tasks, projects and assignees lists
- Create/Edit task modal with schema validation and client-side limits

## Setup (local)

✔️. Copy the sample environment file and fill values.

```bash
# macOS / Linux / PowerShell
cp .env.example .env.local

# Windows cmd
copy .env.example .env.local
```

✔️. Install dependencies and run:

```bash
# using bun
bun install
bun dev

# or use npm
npm install
npm run dev
```

✔️. Type checking (useful):

```bash
bun tsc --noEmit
```

## Notes about backend schema

- The `tasks` collection supports a numeric `position` attribute to persist ordering across Kanban columns. If not present, drag-and-drop will still work client-side but reordering will not persist.

## Recent audit & production-focused fixes

- Added a `normalizeStatus` helper to harmonize legacy status values and avoid UI/server mismatches.
- Metric cards are toggleable and have `aria-pressed` for accessibility.
- Improved layout to avoid overflow (pagination buttons contained inside cards) and made long lists scrollable.
- Reduced noisy server logs in production and ensured helpful error messages for common Appwrite schema issues.

## Where to look?

- `src/features/tasks/server/route.ts` — API for task CRUD, listing, and batch reorder
- `src/features/tasks/components` — Kanban (`data-kanban.tsx`), Calendar (`data-calendar.tsx`), and task rows (`task-row.tsx`)
- `src/app/(dashboard)/workspaces/[workspaceId]/projects/[projectId]/page.tsx` — Project analytics view
- `src/features/workspaces/components/home-analytics.tsx` — Workspace-level analytics view
- `src/lib/utils.ts` — shared helpers (e.g., `normalizeStatus`)

## Acknowledgements

Learned how to build the first part of application from [this tutorial](https://www.youtube.com/watch?v=Av9C7xlV0fA&t=63s). Came back to finish project my way.
