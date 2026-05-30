# Polaris — Light/Dark Theme + UI Revamp + Navigation Fix

> All file paths are relative to the `nexus/` project root.
> When the instruction says **"create"**, create the file.
> When it says **"replace"**, replace the existing file wholesale.
> When it says **"modify"**, make targeted edits as described.
>
> **Do not skip any file in the inventory below.** Every visible UI surface must work in both light and dark mode.

---

## 0. Project context

Polaris is a Vite + React 19 + Tailwind CSS v4 + Framer Motion v12 + Zustand v5 SPA — a civic-intelligence platform for polarized tech & science debates.

The current build has three critical problems:

1. **Dark-only theming** — `src/index.css` defines tokens only under `:root` with a fixed dark palette. Many components also hardcode `text-white`, `bg-black/70`, Tailwind `emerald-*` / `rose-*` / `slate-*`, and SVG `fill="white"`. None of this adapts to light mode.
2. **Broken visual polish** — The editorial redesign is incomplete: inconsistent border-radius (`rounded-none` mixed with `rounded-full`), cramped `max-w-2xl` main column, triple mobile nav (bottom bar + hamburger menu + navbar logo), tablet sidebar missing Submit Topic, and hardcoded rgba shadows.
3. **Discussion page navigation bug** — Clicking a card from Home/Explore often shows **"Discussion not found"** until the user refreshes or navigates again. Root cause: `hydrateFromFeed()` runs in `useEffect` (after first paint) while `feedLoading` is already `false`, so the not-found branch renders before hydration completes.

---

## 1. Fix the discussion navigation bug (do this first)

### 1a. Synchronous hydration in `src/pages/DiscussionPage.jsx`

Replace the deferred-only hydration pattern. Hydrate **during render** (or in `useLayoutEffect`) before the not-found guard:

```jsx
// At top of DiscussionPageInner, BEFORE reading detail:
import { useLayoutEffect, useMemo } from 'react'

// Synchronous hydrate on every render when id changes
const hydratedPost = useMemo(() => {
  if (!id) return null
  return hydrateFromFeed(id)
}, [id, hydrateFromFeed, feedPosts, feedLoading, feedLastRefresh])

// Also keep useLayoutEffect as safety net for store updates
useLayoutEffect(() => {
  if (id) hydrateFromFeed(id)
}, [id, hydrateFromFeed, feedPosts, feedLoading, feedLastRefresh])

const post = detail?.post ?? hydratedPost
```

### 1b. Fix the loading / not-found gate

Replace the current `if (!post)` block logic:

```jsx
const isHydrating = Boolean(id && !post && (feedLoading || feedPosts.length > 0))

if (!post) {
  if (isHydrating || feedLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-32 skeleton-shimmer rounded-none" />
        <div className="aspect-[21/9] min-h-[160px] w-full skeleton-shimmer rounded-none" />
        <div className="h-8 w-3/4 skeleton-shimmer rounded-none" />
        <p className="text-sm text-[var(--muted)]">Loading discussion…</p>
      </div>
    )
  }
  return ( /* existing not-found UI */ )
}
```

**Rule:** Never show "Discussion not found" while the feed has posts and hydration hasn't run yet.

### 1c. Fix `detailById` key mismatch in `src/stores/discussionStore.js`

Ensure lookup and storage use the **same key** (URL param `id`):

```js
hydrateFromFeed: (id) => {
  const decoded = decodeURIComponent(id)
  const feed = useFeedStore.getState().posts
  const post =
    feed.find((p) => p.id === id) ||
    feed.find((p) => p.id === decoded) ||
    MOCK_DISCUSSIONS.find((p) => p.id === id || p.id === decoded)
  if (!post) return null

  const cacheKey = id // always key by URL param
  const existing = get().detailById[cacheKey]
  // ...
  set({
    currentId: post.id,
    detailById: {
      ...get().detailById,
      [cacheKey]: { post, comments: baseComments, sort },
    },
  })
  return post
},
```

Update `DiscussionPage.jsx` selector to match:

```js
const detail = useDiscussionStore((s) => (id ? s.detailById[id] : null))
```

Also update `addComment`, `voteComment`, `setSort`, `sortedComments` to accept either `post.id` or URL `id` — or normalize to always use `post.id` internally but read via URL key in the page.

