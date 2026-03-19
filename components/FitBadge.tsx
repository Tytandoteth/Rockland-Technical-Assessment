interface FitBadgeProps {
  label: "High" | "Medium" | "Low";
  score: number;
}

export default function FitBadge({ label, score }: FitBadgeProps) {
  const styles = {
    High: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Medium: "bg-amber-100 text-amber-800 border-amber-200",
    Low: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${styles[label]}`}
    >
      {label} Fit
      <span className="text-[10px] opacity-70">({score})</span>
    </span>
  );
}
