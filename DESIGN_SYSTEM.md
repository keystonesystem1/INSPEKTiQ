# INSPEKTiQ Design System
**Version 1.0 — Keystone Stack — Do Not Distribute**

This is the single source of truth for all UI decisions in INSPEKTiQ. Forge reads this file before touching any component. No visual decision should be made that contradicts this document. If something is not defined here, ask before inventing.

---

## 1. Brand Identity

INSPEKTiQ is the firm-facing desktop platform in the Keystone Stack product suite. It is a sibling to INSPEKTiT (the field adjuster mobile app). The two products share a parent brand but are visually differentiated by their accent color.

### Wordmark
- Font: **Orbitron 900** — used exclusively for the wordmark, nowhere else in the UI
- Treatment: `INSPEKT` in white `#F2F2F4`, `iQ` in Sage Green `#5BC273`
- No bracket symbol (that belongs to INSPEKTiT only)
- Never modify the wordmark, never use Orbitron for navigation, headings, or UI labels

---

## 2. Color Tokens

These are the exact CSS custom properties to be defined in the root `:root` block. Do not deviate from these values.

```css
:root {
  /* Backgrounds */
  --bg:          #0A0A0A;   /* Page background — locked per brand doc */
  --surface:     #0F1923;   /* Panels, sidebars, secondary surfaces */
  --card:        #162130;   /* Card backgrounds */
  --card-hi:     #1C2B3D;   /* Card hover state */

  /* Borders */
  --border:      rgba(255, 255, 255, 0.07);   /* Default border */
  --border-hi:   rgba(255, 255, 255, 0.14);   /* Hover/focus border */

  /* INSPEKTiQ Accent — Sage Green (LOCKED per brand doc) */
  --sage:        #5BC273;
  --sage-light:  #6DD882;   /* Hover state only */
  --sage-dim:    rgba(91, 194, 115, 0.12);    /* Background tints */
  --sage-glow:   rgba(91, 194, 115, 0.25);    /* Glow effects sparingly */

  /* Brand Blue — INSPEKTiT accent, used in INSPEKTiQ for informational states */
  --blue:        #4298CC;
  --blue-dim:    rgba(66, 152, 204, 0.12);

  /* Semantic Colors */
  --orange:      #E07B3F;   /* Warning, attention needed, SLA at risk */
  --orange-dim:  rgba(224, 123, 63, 0.13);
  --red:         #E05C5C;   /* Error, overdue, critical */
  --red-dim:     rgba(224, 92, 92, 0.13);
  --bronze:      #C9A84C;   /* Keystone parent brand, certifications */
  --bronze-dim:  rgba(201, 168, 76, 0.12);

  /* Text */
  --white:       #F2F2F4;   /* Primary text */
  --muted:       rgba(242, 242, 244, 0.45);   /* Secondary text, labels */
  --faint:       rgba(242, 242, 244, 0.18);   /* Placeholder, disabled */

  /* Layout */
  --nav-h:       56px;      /* Top nav height */
  --radius-sm:   4px;
  --radius-md:   6px;
  --radius-lg:   10px;
  --radius-xl:   12px;
}
```

### Color Semantic Meaning
| Color | When to use |
|---|---|
| `--sage` | Primary actions, active states, confirmed/success, nav active indicator |
| `--blue` | Informational badges, links, scheduled states |
| `--orange` | SLA at risk, warnings, pending states, due soon |
| `--red` | SLA overdue, errors, critical alerts |
| `--bronze` | Certifications, carrier-specific requirements |
| `--muted` | Labels, metadata, secondary text |
| `--faint` | Placeholders, disabled, decorative |

### What NOT to do with colors
- Never use `#3DAA6A` — this is a deviation from the brand doc, use `--sage: #5BC273`
- Never use white backgrounds for content areas — the app is always dark
- Never use pure black text on colored backgrounds — use the color's own dark variant
- Never add new color variables without updating this document

---

## 3. Typography

### Font Loading
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500&family=Orbitron:wght@900&display=swap" rel="stylesheet">
```

### Font Assignments
| Font | Usage | Weights |
|---|---|---|
| **Orbitron 900** | Wordmark only (`INSPEKTiQ`) | 900 |
| **Barlow Condensed** | All headings, nav labels, tab labels, CTAs, badges, pills, section titles, stat numbers | 600, 700, 800, 900 |
| **Barlow** | All body copy, descriptions, prose, form inputs, table cell content | 300, 400, 500 |

### Never use
Inter, Roboto, Arial, Syne, DM Sans, or any system fonts. These are explicitly prohibited by the brand doc.

### Type Scale
```css
/* Page titles */
.page-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800;
  font-size: 22px;
  letter-spacing: 0.04em;
  color: var(--white);
}

