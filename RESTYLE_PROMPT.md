# Restyle Prompt — Match Rockland Branding

Copy and paste this to Claude:

---

Restyle the app to match Rockland's brand identity. Read BRANDING.md for the full spec.

## 1. Update Tailwind Config

In `tailwind.config.ts`, add the Rockland color palette:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
    },
  },
  plugins: [],
};

export default config;
```

## 2. Update Layout Background

In `app/layout.tsx`, change body class:
- FROM: `className="min-h-full flex flex-col"`
- TO: `className="min-h-full flex flex-col bg-rockland-cream"`

## 3. Update Page Styles

In `app/page.tsx`:

### Background
- Change `bg-gray-50` → `bg-rockland-cream`

### Header
- Keep `bg-white` but change accent text:
- `text-blue-600` → `text-rockland-teal`

### Primary Buttons
- Change `bg-blue-600 hover:bg-blue-700` → `bg-rockland-green hover:bg-rockland-green/90`

### Section Headers
- Change `text-gray-700` → `text-rockland-navy`

## 4. Update Component Styles

### FitBadge.tsx
```tsx
const colors = {
  High: "bg-rockland-green text-white",
  Medium: "bg-rockland-teal text-white", 
  Low: "bg-rockland-gray text-rockland-navy",
};
```

### GrantDetail.tsx

**"Why This Fits" section:**
- Change `bg-emerald-50 border-emerald-100` → `bg-rockland-green/10 border-rockland-green/20`
- Change `text-emerald-900` → `text-rockland-green`
- Change `text-emerald-800` → `text-rockland-navy`

**"Quick Take" section:**
- Change `bg-violet-50 border-violet-100` → `bg-rockland-teal/10 border-rockland-teal/20`
- Change `text-violet-*` → `text-rockland-teal` and `text-rockland-navy`

**"Recommended Next Step" section:**
- Change `bg-blue-50 border-blue-100` → `bg-rockland-navy/5 border-rockland-navy/10`
- Change `text-blue-900` → `text-rockland-navy`

**Save to Pipeline button:**
- Change `bg-blue-600 hover:bg-blue-700` → `bg-rockland-green hover:bg-rockland-green/90`

**Add arrow to button text:**
- Change "Save to Pipeline" → "Save to Pipeline →"

### GrantCard.tsx
- Update selected state border: `border-blue-500` → `border-rockland-teal`
- Update "In pipeline" badge if present

### Pipeline.tsx
Status button colors:
```tsx
const STATUS_COLORS: Record<PipelineItem["status"], string> = {
  "To Review": "bg-rockland-gray text-rockland-navy border-rockland-gray",
  Interested: "bg-rockland-teal/20 text-rockland-teal border-rockland-teal/30",
  Applying: "bg-rockland-navy/10 text-rockland-navy border-rockland-navy/20",
  Submitted: "bg-rockland-green/20 text-rockland-green border-rockland-green/30",
};
```

### DeadlineBadge.tsx
- Keep red for urgent deadlines (< 7 days) — this is semantic, not brand
- Change amber to teal for medium urgency if desired

## 5. Update Global Styles

In `app/globals.css`, if you have any hardcoded colors, update them.

## 6. Verification

After changes:
- Background should be cream (#F5F3EF)
- Primary buttons should be green (#2D6A4F)
- Links and accents should be teal (#4A90A4)
- Text should be navy (#1B365D)
- Cards should be white with light borders

Commit message: `style: apply Rockland brand colors and typography`
