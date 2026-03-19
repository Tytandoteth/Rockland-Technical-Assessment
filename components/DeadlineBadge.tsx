interface DeadlineBadgeProps {
  deadline: string;
}

function daysUntil(deadline: string): number | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDate(deadline: string): string {
  if (!deadline) return "No deadline";
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return deadline;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DeadlineBadge({ deadline }: DeadlineBadgeProps) {
  const days = daysUntil(deadline);

  if (days === null) {
    return (
      <span className="text-xs text-gray-400">No deadline listed</span>
    );
  }

  if (days < 0) {
    return (
      <span className="text-xs text-gray-400 line-through">
        {formatDate(deadline)} (closed)
      </span>
    );
  }

  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        {formatDate(deadline)} ({days}d left)
      </span>
    );
  }

  if (days <= 30) {
    return (
      <span className="text-xs font-medium text-amber-700">
        {formatDate(deadline)} ({days}d left)
      </span>
    );
  }

  return (
    <span className="text-xs text-gray-500">{formatDate(deadline)}</span>
  );
}