/* Section headings / Card titles */
.section-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

/* Nav labels / Tab labels */
.nav-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}

/* Stat numbers */
.stat-num {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 900;
  font-size: 32px;
  line-height: 1;
}

/* Body copy */
.body {
  font-family: 'Barlow', sans-serif;
  font-weight: 400;
  font-size: 13px;
  line-height: 1.6;
  color: var(--white);
}

/* Metadata / captions */
.meta {
  font-family: 'Barlow', sans-serif;
  font-weight: 400;
  font-size: 11px;
  color: var(--muted);
}

/* Badge / pill text */
.badge-text {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

---

## 4. Layout

### Navigation
- Top nav bar — always fixed, always visible, never a sidebar
- Height: `56px` (`--nav-h`)
- Background: `rgba(8, 12, 16, 0.92)` with `backdrop-filter: blur(12px)` — glass effect
- Border bottom: `1px solid var(--border)`
- Box shadow: `0 1px 0 rgba(0, 0, 0, 0.4)`
- Logo at far left, tabs inline, search + avatar at far right

### Nav Tab States
```css
/* Default */
color: var(--muted);

/* Hover */
color: var(--white);
background: rgba(255, 255, 255, 0.05);

/* Active */
color: var(--sage);
/* Active indicator — underline on tab */
::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 14px; right: 14px;
  height: 2px;
  background: linear-gradient(90deg, var(--sage), var(--sage-light));
  border-radius: 2px 2px 0 0;
}
```

### Page Layout
```
[Nav — 56px fixed]
[Page content — full remaining height, overflow-y: auto]
  padding: 28px 32px
```

### Role-Based Tab Visibility
Tabs rendered based on authenticated Supabase role. Never render tabs the user cannot access — not grayed out, simply not present.

| Role | Visible Tabs |
|---|---|
| `firm_admin` | Dashboard · Claims · Clients · Dispatch · Adjusters · Calendar · Billing · Settings |
| `examiner` | Dashboard · Claims · Billing |
| `dispatcher` | Dashboard · Claims · Dispatch · Calendar |
| `adjuster` | Dashboard · Claims · Calendar |
| `carrier` | Dashboard · Claims (read-only) |
| `super_admin` | All tabs + firm switcher |

---

## 5. Component Library

### Buttons

Three variants, two sizes.

```css
/* Base */
.btn {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  padding: 9px 16px;
  border-radius: var(--radius-md); /* 6px */
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Primary — for main actions */
.btn-primary {
  background: var(--sage);
  color: #06120C;
  box-shadow: 0 2px 8px rgba(91, 194, 115, 0.25);
}
.btn-primary:hover {
  background: var(--sage-light);
  box-shadow: 0 4px 14px rgba(91, 194, 115, 0.40);
  transform: translateY(-1px);
}
.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(91, 194, 115, 0.25);
}

/* Ghost — for secondary actions */
.btn-ghost {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
}
.btn-ghost:hover {
  border-color: var(--border-hi);
  color: var(--white);
  background: rgba(255, 255, 255, 0.04);
}

/* Danger — for destructive or warning overrides */
.btn-danger {
  background: var(--orange);
  color: #0A0A0A;
}
.btn-danger:hover {
  background: #F08C50;
}

/* Small variant */
.btn-sm {
  padding: 6px 11px;
  font-size: 10px;
}
```

### Cards

```css
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl); /* 12px */
  padding: 18px 20px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
/* Subtle inner highlight for depth */
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%);
  pointer-events: none;
}
.card:hover {
  border-color: var(--border-hi);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}
```

### Stat Cards

```css
.stat-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 16px 18px;
  position: relative;
  overflow: hidden;
  transition: all 0.15s;
}
/* Colored left-edge accent — color set via CSS var per instance */
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 3px;
  background: var(--accent, var(--border-hi));
  border-radius: var(--radius-xl) 0 0 var(--radius-xl);
}
.stat-card:hover {
  border-color: var(--border-hi);
  background: var(--card-hi);
}
```

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 7px;
  border-radius: var(--radius-sm); /* 4px */
}

