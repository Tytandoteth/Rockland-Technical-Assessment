# FIXES.md — Security & Optimization Checklist

Generated: 2026-03-19 14:40 MYT

---

## 🔴 Must Fix (Rubric Gaps)

### 1. Add `/api/summarize` Route
**Location:** `app/api/summarize/route.ts` (create new)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { GrantOpportunity, ClinicProfile } from "@/lib/types";

export async function POST(request: NextRequest) {
  const { grant, profile } = await request.json() as {
    grant: GrantOpportunity;
    profile: ClinicProfile;
  };

  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      summary: null,
      fallback: true,
      message: "AI summary unavailable — using heuristic assessment",
    });
  }

  try {
    const prompt = `You are a grant advisor for FQHC clinics. Given this grant:

Title: ${grant.title}
Agency: ${grant.agency}
Amount: ${grant.amountMin ? `$${grant.amountMin.toLocaleString()}` : "Not specified"} - ${grant.amountMax ? `$${grant.amountMax.toLocaleString()}` : "Not specified"}
Deadline: ${grant.deadline || "Not specified"}
Description: ${grant.summary || "No description available"}

Clinic Profile:
- Name: ${profile.clinicName}
- Type: ${profile.clinicType}
- Focus Areas: ${profile.focusAreas.join(", ")}

In 2-3 sentences, explain:
1. Why this grant fits (or doesn't fit) this FQHC
2. Key eligibility considerations
3. Your recommendation: pursue, skip, or investigate further

Be direct. CFO has 10 minutes.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error("OpenAI API error");

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || null;

    return NextResponse.json({ summary, fallback: false });
  } catch (error) {
    console.error("AI summary failed:", error);
    return NextResponse.json({
      summary: null,
      fallback: true,
      message: "AI summary timed out — using heuristic assessment",
    });
  }
}
```

---

### 2. Integrate AI Summary in GrantDetail
**Location:** `components/GrantDetail.tsx`

Add state and fetch:
```typescript
const [aiSummary, setAiSummary] = useState<string | null>(null);
const [aiLoading, setAiLoading] = useState(false);

useEffect(() => {
  async function fetchSummary() {
    setAiLoading(true);
    setAiSummary(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grant, profile: DEFAULT_CLINIC_PROFILE }),
      });
      const data = await res.json();
      if (!data.fallback && data.summary) {
        setAiSummary(data.summary);
      }
    } catch {
      // Silently fall back to heuristic
    } finally {
      setAiLoading(false);
    }
  }
  fetchSummary();
}, [grant.id]);
```

Add UI section (after "Why This Fits"):
```tsx
{/* AI Second Opinion */}
{(aiLoading || aiSummary) && (
  <div className="bg-violet-50 border border-violet-100 rounded-lg p-4">
    <h3 className="text-sm font-semibold text-violet-900 mb-2">
      AI Second Opinion
    </h3>
    {aiLoading ? (
      <p className="text-sm text-violet-600 animate-pulse">Analyzing...</p>
    ) : (
      <p className="text-sm text-violet-800">{aiSummary}</p>
    )}
  </div>
)}
```

---

### 3. Add Refresh Button
**Location:** `app/page.tsx`

Add refetch function:
```typescript
const fetchGrants = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    const res = await fetch("/api/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });
    if (!res.ok) throw new Error("Failed to fetch grants");
    const data: GrantsApiResponse = await res.json();
    setGrants(data.grants);
    setAssessments(data.assessments);
    setSource(data.source);
    if (data.grants.length > 0 && !selectedGrantId) {
      setSelectedGrantId(data.grants[0].id);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load grants");
  } finally {
    setIsLoading(false);
  }
}, [profile, selectedGrantId]);
```

Add button in header:
```tsx
<button
  onClick={fetchGrants}
  disabled={isLoading}
  className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
>
  {isLoading ? "Loading..." : "Refresh"}
</button>
```

---

### 4. Store Deadline in Pipeline Items
**Location:** `lib/types.ts`

```typescript
export interface PipelineItem {
  id: string;
  grantId: string;
  grantTitle: string;
  deadline?: string;  // ADD THIS
  status: "To Review" | "Interested" | "Applying" | "Submitted";
  nextStep?: string;
  note?: string;
  savedAt: string;
}
```

**Location:** `app/page.tsx` (handleSaveToPipeline)

```typescript
const item: PipelineItem = {
  id: `pipeline-${Date.now()}`,
  grantId: selectedGrant.id,
  grantTitle: selectedGrant.title,
  deadline: selectedGrant.deadline,  // ADD THIS
  status: "To Review",
  nextStep: selectedAssessment.recommendedAction,
  savedAt: new Date().toISOString(),
};
```

---

### 5. Pipeline Fallback Detail View
**Location:** `app/page.tsx`

When grant not in current list, show pipeline data:
```typescript
const selectedGrant = grants.find((g) => g.id === selectedGrantId) || null;
const selectedPipelineItem = pipeline.find((p) => p.grantId === selectedGrantId);

// In the detail tab render:
{activeTab === "detail" ? (
  selectedGrant && selectedAssessment ? (
    <GrantDetail ... />
  ) : selectedPipelineItem ? (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">{selectedPipelineItem.grantTitle}</h2>
      <p className="text-sm text-gray-500">
        This grant is no longer in the current search results.
      </p>
      {selectedPipelineItem.deadline && (
        <p className="text-sm text-gray-600">
          Deadline: {new Date(selectedPipelineItem.deadline).toLocaleDateString()}
        </p>
      )}
      <p className="text-sm text-gray-600">
        Status: {selectedPipelineItem.status}
      </p>
    </div>
  ) : (
    <div className="flex items-center justify-center h-[400px] text-gray-400">
      ...empty state...
    </div>
  )
) : ( ... )}
```

---

## 🟡 Should Fix (Robustness)

### 6. Add Retry Logic to Grants API
**Location:** `app/api/grants/route.ts`

```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (i === retries) throw new Error(`API returned ${response.status}`);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // Backoff
    }
  }
  throw new Error("Retry exhausted");
}
```

---

### 7. localStorage Write Error Handling
**Location:** `lib/pipeline.ts`

```typescript
export function saveToPipeline(item: PipelineItem): PipelineItem[] {
  const pipeline = getPipeline();
  if (pipeline.some((p) => p.grantId === item.grantId)) {
    return pipeline;
  }
  const updated = [...pipeline, item];
  try {
    localStorage.setItem(PIPELINE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save pipeline:", e);
    // Could show toast notification
  }
  return updated;
}
```

---

## 🟢 Nice to Have (Polish)

### 8. Urgency Sort Toggle
Add button to sort grants by deadline urgency (closest first).

### 9. Memoize GrantCard
Wrap GrantCard in `React.memo` to prevent re-renders on selection change.

### 10. Show Pipeline Deadline Badges
In `components/Pipeline.tsx`, show DeadlineBadge for items with deadline.

---

## 📝 Doc Updates Required

### README.md
Add:
```markdown
## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Optional | Enables AI summary feature. Falls back to heuristic if not set. |
```

### KEY_DECISIONS.md
Add decision about hybrid heuristic + AI approach.

### AI_REFLECTION.md
Update with final examples.

---

## ✅ Acceptance Checklist

- [ ] `/api/summarize` route exists and returns graceful fallback
- [ ] AI summary appears in GrantDetail (or loading state)
- [ ] Refresh button works
- [ ] Pipeline items store deadline
- [ ] Pipeline item detail view works even when grant not in current list
- [ ] README documents OPENAI_API_KEY
- [ ] All required docs updated

---

*Review as commits land. Flag any regressions.*