### 1d. Reduce route transition blank flash in `src/layout/AppLayout.jsx`

Change `AnimatePresence mode="wait"` → `mode="sync"` (or remove `mode` entirely) so the new page mounts immediately:

```jsx
<AnimatePresence mode="sync">
  <motion.main
    key={location.pathname}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18 }}
```

---

## 2. Theme system — dual light/dark with zero hardcoded colors

### 2a. Replace `src/index.css` token architecture

Use **semantic tokens** that swap under `[data-theme="light"]`. Keep the Ink + Signal brand but define both palettes:

```css
@import 'tailwindcss';

/* ─── Shared brand ──────────────────────────────────────────────────── */
:root {
  --signal:       #D93025;
  --signal-dim:   #9A1F17;
  --font-display: 'Bebas Neue', 'Impact', sans-serif;
  --font-heading: 'DM Serif Display', Georgia, serif;
  --font-body:    'IBM Plex Sans', 'Helvetica Neue', sans-serif;
  --font-mono:    'IBM Plex Mono', monospace;

  /* Stance — same hues both modes */
  --for:     #E8E8EF;
  --against: #D93025;
  --neutral: #4A4A52;
}

/* ─── Dark theme (default) ──────────────────────────────────────────── */
:root,
[data-theme="dark"] {
  color-scheme: dark;

  --ink-950:  #0E0E0F;
  --ink-900:  #161618;
  --ink-800:  #1E1E21;
  --ink-700:  #2A2A2E;
  --ink-500:  #4A4A52;
  --ink-300:  #9A9AA8;
  --ink-100:  #E8E8EF;
  --ink-000:  #F7F7FA;

  --signal-muted: rgba(217,48,37,.12);
  --signal-on:    #FFFFFF;          /* text on signal buttons */

  --page:         var(--ink-950);
  --surface:      var(--ink-900);
  --surface-hi:   var(--ink-800);
  --border:       rgba(255,255,255,.07);
  --border-hi:    rgba(255,255,255,.13);
  --text:         var(--ink-100);
  --text-hi:      var(--ink-000);
  --muted:        var(--ink-300);
  --overlay:      rgba(0,0,0,.65);
  --shadow-card:  0 8px 32px rgba(0,0,0,.25);
  --shadow-hover: 0 8px 32px rgba(217,48,37,.08);
  --grain-opacity: 0.035;
  --scrollbar-track: var(--ink-950);
  --scrollbar-thumb: var(--ink-700);

  /* Stance overrides for dark */
  --for:     #E8E8EF;
  --neutral: #4A4A52;
}

/* ─── Light theme ───────────────────────────────────────────────────── */
[data-theme="light"] {
  color-scheme: light;

  --ink-950:  #F7F7FA;   /* page background */
  --ink-900:  #FFFFFF;   /* card surface */
  --ink-800:  #F0F0F4;   /* elevated surface */
  --ink-700:  #E2E2EA;   /* border / divider */
  --ink-500:  #9898A8;
  --ink-300:  #5C5C6E;
  --ink-100:  #2A2A32;   /* body text */
  --ink-000:  #0E0E0F;   /* headings */

  --signal-muted: rgba(217,48,37,.08);
  --signal-on:    #FFFFFF;

  --page:         var(--ink-950);
  --surface:      var(--ink-900);
  --surface-hi:   var(--ink-800);
  --border:       rgba(0,0,0,.08);
  --border-hi:    rgba(0,0,0,.14);
  --text:         var(--ink-100);
  --text-hi:      var(--ink-000);
  --muted:        var(--ink-300);
  --overlay:      rgba(14,14,15,.45);
  --shadow-card:  0 4px 24px rgba(0,0,0,.06);
  --shadow-hover: 0 8px 32px rgba(217,48,37,.12);
  --grain-opacity: 0.025;
  --scrollbar-track: var(--ink-950);
  --scrollbar-thumb: var(--ink-700);

  /* Stance overrides for light */
  --for:     #2A2A32;
  --neutral: #9898A8;
}

body {
  margin: 0;
  min-height: 100svh;
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  color: var(--text);
  background-color: var(--page);
  -webkit-font-smoothing: antialiased;
  transition: background-color .2s ease, color .2s ease;
}

body::before {
  opacity: var(--grain-opacity);
  /* keep existing SVG noise */
}

/* Update .badge-verified, .skeleton-shimmer, hr.signal, scrollbar
   to use semantic tokens (--surface, --border, etc.) not hardcoded ink values */
```

