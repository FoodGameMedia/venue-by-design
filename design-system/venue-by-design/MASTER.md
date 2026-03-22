# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Venue by Design
**Source:** UI/UX Pro Max + CLAUDE.md (Sprint colour scheme)
**Category:** Hotel/Hospitality · Operator Dashboard

---

## Global Rules

### Color Palette (CLAUDE.md — Sprint 4)

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary (Terra) | `#B9704B` | `--color-primary` |
| Primary Hover | `#A3603B` | — |
| Dark (Text) | `#1A1A1A` | `--color-foreground` |
| Cream (Background) | `#F2EBE2` | `--color-background` |
| Slate (Muted) | `#3C3F43` | `--color-muted-foreground` |

**Notes:** Warm, non-enterprise. For exhausted operators at 11pm.

### Typography (UI/UX Pro Max — Hospitality)

- **Heading Font:** Playfair Display SC
- **Body Font:** Karla
- **Mood:** restaurant, menu, culinary, elegant, foodie, hospitality
- **Google Fonts:** [Playfair Display SC + Karla](https://fonts.google.com/share?selection.family=Karla:wght@300;400;500;600;700|Playfair+Display+SC:wght@400;700)

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps |
| `--space-sm` | `8px` | Icon gaps |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Section padding |
| `--space-xl` | `32px` | Large gaps |

### Effects & Transitions

- Transitions: `150–300ms` for hover/focus
- No layout-shifting hovers (avoid scale that shifts layout)
- `prefers-reduced-motion` respected

---

## Anti-Patterns (Do NOT Use)

- ❌ Emojis as icons — Use Lucide/Heroicons
- ❌ Missing `cursor-pointer` on clickable elements
- ❌ Layout-shifting hovers
- ❌ Low contrast text — 4.5:1 minimum
- ❌ Instant state changes — use transitions
- ❌ Invisible focus states

---

## Pre-Delivery Checklist

- [ ] No emojis as icons
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms)
- [ ] Text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