.badge-sage    { background: var(--sage-dim);   color: var(--sage);   border: 1px solid rgba(91,194,115,0.2); }
.badge-blue    { background: var(--blue-dim);   color: var(--blue);   border: 1px solid rgba(66,152,204,0.2); }
.badge-orange  { background: var(--orange-dim); color: var(--orange); border: 1px solid rgba(224,123,63,0.2); }
.badge-red     { background: var(--red-dim);    color: var(--red);    border: 1px solid rgba(224,92,92,0.2); }
.badge-bronze  { background: var(--bronze-dim); color: var(--bronze); border: 1px solid rgba(201,168,76,0.2); }
.badge-faint   { background: rgba(255,255,255,0.05); color: var(--muted); border: 1px solid var(--border); }

/* Large badge variant */
.badge-lg { font-size: 11px; padding: 5px 10px; }
```

### Status Pills (Claims Filter Bar)

```css
.pill {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 1px solid var(--border);
  color: var(--muted);
  background: transparent;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 5px;
}
.pill:hover {
  border-color: var(--border-hi);
  color: var(--white);
}
.pill.active {
  background: var(--sage-dim);
  border-color: rgba(91, 194, 115, 0.30);
  color: var(--sage);
}

/* SLA count dot on pill */
.sla-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 9px;
  font-weight: 800;
  background: var(--red);
  color: #fff;
}
.sla-dot.warning { background: var(--orange); }
```

### Tables

```css
.table-wrap {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
table { width: 100%; border-collapse: collapse; }

thead th {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  padding: 12px 14px;
  text-align: left;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background 0.10s;
  cursor: pointer;
}
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: rgba(91, 194, 115, 0.04); }

/* Left-edge sage accent on hover */
tbody tr:hover td:first-child {
  box-shadow: inset 3px 0 0 var(--sage);
}

tbody td {
  padding: 12px 14px;
  font-size: 13px;
  color: var(--white);
  vertical-align: middle;
}
```

### Form Inputs

```css
.form-input {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 9px 12px;
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  color: var(--white);
  outline: none;
  width: 100%;
  transition: border-color 0.15s, background 0.15s;
}
.form-input:focus {
  border-color: rgba(91, 194, 115, 0.5);
  background: rgba(91, 194, 115, 0.04);
}
.form-input::placeholder { color: var(--faint); }