### 2b. Create `src/stores/themeStore.js`

```js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'system', // 'light' | 'dark' | 'system'
      resolved: 'dark',

      init: () => {
        const { theme } = get()
        const resolved = theme === 'system' ? systemTheme() : theme
        applyTheme(resolved)
        set({ resolved })
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          if (get().theme === 'system') {
            const r = systemTheme()
            applyTheme(r)
            set({ resolved: r })
          }
        })
      },

      setTheme: (theme) => {
        const resolved = theme === 'system' ? systemTheme() : theme
        applyTheme(resolved)
        set({ theme, resolved })
      },

      toggle: () => {
        const next = get().resolved === 'dark' ? 'light' : 'dark'
        get().setTheme(next)
      },
    }),
    { name: 'polaris-theme-v1', partialize: (s) => ({ theme: s.theme }) }
  )
)
```

### 2c. Create `src/components/ThemeToggle.jsx`

Icon button (sun/moon) for navbar + desktop sidebar footer. Uses `useThemeStore`. Must be visible on all breakpoints (navbar on mobile/tablet, sidebar on desktop).

```jsx
// Cycles: light → dark → system (or simple light/dark toggle)
// Classes: text-[var(--text)] hover:bg-[var(--surface-hi)]
// aria-label="Toggle color theme"
```

### 2d. Wire theme init in `src/main.jsx`

```jsx
import { useThemeStore } from './stores/themeStore'
useThemeStore.getState().init()
```

Call **before** `createRoot().render()`.

### 2e. Global color migration rules (apply to EVERY file below)

| ❌ Remove | ✅ Replace with |
|-----------|-----------------|
| `text-white` on buttons | `text-[var(--signal-on)]` |
| `bg-[var(--ink-950)]` on page chrome | `bg-[var(--page)]` |
| `bg-[var(--ink-900)]` on cards | `bg-[var(--surface)]` |
| `bg-[var(--ink-800)]` on elevated/hover | `bg-[var(--surface-hi)]` |
| `bg-black/70`, `bg-black/30` overlays | `bg-[var(--overlay)]` |
| `shadow-black/50` | `shadow-[var(--shadow-card)]` |
| `hover:text-rose-300`, `ring-emerald-*`, `bg-emerald-*`, `bg-rose-*`, `bg-slate-*` | Theme-aware vars: `--stance-for-bg`, `--stance-against-bg`, `--stance-neutral-bg` (add to index.css both themes) |
| SVG `fill="white"` | `fill="currentColor"` + `text-[var(--signal-on)]` on parent |
| Hardcoded `rgba(217,48,37,.08)` shadows | `var(--shadow-hover)` |
| Google Login `theme="filled_black"` | `theme="outline"` in light, `filled_black` in dark — read from `useThemeStore.resolved` |

Add to both theme blocks in CSS:

```css
--stance-for-bg:      /* dark: ink-800 tint, light: #F0F0F4 */
--stance-for-text:    /* dark: --for, light: --for */
--stance-against-bg:  /* dark: signal-muted, light: signal-muted */
--stance-against-text: var(--signal);
--stance-neutral-bg:  /* dark: ink-800, light: ink-800 */
--stance-neutral-text: var(--muted);
```

---

## 3. Full UI revamp — layout & visual system

### 3a. `src/layout/AppLayout.jsx`

- Main column: `max-w-3xl` (was `max-w-2xl` — too cramped for discussion hero)
- Page background: `bg-[var(--page)]`
- Right rail: show `TrendingPanel` from `lg:` (1024px), not only `xl:` — use `hidden lg:block w-[260px] xl:w-[280px]`
- Add `ThemeToggle` to layout (or ensure navbar/sidebar include it)
- Fix bottom padding: `pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-10`

### 3b. Consolidate mobile navigation

**Pick ONE mobile nav pattern.** Recommended:

