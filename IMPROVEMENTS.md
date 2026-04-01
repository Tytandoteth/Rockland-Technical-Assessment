# IMPROVEMENTS.md — Future Enhancements

Identified during final QA pass. These are polish items that would improve the product with more time but don't block the core demo.

**Master view:** [VISION_AND_ROADMAP.md](./VISION_AND_ROADMAP.md) merges this backlog with product vision, key decisions, and assessment themes.

**Recently shipped:** Server-side drop for international/foreign noise (`shouldExcludeInternationalNoise`), client-side **re-score after `fetchOpportunity`** enrichment with `scoringSource: "enriched"`, list **Sort: Best fit / Deadline soon**, **agency abbreviations** + tooltips ([`lib/agencyDisplay.ts`](./lib/agencyDisplay.ts)), **Edit profile pre-fill** from saved profile + `currentGrants` / `biggestNeed` in localStorage, **pipeline notes** (blur-to-save) with notes shown in pipeline-only detail fallback.

---

## 🔴 High Priority

### 1. Scoring Threshold Calibration

**Issue:** All grants showing "Medium Fit" (45) or "Low Fit". No "High Fit" grants despite excellent matches like the CCBHC behavioral health grant ($94M, direct FQHC relevance).

**Impact:** Demo doesn't show the "green = pursue immediately" signal that would make the tool feel decisive.

**Root Cause:** Current scoring maxes around 45 points. Thresholds are:
- High: ≥60 (none hit this)
- Medium: 40-59
- Low: <40

**Proposed Fix:**
```typescript
// Option A: Lower thresholds
const FIT_THRESHOLDS = {
  high: 45,    // was 60
  medium: 25,  // was 40
};

// Option B: Boost relevant factors
// Add +15 for exact focus area match (behavioral health → behavioral health)
// Add +10 for SAMHSA/HRSA agency
// Add +10 for "FQHC" or "community health center" in grant text
```

**Time estimate:** 15 minutes

---

### 2. International Grant Filtering

**Issue:** Grants for Ukraine, India, Uganda, Botswana appearing in results. These are CDC Global Health Center grants — irrelevant to a Colorado FQHC.

**Impact:** Clutters the list with obviously wrong results. CFO would lose trust seeing these.

**Root Cause:** API returns CDC-GHC grants because "health center" keyword matches, and we don't filter by geography.

**Proposed Fix:**
```typescript
// In scoring.ts or normalize.ts
const INTERNATIONAL_KEYWORDS = [
  'ukraine', 'india', 'uganda', 'botswana', 'pepfar',
  'africa', 'asia', 'international', 'foreign'
];

function isInternationalGrant(grant: GrantOpportunity): boolean {
  const text = `${grant.title} ${grant.description}`.toLowerCase();
  return INTERNATIONAL_KEYWORDS.some(kw => text.includes(kw));
}

// Then filter or heavily penalize: score -= 50
```

**Time estimate:** 10 minutes

---

## 🟡 Medium Priority

### 3. Agency Name Truncation

**Issue:** "Substance Abuse and Mental Health Services Adminis" truncated in grant cards.

**Impact:** Minor cosmetic issue. User can still identify SAMHSA.

**Proposed Fix:** 
- Increase max character limit for agency display
- Or use abbreviations: "SAMHSA", "HRSA", "CDC"
- Or add tooltip on hover for full name

**Time estimate:** 5 minutes

---

### 4. Edit Profile Pre-fill

**Issue:** Clicking "Edit" returns to blank onboarding form instead of pre-filling current values.

**Impact:** Minor UX friction. User has to re-enter data.

**Proposed Fix:** Pass current profile to onboarding component, pre-fill form fields.

**Time estimate:** 10 minutes

---

### 5. Pipeline Item Notes

**Issue:** No way to add notes to saved pipeline items (e.g., "Waiting for CFO approval", "Need to check state eligibility").

**Impact:** Pipeline tracking is less useful without context.

**Proposed Fix:** Add optional "note" textarea in pipeline card, persist to localStorage.

**Time estimate:** 15 minutes

---

## 🟢 Nice to Have

### 6. Sort/Filter Controls

**Feature:** Let user sort by deadline, amount, or fit score. Filter by agency or fit level.

**Time estimate:** 20 minutes

---

### 7. Deadline Reminders

**Feature:** Visual callout for grants with deadlines in next 7/14/30 days. Optional email reminder integration.

**Time estimate:** 30 minutes

---

### 8. Grant Comparison View

**Feature:** Side-by-side comparison of 2-3 selected grants.

**Time estimate:** 45 minutes

---

### 9. SAM.gov Integration

**Feature:** Cross-reference with SAM.gov for:
- UEI verification (is org registered?)
- Exclusion/debarment check
- Contract opportunity matching

**Time estimate:** 1-2 hours (requires API key registration)

---

## Implementation Notes

If addressing in a future iteration:

1. **Start with #1 (scoring)** — highest demo impact
2. **Then #2 (international filter)** — quick data quality win
3. **#4 and #5** are good UX polish for real users
4. **#6-9** are feature expansion for v2

---

*Last updated: 2026-03-19*
