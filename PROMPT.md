# Build Prompt — Fundamentals Polish

Copy and paste this to Claude:

---

I need you to implement two robustness improvements. Read NEXT_PHASE.md for full context.

## Task 1: Pipeline Fallback Detail View

In `app/page.tsx`, when the user clicks a pipeline item but that grant is NOT in the current `grants` array:

1. Find the pipeline item: `const selectedPipelineItem = pipeline.find((p) => p.grantId === selectedGrantId);`

2. In the detail tab render section, after the check for `selectedGrant && selectedAssessment`, add an `else if` for `selectedPipelineItem`:

```tsx
) : selectedPipelineItem ? (
  <div className="space-y-4">
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
      <p className="text-sm text-amber-700">
        This grant is no longer in the current search results. Showing saved info.
      </p>
    </div>
    <h2 className="text-lg font-bold text-gray-900">{selectedPipelineItem.grantTitle}</h2>
    {selectedPipelineItem.grantDeadline && (
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
          Deadline
        </p>
        <p className="text-sm font-semibold text-gray-800">
          {new Date(selectedPipelineItem.grantDeadline).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    )}
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
        Pipeline Status
      </p>
      <p className="text-sm font-semibold text-gray-800">{selectedPipelineItem.status}</p>
    </div>
    {selectedPipelineItem.nextStep && (
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">Next Step</h3>
        <p className="text-sm text-blue-800">{selectedPipelineItem.nextStep}</p>
      </div>
    )}
    {selectedPipelineItem.grantUrl && (
      <a
        href={selectedPipelineItem.grantUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
      >
        View on Grants.gov
      </a>
    )}
  </div>
) : (
  // existing empty state
)
```

3. Also update `lib/types.ts` — add to PipelineItem:
```typescript
grantUrl?: string;
```

4. In `handleSaveToPipeline`, add the URL:
```typescript
grantUrl: selectedGrant.url || undefined,
```

## Task 2: Error Boundary

Create `components/ErrorBoundary.tsx`:

```tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              An unexpected error occurred. Please reload the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Then update `app/layout.tsx` to wrap the children:

```tsx
import ErrorBoundary from "@/components/ErrorBoundary";

// In the return:
<body>
  <ErrorBoundary>
    {children}
  </ErrorBoundary>
</body>
```

## Verification

After implementing:
1. Save a grant to pipeline
2. Refresh the page (grants might change)
3. Click the pipeline item — should show fallback view if grant not in list
4. Error boundary is in place for any crashes

Commit message: `fix: add pipeline fallback view and error boundary`