- Keep `MobileBottomNav` (4 tabs) on `< md`
- **Remove** the duplicate icon row inside `MenuPanel.jsx` OR remove hamburger + MenuPanel entirely and rely on bottom nav + navbar actions
- If keeping MenuPanel: only show legal links + sign out + theme toggle — not duplicate Home/Explore/Profile/About

Modify `src/components/MenuPanel.jsx` accordingly.

### 3c. `src/components/DesktopSidebar.jsx`

- Tablet (md–xl): show icon-only nav WITH a small "Submit" icon button (not hidden until xl)
- Use `bg-[var(--page)]` not hardcoded ink
- Sign out / Editor Panel borders use `var(--border)`

### 3d. Border-radius system (apply globally)

| Element | Radius |
|---------|--------|
| Cards, modals, inputs, buttons, nav items | `rounded-none` (editorial) |
| Stance bar segments | `rounded-none` |
| Stance bar tooltip | `rounded-none` |
| Notification unread dot | `rounded-full` (only exception) |
| Profile category progress bars | `rounded-full` |
| Verified badge pill | `rounded-full` |

Run a project-wide pass — no stray `rounded-lg`, `rounded-xl`, `rounded-md` except the exceptions above.

### 3e. Typography & spacing scale

Apply consistently:

- Page titles: `font-display text-4xl sm:text-5xl uppercase tracking-widest text-[var(--text-hi)]`
- Section labels: `font-mono text-[9px] uppercase tracking-[.15em] text-[var(--muted)]`
- Every section heading gets `<hr className="signal" />` beneath it
- Card padding: `p-4 sm:p-5`
- Feed gap: `gap-6 sm:gap-8`

---

## 4. File-by-file theme + UI checklist

**Every file must be opened and updated.** Do not assume CSS variables alone fix components with hardcoded Tailwind colors.

### Components (`src/components/`)

| File | Required changes |
|------|------------------|
| `AppNavbar.jsx` | Semantic tokens, ThemeToggle, remove `text-white`, overlay-safe backdrop |
| `AuthGate.jsx` | `bg-[var(--overlay)]`, modal `bg-[var(--surface)]`, dynamic Google button theme, all inputs `rounded-none` |
| `CivilityBadge.jsx` | Tone colors via `--stance-*` vars for both themes |
| `DesktopSidebar.jsx` | Semantic tokens, tablet Submit icon, ThemeToggle on xl |
| `DiscussionCard.jsx` | `var(--shadow-card/hover)`, remove `text-white`, stance buttons use `--stance-*`, verified badge visible both themes |
| `FeedSortControls.jsx` | Active/inactive states via `--surface-hi`, `--signal`, `--border` |
| `InfiniteScrollFeed.jsx` | "Caught up" text uses `--muted` |
| `LogoMark.jsx` | Star glyph: `fill="currentColor"` + `text-[var(--signal-on)]` |
| `MenuPanel.jsx` | Dedupe nav, semantic overlay + surface colors |
| `MobileBottomNav.jsx` | `bg-[var(--page)]/95`, active `--signal` |
| `NewDiscussionModal.jsx` | `max-h-[90svh] overflow-y-auto`, all `--surface` tokens, stance pills `rounded-none`, rename to "Submit Topic" |
| `NotificationsPanel.jsx` | Backdrop `--overlay`, panel `--surface`, unread dot stays `rounded-full` |
| `SkeletonCard.jsx` | `--surface` + `.skeleton-shimmer` (must work light mode) |
| `StanceBar.jsx` | Segment colors from CSS vars; tooltip `--surface` |
| `TopicExplainerBanner.jsx` | Left border `--signal`, bg `--surface` |
| `TrendingPanel.jsx` | Full editorial header + rank colors |
| `VerifiedBadge.jsx` | Uses `.badge-verified` (update class in CSS for light) |
| `ThemeToggle.jsx` | **CREATE** |
| `FeedBootstrap.jsx` | No UI — skip |

### Pages (`src/pages/`)

