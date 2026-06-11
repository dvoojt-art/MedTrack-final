# MedTrack — Codebase Overview

## Summary
MedTrack is a clinical management dashboard built with Next.js, React, Supabase, Tailwind CSS, and a mix of Framer Motion plus Tailwind animation utilities. It supports two major workflows: a public clinical entry portal for recording medicine issuances, and an admin dashboard for managing records, inventory, personnel, access control, and AI-generated restock insights.

For the current issue, the important takeaway is that this codebase uses **multiple animation systems at once**, and at least one of them is easy to misconfigure. Some animations are real CSS transitions, some are Tailwind utility animations, and some are Framer Motion mounts keyed by route. A “broken animation” symptom here can come from CSS class conflicts, missing utility generation, or a component that is never actually rendered during loading/auth checks.

## Architecture
This is a **route-based Next.js App Router application** with a client-heavy UI layer and a shared Supabase backend. The top-level structure is:

- **Public portal flow**: `src/app/page.tsx` → `/portal` and `/login`
- **Authenticated admin flow**: `src/app/dashboard/*`
- **API route layer**: `src/app/api/*`
- **Shared UI primitives**: `src/components/ui/*`
- **Shared app logic**: `src/lib/*`, `src/hooks/*`, `src/ai/*`

The stack is:
- **Runtime**: Next.js 16 App Router, React 19
- **UI**: Tailwind CSS v4, shadcn/ui-style Radix wrappers, Lucide icons
- **Motion**: Framer Motion plus Tailwind animation utilities
- **Data/Auth**: Supabase client-side auth and Postgres tables
- **AI**: Genkit flow for inventory insights

### How execution starts
The root route (`src/app/page.tsx`) is the landing page. From there:
- `/portal` handles medicine issuance by verified employees
- `/login` handles administrative access
- `/dashboard/layout.tsx` gates all admin routes and wraps them in sidebar/navigation chrome
- Individual dashboard pages load data directly from Supabase on the client

## Directory Structure
```text
project-root/
├── src/
│   ├── app/
│   │   ├── page.tsx                 — Landing page with animated entry cards
│   │   ├── layout.tsx               — Root HTML shell and global styles
│   │   ├── globals.css              — Tailwind v4 imports, tokens, and keyframes
│   │   ├── (auth)/                  — Login / password recovery / update password
│   │   ├── dashboard/
│   │   │   ├── layout.tsx           — Auth gate, sidebar shell, Framer Motion page wrapper
│   │   │   ├── page.tsx             — Dashboard overview
│   │   │   ├── records/page.tsx    — Issuance log table + exports
│   │   │   ├── inventory/page.tsx   — Inventory CRUD/import/export
│   │   │   ├── employees/page.tsx   — Personnel directory CRUD/import/export
│   │   │   ├── users/page.tsx       — Admin access control
│   │   │   ├── insights/page.tsx    — AI recommendations UI
│   │   │   └── new/page.tsx         — Public clinical entry form
│   │   └── api/                     — Admin actions for auth/account operations
│   ├── components/
│   │   ├── layout/dashboard-nav.tsx — Sidebar navigation menu
│   │   ├── records/receipt-view.tsx — Receipt modal/summary after submission
│   │   └── ui/                      — Radix/shadcn-style primitives
│   ├── hooks/
│   │   ├── use-mobile.tsx           — Mobile breakpoint detection
│   │   └── use-toast.ts             — Toast helper
│   └── lib/
│       ├── supabase.ts              — Supabase client
│       ├── utils.ts                 — `cn()` class merge helper
│       └── mock-data.ts             — Local sample data
├── tailwind.config.ts               — Legacy Tailwind config with animation plugin
├── package.json                     — Dependencies include framer-motion, tailwindcss-animate, tw-animate-css
└── README.md                        — Empty
```

## Key Abstractions

### `DashboardLayout`
- **File**: `src/app/dashboard/layout.tsx`
- **Responsibility**: Authenticates admin access, handles first-time initialization, renders the dashboard shell, and wraps page content in a sidebar layout.
- **Interface**: Uses `SidebarProvider`, `Sidebar`, `SidebarInset`, `SidebarTrigger`, and `motion.main`.
- **Lifecycle**: Mounts on every dashboard route; performs Supabase session/admin checks in `useEffect`.
- **Used by**: All `/dashboard/*` pages.

