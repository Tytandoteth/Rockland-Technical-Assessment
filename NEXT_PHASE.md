# NEXT_PHASE.md — Fundamentals Polish

## Overview

Core features are complete. This phase focuses on robustness and edge-case handling to make the demo bulletproof.

**Time estimate:** 20-30 minutes

---

## Tasks

### 1. Pipeline Fallback Detail View (10 min)

**Problem:** When user clicks a pipeline item and that grant is no longer in the current API results, the detail panel shows an empty "Select a grant" state instead of the saved pipeline data.

**Solution:** Check if `selectedGrantId` matches a pipeline item when no grant is found in the current list. Show a fallback view with the pipeline item's saved data.

**File:** `app/page.tsx`

**Changes:**
1. Find `selectedPipelineItem` when `selectedGrant` is null
2. Render a fallback detail view showing:
   - Grant title (from pipeline)
   - Deadline (from pipeline, if saved)
   - Status (from pipeline)
   - Notice: "This grant is no longer in the current search results"
   - Link to view on Grants.gov if URL was saved

**Acceptance:**
- [ ] Click pipeline item → shows fallback view if grant not in list
- [ ] Fallback view shows title, deadline, status
- [ ] User understands why full details aren't available

---

### 2. Error Boundary (10 min)

**Problem:** If any component throws an unhandled error, the entire app crashes to a white screen. Bad demo experience.

**Solution:** Add a React error boundary component that catches errors and shows a friendly fallback UI with a retry button.

**Files:**
- Create `components/ErrorBoundary.tsx`
- Update `app/layout.tsx` to wrap children

**ErrorBoundary behavior:**
- Catches render errors in child components
- Shows: "Something went wrong" message
- Shows: "Reload" button that calls `window.location.reload()`
- Logs error to console for debugging

**Acceptance:**
- [ ] Error boundary component exists
- [ ] Wrapped around main content in layout
- [ ] Graceful fallback UI on error

---

### 3. Pipeline Item Store Grant URL (5 min)

**Problem:** Pipeline items don't store the grant URL, so the fallback view can't link to Grants.gov.

**Solution:** Add `grantUrl` to PipelineItem type and save it when adding to pipeline.

**Files:**
- `lib/types.ts` — add `grantUrl?: string` to PipelineItem
- `app/page.tsx` — include `grant.url` when saving to pipeline

**Acceptance:**
- [ ] PipelineItem type includes grantUrl
- [ ] URL saved when adding to pipeline
- [ ] Fallback view shows "View on Grants.gov" link if URL exists

---

## File Changes Summary

| File | Changes |
|------|---------|
| `lib/types.ts` | Add `grantUrl?: string` to PipelineItem |
| `app/page.tsx` | Add pipeline fallback detail view, save grantUrl |
| `components/ErrorBoundary.tsx` | Create new file |
| `app/layout.tsx` | Wrap children with ErrorBoundary |

---

## Definition of Done

- [ ] Pipeline item click shows data even when grant not in current list
- [ ] Error boundary catches crashes and shows friendly UI
- [ ] No white screen scenarios in demo
- [ ] All existing functionality still works
