const LAST_VISIT_KEY = "rockland-last-visit";
const SEEN_GRANTS_KEY = "rockland-seen-grants";

export function getLastVisitTimestamp(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(LAST_VISIT_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

export function getSeenGrantIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_GRANTS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function markVisitAndGrants(grantIds: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
  localStorage.setItem(SEEN_GRANTS_KEY, JSON.stringify(grantIds));
}