### `SidebarProvider` / `Sidebar`
- **File**: `src/components/ui/sidebar.tsx`
- **Responsibility**: Owns desktop/mobile sidebar state, remembers collapsed/expanded state in a cookie, and provides the responsive sidebar shell.
- **Interface**: `SidebarProvider`, `Sidebar`, `SidebarTrigger`, `SidebarInset`, `useSidebar`.
- **Lifecycle**: Lives for the duration of the dashboard shell.
- **Used by**: `DashboardLayout`, `DashboardNav`.

### `DashboardNav`
- **File**: `src/components/layout/dashboard-nav.tsx`
- **Responsibility**: Renders sidebar navigation links, filters admin-only links by role, and signs the user out.
- **Interface**: Menu sections for overview, records, inventory, directories, and system admin actions.
- **Lifecycle**: Mounted inside the sidebar; role is read from `localStorage`.
- **Used by**: `DashboardLayout`.

### `useIsMobile`
- **File**: `src/hooks/use-mobile.tsx`
- **Responsibility**: Determines whether the viewport is below the mobile breakpoint.
- **Interface**: Returns a boolean.
- **Lifecycle**: Reads `window.matchMedia` after mount.
- **Used by**: `SidebarProvider`.

### `supabase`
- **File**: `src/lib/supabase.ts`
- **Responsibility**: Client-side database/auth access for all app workflows.
- **Interface**: Standard Supabase client methods such as `.from()`, `.auth.getSession()`, `.auth.signUp()`, `.auth.signOut()`.
- **Lifecycle**: Imported wherever client-side data/auth is needed.
- **Used by**: Dashboard, portal, auth pages, API routes.

### `InsightsPage` / AI Flow
- **File**: `src/app/dashboard/insights/page.tsx`, `src/ai/flows/automated-inventory-insight-flow.ts`
- **Responsibility**: Generates and stores AI restock recommendations based on issuance history.
- **Interface**: `getRestockRecommendations({ records })`.
- **Lifecycle**: Triggered manually by the user, cached in `localStorage`.
- **Used by**: Dashboard overview and the AI insights page.

## Data Flow

### Public issuance flow
1. User opens `/portal` (`src/app/dashboard/new/page.tsx`).
2. The page verifies the staff email against `employees`.
3. The form loads inventory options from `medicines`.
4. User selects medicines and submits a new issuance record into `issuances`.
5. Stock counts are decremented in `medicines`.
6. A receipt view is shown after successful submission.

### Dashboard data flow
1. User opens `/dashboard`.
2. `DashboardLayout` checks whether the system is initialized by counting `admins`.
3. It loads the active Supabase session and verifies the current user exists in `admins`.
4. If allowed, the layout renders the sidebar and page content.
5. `DashboardOverview` reads `issuances`, `admins`, `medicines`, and cached AI insights.
6. It computes live stats and critical stock warnings.

### Navigation and sidebar flow
1. `DashboardNav` reads `pathname` from Next navigation.
2. Sidebar items are marked active based on the current route.
3. On mobile, clicking a nav item closes the sheet via `setOpenMobile(false)`.
4. Sign out clears local storage and calls `supabase.auth.signOut()`.

## Non-Obvious Behaviors & Design Decisions

### The animation system is split across three mechanisms
This is the main thing a developer should know if animations appear broken.

- **Framer Motion** is used in `src/app/dashboard/layout.tsx` for page transitions via `motion.main`.
- **Tailwind-style utilities** such as `animate-in`, `fade-in`, `slide-in-from-top-10`, and `zoom-in-95` are used heavily in page components.
- **Custom CSS keyframes** like `fadeInUp` and `pageEnter` are defined in `src/app/globals.css` and consumed with arbitrary-value animation classes.

That means a missing animation can be caused by:
- a Tailwind utility not being generated,
- a class conflict where one `animation` declaration overrides another,
- or the component never mounting because the layout returns `null` while loading/auth checks run.

### The dashboard layout intentionally hides everything during auth
`DashboardLayout` returns `null` while `isLoading` is true and also returns `null` if authorization fails. This keeps unauthorized content from flashing, but it also means the UI is visually blank until Supabase finishes the access checks. If a developer expects an entrance animation on first render, they may not see it because the entire tree is withheld before animation can start.

### A specific animation bug exists in the dashboard overview
`src/app/dashboard/page.tsx` applies two animation utilities to the same wrapper:
- `animate-[fadeInUp_.5s_ease-out]`
- `animate-[pageEnter_.4s_cubic-bezier(0.22,1,0.36,1)]`

