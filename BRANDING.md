# BRANDING.md — Rockland Visual Identity

Reference: https://getrockland.com

---

## Colors

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Navy | `#1B365D` | `rockland-navy` | Primary text, headers, nav |
| Navy Dark | `#0F2A4A` | `rockland-navy-dark` | Dark sections, footer |
| Teal | `#4A90A4` | `rockland-teal` | Logo accent, links, icons |
| Cream | `#F5F3EF` | `rockland-cream` | Page background |
| Green | `#2D6A4F` | `rockland-green` | Primary buttons, CTAs |
| White | `#FFFFFF` | `white` | Cards, content areas |
| Gray Light | `#E8E6E1` | `rockland-gray` | Borders, dividers |

### Semantic Usage

| Element | Color |
|---------|-------|
| Page background | Cream `#F5F3EF` |
| Card background | White `#FFFFFF` |
| Primary text | Navy `#1B365D` |
| Secondary text | Navy with opacity or gray |
| Primary button | Green `#2D6A4F` with white text |
| Links | Teal `#4A90A4` |
| Success/positive | Green `#2D6A4F` |
| Warning | Amber (keep existing) |
| Error | Red (keep existing) |
| High fit badge | Green `#2D6A4F` |
| Medium fit badge | Teal `#4A90A4` |
| Low fit badge | Gray `#6B7280` |

---

## Typography

| Element | Style |
|---------|-------|
| H1 Headlines | Serif font, large, navy — use italic for emphasis |
| H2-H3 Subheads | Sans-serif, navy, semibold |
| Body text | Sans-serif, navy, regular weight |
| Labels | Sans-serif, uppercase, small, tracking-wide, gray |
| Buttons | Sans-serif, semibold, white |

### Font Stack

```css
/* Headlines - add a serif option */
font-family: Georgia, 'Times New Roman', serif;

/* Body - keep system sans */
font-family: ui-sans-serif, system-ui, sans-serif;
```

---

## UI Components

### Buttons

```css
/* Primary CTA */
background: #2D6A4F;
color: white;
border-radius: 8px;
padding: 12px 24px;
font-weight: 600;

/* Pattern: Arrow suffix */
"Get in Touch →"
"Find Out How →"
```

### Cards

```css
background: white;
border: 1px solid #E8E6E1;
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0,0,0,0.05);
```

### Badges

```css
/* High fit */
background: #2D6A4F;
color: white;

/* Medium fit */
background: #4A90A4;
color: white;

/* Low fit */
background: #E8E6E1;
color: #1B365D;
```

### Header

```css
background: white;
border-bottom: 1px solid #E8E6E1;
```

---

## Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        rockland: {
          navy: '#1B365D',
          'navy-dark': '#0F2A4A',
          teal: '#4A90A4',
          cream: '#F5F3EF',
          green: '#2D6A4F',
          gray: '#E8E6E1',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
      }
    }
  }
}
```

---

## Logo

- Wordmark: "Rockland" 
- Icon: Medical cross/plus in teal before text
- For the prototype: Text-only "Rockland" with teal accent on "Grant Discovery"

---

## Voice & Copy Patterns

| Pattern | Example |
|---------|---------|
| Mission-driven | "Your mission is critical" |
| Outcome-focused | "Maximize every grant dollar" |
| Direct | "Built for FQHCs" |
| Arrow CTAs | "Save to Pipeline →" |
| Emphasis | *italic* for key words |

---

## Current App → Rockland Mapping

| Current | Change to |
|---------|-----------|
| `bg-gray-50` | `bg-rockland-cream` |
| `bg-blue-600` (buttons) | `bg-rockland-green` |
| `text-blue-600` (links) | `text-rockland-teal` |
| `bg-emerald-50` (fit card) | `bg-rockland-green/10` |
| `text-emerald-*` | `text-rockland-green` |
| `border-gray-200` | `border-rockland-gray` |
