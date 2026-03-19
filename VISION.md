# VISION.md — Grant Discovery Platform

The full product vision beyond the MVP demo.

---

## Current State (MVP)

What we built:
- Grant discovery via Grants.gov API
- Fit scoring based on org profile
- AI-powered grant summaries
- Pipeline tracking with status management
- Enriched grant details

---

## Phase 2: Grant CRM

**Problem:** Once a grant is saved, there's no structured way to track application progress or capture data from the application process.

**Solution:** Full grant CRM with:

| Feature | Description |
|---------|-------------|
| Application data capture | Store info entered during applications |
| Status workflow | Applied → Under Review → Approved/Rejected |
| Document storage | Attach submitted materials, correspondence |
| Timeline view | When applied, expected response date, deadlines |
| Notes & activity log | Track conversations, decisions, blockers |

**Value:** Single source of truth for all grant activity across the organization.

---

## Phase 3: Automated Application Submission

**Problem:** Manually filling out grant applications is repetitive and time-consuming. Many forms ask for the same information.

**Solution:** Browser automation via OpenClaw + Browser Relay

```
User clicks "Auto-Apply"
    ↓
OpenClaw agent launches browser session
    ↓
Fills form fields from org profile + grant requirements
    ↓
User reviews pre-filled form
    ↓
Submit or edit as needed
```

**Scale potential:** Run 10-20 parallel agents for bulk application submission during deadline crunches.

**Technical approach:**
- OpenClaw browser relay for click/fill automation
- Form field mapping per grant portal
- Human-in-the-loop review before final submit
- Screenshot capture for audit trail

---

## Phase 4: Email → PDF Pipeline

**Problem:** Grant confirmations, updates, and requirements come via email. This information is scattered and hard to track.

**Solution:** Automated email processing

```
Grant email arrives
    ↓
AI extracts key information:
  - Confirmation numbers
  - Deadlines
  - Required actions
  - Milestone details
    ↓
Generate PDF summary (via ai-pdf-builder)
    ↓
Update grant record in CRM
    ↓
Create milestone tasks
```

**Deliverable:** Clean PDF for each grant with all relevant details — ready for CFO review or board reporting.

---

## Phase 5: Milestone Task Board

**Problem:** Grants have complex milestone requirements. Missing deadlines = lost funding.

**Solution:** Kanban-style milestone tracker

| Column | Purpose |
|--------|---------|
| Upcoming | Milestones not yet started |
| In Progress | Currently being worked on |
| Pending Review | Waiting for approval/sign-off |
| Completed | Done and documented |
| Blocked | Needs attention |

**Features:**
- Auto-populated from grant requirements
- Due date alerts (7-day, 3-day, 1-day)
- Assignee tracking
- Document attachment per milestone
- Progress reporting for compliance

---

## Phase 6: Multi-Clinic Support

**Problem:** Health systems with multiple FQHCs need centralized grant management.

**Solution:** Organization hierarchy

```
Health System (parent)
├── Clinic A (child org)
├── Clinic B (child org)
└── Clinic C (child org)
```

**Features:**
- Shared grant discovery across system
- Per-clinic eligibility filtering
- Consolidated reporting
- Role-based access (system admin, clinic admin, staff)

---

## Monetization

### SaaS Model

| Tier | Price | Features |
|------|-------|----------|
| Starter | $99/mo | Discovery + Pipeline (1 user) |
| Professional | $299/mo | + CRM + Email integration (5 users) |
| Enterprise | $999/mo | + Auto-apply + Multi-clinic + API |

### Value Proposition

> "Stop leaving money on the table. Discover grants you qualify for, auto-apply at scale, and never miss a milestone deadline."

**ROI pitch:** One successful grant application ($50K-$500K) pays for years of subscription.

---

## Rockland Integration

### Branding Opportunities

- "Powered by Rockland" footer on all pages
- "Rockland Grant Intelligence" product name
- White-label option for enterprise clients

### Lead Generation

- Free tier with upgrade prompts
- "Talk to Rockland" CTAs for complex grants
- Consulting upsell for application review

### Data Play

- Aggregate grant success rates by category
- Benchmark clinic grant performance
- Industry insights reporting

---

## Technical Roadmap

| Phase | Timeline | Key Tech |
|-------|----------|----------|
| Phase 2: CRM | 2-3 weeks | Postgres, Prisma, file storage |
| Phase 3: Auto-Apply | 4-6 weeks | OpenClaw Browser Relay, form mapping |
| Phase 4: Email Pipeline | 2-3 weeks | Email parsing, ai-pdf-builder |
| Phase 5: Milestones | 2-3 weeks | Task system, notifications |
| Phase 6: Multi-Clinic | 4-6 weeks | Auth, org hierarchy, RBAC |

**Total to full product:** 3-4 months with focused development.

---

## Competitive Moat

1. **AI-native from day one** — not bolted on
2. **Automation-first** — reduce manual work, not just organize it
3. **FQHC-specific** — deep understanding of healthcare grant landscape
4. **Integration-ready** — connects to existing EHR/PM systems

---

*This is the product. Not just discovery — the full grant lifecycle.*