Because `animation` is a single CSS property, the later class wins. The result is that only one animation actually applies, not both. This is easy to misread as “the animation isn’t working” when the underlying issue is simply class override behavior.

### Another animation bug exists in the nav logout icon
`src/components/layout/dashboard-nav.tsx` uses:
- `transition-transform group-hover:rotate-12`

But the parent button does not use the plain `group` class; the sidebar button primitives use namespaced variants like `group/menu-button`. As a result, `group-hover:*` will not fire. The logout icon hover rotation will never happen unless the selector matches the actual group class pattern.

### Sidebar animation is mostly CSS-state driven
The sidebar does not rely on complex JS animation for desktop collapse/expand. It uses `data-state`, `data-collapsible`, and `transition-[width,left,right]` classes in `src/components/ui/sidebar.tsx`. If motion looks static, the first thing to verify is whether the provider state is changing and whether the `data-*` selectors are being matched.

### Tailwind configuration is mixed between v4 CSS imports and a legacy config file
`src/app/globals.css` imports:
- `tailwindcss`
- `tw-animate-css`

At the same time, `tailwind.config.ts` still registers `tailwindcss-animate`. In a Tailwind v4 app, this split setup can be confusing. If one animation utility family is not being emitted, the issue may be in build configuration rather than the component code itself.

### Loading state choices are intentionally minimal
Several client pages return `null` until `isMounted` is true. This avoids hydration mismatches and localStorage access errors, but it also delays initial animation and can make the page look like it is “not rendering” for a brief moment.

## Module Reference

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Animated landing page with portal/admin entry cards |
| `src/app/layout.tsx` | Root HTML shell and global CSS import |
| `src/app/globals.css` | Theme tokens, keyframes, Tailwind v4 imports |
| `src/app/dashboard/layout.tsx` | Auth gate, sidebar shell, Framer Motion wrapper |
| `src/app/dashboard/page.tsx` | Overview dashboard with card animations |
| `src/app/dashboard/records/page.tsx` | Issuance history, search, export, delete |
| `src/app/dashboard/inventory/page.tsx` | Inventory CRUD, stock control, CSV import, exports |
| `src/app/dashboard/employees/page.tsx` | Personnel directory CRUD/import/export |
| `src/app/dashboard/users/page.tsx` | Admin access management and password control |
| `src/app/dashboard/insights/page.tsx` | AI restock recommendations UI |
| `src/app/dashboard/new/page.tsx` | Public clinical entry form and receipt generation |
| `src/components/layout/dashboard-nav.tsx` | Sidebar menu and logout |
| `src/components/ui/sidebar.tsx` | Responsive sidebar primitives and state machine |
| `src/components/records/receipt-view.tsx` | Receipt display after submission |
| `src/hooks/use-mobile.tsx` | Mobile breakpoint hook |
| `src/lib/supabase.ts` | Supabase client |
| `src/lib/utils.ts` | `cn()` helper for class merging |
| `src/ai/flows/automated-inventory-insight-flow.ts` | Genkit restock analysis flow |

## Suggested Reading Order
1. `src/app/dashboard/layout.tsx` — Shows where route rendering starts and why the dashboard can appear blank before auth completes.
2. `src/components/ui/sidebar.tsx` — Explains the sidebar’s state-driven animation model and responsive behavior.
3. `src/components/layout/dashboard-nav.tsx` — Shows route-aware styling and one of the hover-animation bugs.
4. `src/app/dashboard/page.tsx` — Demonstrates the custom keyframe animations and the class override problem.
5. `src/app/globals.css` — Shows the animation/keyframe definitions and Tailwind v4 import strategy.
6. `src/app/page.tsx` — Useful for comparing working landing-page animation patterns against dashboard behavior.

## Most Likely Reasons the Animation Appears Broken
If the issue is specifically “why is the animation not working,” the highest-probability causes in this codebase are:

1. **A class conflict on the dashboard overview**  
   Two `animate-[...]` classes are applied to the same element, so one overrides the other.

2. **A hover selector mismatch in the nav**  
   `group-hover:rotate-12` is used without a plain `group` ancestor.

3. **The dashboard shell hides content until auth completes**  
   `DashboardLayout` returns `null` during loading/authorization, so the animation has no visible phase.

4. **Mixed Tailwind animation setup**  
   Tailwind v4 CSS imports and the legacy plugin setup may not be generating the same utility set everywhere.

If you want, I can next narrow this down to the exact component that is failing and explain how to confirm it from the browser DOM/CSS state.