.form-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 5px;
  display: block;
}
```

### Modals

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  background: var(--surface);
  border: 1px solid var(--border-hi);
  border-radius: var(--radius-xl);
  width: 520px;
  max-width: 92vw;
  overflow: hidden;
  animation: fadeUp 0.15s ease;
}
.modal-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
}
.modal-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800;
  font-size: 18px;
  letter-spacing: 0.04em;
  color: var(--white);
}
.modal-body { padding: 18px 24px; }
.modal-footer {
  padding: 14px 24px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Avatar / Initials Circle

```css
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800;
  font-size: 11px;
  flex-shrink: 0;
}
/* Usage: set background and color inline per person */
/* e.g. style="background: var(--sage-dim); color: var(--sage)" */
```

### Toggle Switch

```css
.toggle {
  width: 32px;
  height: 18px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--bg);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  flex-shrink: 0;
}
.toggle.on {
  background: var(--sage);
  border-color: var(--sage);
}
.toggle::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--muted);
  top: 2px;
  left: 2px;
  transition: all 0.2s;
}
.toggle.on::after {
  background: #fff;
  left: 16px;
}
```

---

## 6. Spacing System

Use a consistent spacing scale. Do not invent arbitrary values.

| Token | Value | Use |
|---|---|---|
| `4px` | Extra tight | Icon gaps, badge internal padding |
| `8px` | Tight | Component internal gaps |
| `12px` | Default | Grid gaps, section spacing |
| `16px` | Comfortable | Card padding, list item padding |
| `20px` | Spacious | Page section separation |
| `24px` | Content padding | Page content left/right padding |
| `28px` | Page padding | Page content top padding |
| `32px` | Page padding | Page content right padding |

---

## 7. Animations & Transitions

- **Transition duration:** `0.12s` for micro-interactions (hover, focus), `0.20s` for reveals (drawers, panels), `0.15s` for modals
- **Easing:** `ease` for all transitions
- **Page fade-in:** `opacity 0 → 1, translateY 6px → 0, duration 0.18s`
- **Modal:** `fadeUp` — opacity + translateY, `0.15s ease`
- **Drawers/panels:** `transform: translateX/Y`, `0.20s ease`
- Never add animations to badges, borders, or text color changes — transitions only on `background`, `border-color`, `box-shadow`, `transform`, `opacity`

---

## 8. Scrollbar

```css
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.10);
  border-radius: 3px;
}
```

---

## 9. Page-Specific Rules

### Dashboard — Daily Brief
- Not a claims list. A personalized morning briefing per role.
- Warm, conversational greeting: "Good morning, [Name]." with date and context subtitle.
- Stat cards use `--accent` CSS variable to set the left-edge color per card.
- Activity feed items: dot + action text + who + time. No bullet points.

### Claims Page
- Status filter pills with SLA count dots (red = overdue, orange = at risk).
- Table with left-edge hover accent. Click row to open Claim Detail.
- Due date: orange when ≤2 days, red when overdue.
- New Claim button: visible to `firm_admin` and `dispatcher` only.

### Claim Detail
- Milestone bar always visible below the claim header — shows full lifecycle at a glance.
- 14 tabs: Overview, Notes, Documents, Inspection, Time & Expense, Tasks, Reserves, Claimants, Coverages, Loss Locations, Carrier Forms, Firm Forms, Links, Timeline.
- Overview tab has a customizable card grid (toggle on/off via slide-out panel).
- Notes: two-tier (Internal = firm only, Shared = adjuster can see). Compose box with tab toggle between note types.
- Adjuster milestone actions (Accept, First Contact, Inspection Scheduled, Inspection Complete) pre-fill a note template that the adjuster edits before saving.

### Dispatch
- Three-panel: unassigned claims list (left), Mapbox map (center), adjuster roster (right).
- Lasso tool: freehand polygon draw (not rectangle). Click to place points, double-click to close.
- Lasso pre-filters popover opens before drawing — filters which claims are grabbable.
- Adjuster capability profiles enforced — mismatch = warn + require typed override reason (not a hard block).

### Calendar
- Three-section: needs-scheduling queue (left), full-month calendar (center), Mapbox route map (right, toggleable).
- Weather icons per day based on claim location (switches to claim location on hover).
- Drag claim from queue onto calendar day to pre-fill scheduling modal.
- Multiple home base locations (home + deployment hotels) for smart routing.

### Settings
- Includes: SLA threshold configuration per client, notification preferences, integrations (Xactware email intake), activity log toggle, firm profile, user profile, password reset.

---

## 10. Approved Wireframe References

The following HTML wireframe files are the approved design reference for their respective pages. Forge should reference these for layout, interaction patterns, and component placement. **Do not copy their CSS verbatim** — implement using Tailwind CSS while matching the visual output.

| Page | Wireframe File | Status |
|---|---|---|
| Dashboard (all roles) | `inspektiq-wireframe-v3.html` (partner) | Approved — use his card polish, our color tokens |
| Calendar / Schedule | `inspektiq-calendar.html` | Approved |
| Dispatch | `inspektiq-dispatch-v2.html` | Approved |
| Claim Detail | `inspektiq-claim-detail.html` | Approved |

---

## 11. Tech Stack

```
Framework:     Next.js 14 (App Router)
Language:      TypeScript — no `any` types
Styling:       Tailwind CSS — use CSS variables above via Tailwind config
Auth:          Supabase Auth with role-based access control
Database:      Supabase (PostgreSQL) — existing schema, do not modify tables
Maps:          Mapbox GL JS — Dispatch and Calendar
Deployment:    Vercel
Repo:          keystonesystem1/INSPEKTiQ
Live URL:      inspektiq.io
```

### Tailwind Config
Extend the default theme to include the design tokens:

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      bg:       '#0A0A0A',
      surface:  '#0F1923',
      card:     '#162130',
      'card-hi':'#1C2B3D',
      sage:     '#5BC273',
      'sage-light': '#6DD882',
      blue:     '#4298CC',
      orange:   '#E07B3F',
      red:      '#E05C5C',
      bronze:   '#C9A84C',
    },
    fontFamily: {
      condensed: ['Barlow Condensed', 'sans-serif'],
      body:      ['Barlow', 'sans-serif'],
      wordmark:  ['Orbitron', 'sans-serif'],
    },
    borderRadius: {
      sm: '4px',
      md: '6px',
      lg: '10px',
      xl: '12px',
    }
  }
}
```

---

## 12. What Forge Must NOT Do

- Do not use Inter, Roboto, Arial, or any system font
- Do not use light backgrounds — the entire app is dark
- Do not use a left sidebar for navigation — top nav only
- Do not hardcode color hex values — use CSS variables or Tailwind config tokens
- Do not use `any` TypeScript types
- Do not modify the Supabase schema or RLS policies without explicit instruction
- Do not use `#3DAA6A` for sage — the brand-locked value is `#5BC273`
- Do not add pages or routes not defined in this document or the build brief
- Do not render tabs the user's role cannot access

---

*Design System v1.0 — Keystone Stack LLC — INSPEKTiQ — Q2 2026*
