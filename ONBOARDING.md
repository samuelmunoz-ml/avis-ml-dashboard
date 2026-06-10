# Avis Budget Group × Monstarlab — Research Dashboard
### Claude Code Onboarding Guide

---

## What this project is

A full-stack Next.js dashboard that gives Avis Budget Group stakeholders (James Adams, Neil Morgan, etc.) a curated, password-protected view of ML research findings, experiments, and timelines produced by the Monstarlab ML team.

**Live URL:** https://avis-ml-dashboard.vercel.app  
**GitHub:** https://github.com/samuelmunoz-ml/avis-ml-dashboard  
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · NextAuth.js · Google Sheets API

---

## Quick start (local dev)

```bash
# 1. Clone
git clone https://github.com/samuelmunoz-ml/avis-ml-dashboard
cd avis-ml-dashboard

# 2. Install
npm install

# 3. Pull environment variables from Vercel
npx vercel link       # link to the existing project
npx vercel env pull .env.local

# 4. Run
npm run dev
# → http://localhost:3000
```

> **Admin access requires a @monstar-lab.com Google account.** Sign in at `/auth/signin`.

---

## Environment variables

All variables live in Vercel. Pull them with `vercel env pull .env.local`.

| Variable | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth — admin sign-in |
| `GOOGLE_CLIENT_SECRET` | Google OAuth — admin sign-in |
| `NEXTAUTH_SECRET` | NextAuth session signing key |
| `GOOGLE_SHEETS_API_KEY` | Read-only key for the Sheets API |

> The Google OAuth only allows `@monstar-lab.com` accounts. To change the allowed domain, edit `auth.ts` → `ALLOWED_DOMAIN`.

---

## Project structure

```
app/
  admin/                   ← Admin panel (protected, ML team only)
    page.tsx               ← Widget builder (drag, resize, configure widgets)
    findings/page.tsx      ← Add / manage findings
    share-links/page.tsx   ← Create & manage stakeholder share links
    source-sync/page.tsx   ← Connect Google Sheets data sources
  view/[slug]/             ← Viewer mode (password-protected per slug)
    page.tsx               ← Password gate
    overview/page.tsx      ← Dashboard overview
    findings/              ← Findings list + detail
    experiments/           ← Experiments list + detail
    timeline/page.tsx      ← Timeline + Gantt
  api/
    auth/[...nextauth]/    ← NextAuth Google OAuth handler
    sync/route.ts          ← POST: fetch + parse a Google Sheet tab

components/
  GanttChart.tsx           ← Full interactive Gantt (from @roadmap-ui)
  AdminSidebar.tsx         ← Admin nav with user info + sign-out
  ViewerSidebar.tsx        ← Viewer nav with "New" badge counter
  StatusBadge.tsx          ← Dot + pill badge for all status types

lib/
  types.ts                 ← All TypeScript interfaces (Finding, Experiment, etc.)
  defaultData.ts           ← Hardcoded seed data (fallback if no sheets connected)
  store.ts                 ← localStorage data layer + auth helpers
  sheets.ts                ← Google Sheets fetch + per-type parsers
  sourceConfig.ts          ← Source connection config (stored in localStorage)

auth.ts                    ← NextAuth config + domain restriction
middleware.ts              ← Blocks /admin/* unless @monstar-lab.com JWT
```

---

## How data flows

```
Google Sheets  →  /api/sync (POST)  →  parsed TypeScript objects
                                            ↓
                                    localStorage (DataStore)
                                            ↓
                                    React components (useData hook)
```

Data is fetched on demand when an admin clicks "Sync now". It's stored in `localStorage` and persists across page reloads. If no sheets are connected, the app uses `lib/defaultData.ts` as a fallback.

---

## How to connect Google Sheets

### 1. One-time setup (already done)
- Google Sheets API key is set as `GOOGLE_SHEETS_API_KEY` in Vercel
- Google OAuth credentials are set as `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`

### 2. Create a Google Sheet

Create one Google Sheet file. Add a separate tab for each data type you want to live-sync. Share the sheet as **"Anyone with the link can view"**.

Each tab must have the exact column names in **Row 1** (copy from the admin panel at `/admin/source-sync`).

---

### Sheet column schemas

#### `findings` tab

| Column | Type | Notes |
|---|---|---|
| `id` | string | Leave blank to auto-generate |
| `title` | string | Required |
| `description` | string | Required |
| `site` | string | e.g. `avis.com` |
| `severity` | string | `High` / `Medium` / `Low` |
| `status` | string | `Reported` / `Acknowledged` / `Fix in progress` / `Resolved` |
| `category` | string | e.g. `Checkout - UX bug` |
| `addedBy` | string | Person's name |
| `dateAdded` | string | e.g. `Jun 30, 2026` |
| `isPinned` | boolean | `TRUE` or `FALSE` — pinned findings appear on Overview |
| `relatedFindingIds` | string | Comma-separated: `f-1,f-2` |
| `step1Title` | string | Resolution step 1 title |
| `step1Description` | string | |
| `step1Status` | string | `pending` / `in_progress` / `completed` |
| `step1CompletedDate` | string | e.g. `Jun 30, 2026` |
| `step2Title … step4Title` | string | Repeat pattern for up to 4 steps |

