interface FitBadgeProps {
  label: "High" | "Medium" | "Low";
  score: number;
}

export default function FitBadge({ label, score }: FitBadgeProps) {
  const styles = {
    High: "bg-rockland-green text-white border-rockland-green",
    Medium: "bg-rockland-teal text-white border-rockland-teal",
    Low: "bg-rockland-gray text-rockland-navy border-rockland-gray",
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