| File | Required changes |
|------|------------------|
| `HomePage.jsx` | Hero uses semantic tokens; add loading skeleton matching dark+light |
| `ExplorePage.jsx` | Add loading skeleton (parity with Home); category sidebar themed |
| `DiscussionPage.jsx` | **Bug fix §1**; hero `min-h-[160px]`; stance pills use `--stance-*` not emerald/rose/slate; explainer + verified badge; comment form fully themed |
| `ProfilePage.jsx` | All cards `--surface`; stats accent `--signal`; category bars keep `rounded-full` |
| `ManagerPage.jsx` | PIN inputs, review cards, tabs — all semantic tokens; remove `text-white` |
| `AboutPage.jsx` | Themed links + typography |
| `TermsPage.jsx` | Replace "Nexus" if any remain; semantic text colors |
| `PrivacyPage.jsx` | Same |

### Layout & entry

| File | Required changes |
|------|------------------|
| `AppLayout.jsx` | §3a layout fixes |
| `App.jsx` | No change unless theme provider needed |
| `main.jsx` | Theme init |
| `index.css` | §2a full replace |
| `index.html` | Add `data-theme="dark"` on `<html>` as SSR flash-prevention default |

### Stores

| File | Required changes |
|------|------------------|
| `themeStore.js` | **CREATE** §2b |
| `discussionStore.js` | §1c key fix |
| `userStore.js` | No theme needed (optional: persist theme preference here instead — prefer separate store) |

---

## 5. Light-mode-specific visual QA

After implementation, verify **every route** in both themes:

### Routes
- [ ] `/` — hero, explainer banner, sort pills, cards, stance picker, like button
- [ ] `/explore` — category sidebar active state, filtered cards
- [ ] `/discussion/:id` — hero image gradient, tabs, explainer, both-sides columns, common ground, comment form, sort pills, comment cards, sources list
- [ ] `/profile/me` — stats grid, category bars, activity feed, stance pills
- [ ] `/manager` — PIN gate, filter tabs, review cards, bullet editor textarea
- [ ] `/about`, `/terms`, `/privacy` — body text readable, link hover states

### Overlays (both themes)
- [ ] AuthGate (Google sign-in + DOB modals)
- [ ] NewDiscussionModal
- [ ] NotificationsPanel (desktop dropdown + mobile fullscreen)
- [ ] MenuPanel (if kept)

### Chrome
- [ ] AppNavbar — date line, Submit Topic CTA, notification badge, theme toggle
- [ ] DesktopSidebar — masthead, nav active state, Editor Panel, Submit
- [ ] MobileBottomNav — 4 tabs active state
- [ ] TrendingPanel — rank numbers, verified marker

### Theme toggle
- [ ] Toggle light ↔ dark — no flash of wrong theme on reload
- [ ] `system` preference follows OS
- [ ] Preference persists in `localStorage` (`polaris-theme-v1`)
- [ ] Scrollbar, grain overlay, skeleton shimmer all readable in light mode

---

## 6. Navigation bug verification

- [ ] Click any card from Home → discussion renders **immediately** (no "not found" flash)
- [ ] Click from Explore → same
- [ ] Click from TrendingPanel → same
- [ ] Click from NotificationsPanel → same (or graceful not-found if id truly missing)
- [ ] Hard refresh `/discussion/:id` → loading skeleton, then content
- [ ] Navigate back → forward → no double refresh needed
- [ ] `detailById` caches correctly — second visit instant

---

## 7. Build & regression checks

```bash
npm run dev    # zero console errors
npm run build  # zero errors
npm run lint   # fix any new lint issues
```

- [ ] No `text-white`, `bg-black/`, `emerald-`, `rose-`, `slate-` in `src/` (except comments)
- [ ] No `--ink-*` used directly on backgrounds in JSX — use `--page`, `--surface`, `--surface-hi`
- [ ] No "Nexus" in visible UI strings
- [ ] Google OAuth button readable in both themes
- [ ] WCAG: body text contrast ≥ 4.5:1 in both themes (adjust `--muted` if needed)

---

## 8. Optional polish (if time permits)

- Add `prefers-reduced-motion` media query to disable Framer parallax on discussion hero
- Add theme transition on `color` / `background-color` only (not `all` — performance)
- Update `docs/NEXUS-DATA.md` → rename to `POLARIS-DATA.md` with corrected localStorage key names
- Export `useTheme()` hook from themeStore for components that need `resolved === 'dark'`

---

*End of prompt. Treat §1 (navigation bug) and §2 (theme tokens) as blockers before visual polish. Every file in §4 must be explicitly updated — do not rely on CSS alone.*