---

#### `experiments` tab

| Column | Type | Notes |
|---|---|---|
| `id` | string | |
| `title` | string | |
| `status` | string | `Running` / `Planning` / `Complete` / `Blocked` / `Reported` |
| `owner` | string | |
| `lastUpdated` | string | |
| `startDate` | string | |
| `site` | string | |
| `category` | string | |
| `severity` | string | |
| `addedBy` | string | |
| `hypothesis` | string | |
| `approach` | string | |
| `outcome` | string | |
| `outcomeStatus` | string | `Pending` / `Confirmed` / `Failed` |
| `relatedFindingIds` | string | Comma-separated |
| `metric1Label` | string | e.g. `Forecast gap` |
| `metric1Value` | string | e.g. `8.1%` |
| `metric1Subtext` | string | e.g. `↓ 3.9pp improvement` |
| `metric2Label … metric3Label` | string | Repeat for up to 3 metrics |

---

#### `timeline` tab

| Column | Type | Notes |
|---|---|---|
| `id` | string | |
| `name` | string | e.g. `Discovery` |
| `startDate` | string | e.g. `May 18` (no year) |
| `endDate` | string | e.g. `May 31` |
| `color` | string | Hex: `#3B82F6` |
| `status` | string | `completed` / `in_progress` / `upcoming` |

---

#### `milestones` tab

| Column | Type | Notes |
|---|---|---|
| `id` | string | |
| `title` | string | |
| `date` | string | e.g. `May 31, 2026` |
| `status` | string | `Complete` / `In Progress` / `Upcoming` |
| `description` | string | |
| `isHighlighted` | boolean | `TRUE` highlights with a blue border |

---

#### `kpi` tab

| Column | Type | Notes |
|---|---|---|
| `metric` | string | `findings` / `experiments` / `anomalyRate` / `resolved` |
| `value` | string | e.g. `14` or `9.7%` |
| `subtext` | string | e.g. `↑ 3 since last week` |
| `trend` | string | `up` / `down` / `neutral` |

**Example kpi rows:**
```
findings    | 14    | ↑ 3 since last week        | up
experiments | 6     | 2 completed this week      | neutral
anomalyRate | 9.7%  | ↓ Highest since cutover    | down
resolved    | 5     | ✓ 2 resolved this week     | up
```

---

### 3. Connect in the admin panel

1. Go to **Admin → Source sync → Add source**
2. Select the data type (Findings, Experiments, etc.)
3. Paste the Google Sheets URL
4. Enter the tab name (e.g. `findings`)
5. Click **Test connection** — verifies the API key and detects column headers
6. **Add source** → **Sync now**

Data loads instantly. Re-sync any time, or it'll show "Stale" after 6 hours as a reminder.

---

## How share links work

Each viewer (James Adams, Neil Morgan, etc.) has a **share link** — a unique URL + password pair. The admin configures:
- Which sections they can see (Overview, Findings, Experiments, Timeline)
- The password to enter the dashboard

Manage them at **Admin → Share links**.

**Viewer URLs:** `https://avis-ml-dashboard.vercel.app/view/{slug}`
- James Adams: `/view/james-adams` · password: `Avis-ML-2026`
- Neil Morgan: `/view/neil-morgan` · password: `Avis-ML-2024`

Viewers never see the admin panel — they only see the sections enabled for their link. "New" badges appear on findings they haven't opened yet.

---

## Deploying changes

Every push to `main` triggers an automatic Vercel deploy (connected via GitHub).

```bash
git add -A
git commit -m "your message"
git push
# → live in ~30s at https://avis-ml-dashboard.vercel.app
```

To deploy manually:
```bash
npx vercel --prod --yes
```

---

## Key things to know

- **Authentication:** `/admin/*` is blocked by `middleware.ts` unless you have a valid `@monstar-lab.com` JWT session. The sign-in page is at `/auth/signin`.
- **Data persistence:** All data (findings, experiments, share link config, seen-findings tracking) lives in **localStorage**. This means it's per-browser. For multi-admin workflows, connect Google Sheets as the source of truth.
- **Widget builder:** The Overview page layout is fully configurable — drag widgets, resize (Full / ½ width), configure per widget, add/remove widgets.
- **Page management:** Admin can add/remove pages (Findings, Experiments, Timeline, Milestones) from the widget builder tab bar.
- **Gantt chart:** The Timeline page uses `@roadmap-ui`'s Gantt component with `@dnd-kit`. It auto-centers on load.
