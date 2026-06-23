export function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "positive" | "negative" | "gold";
}) {
  const toneClass =
    tone === "positive"
      ? "text-[var(--accent)]"
      : tone === "negative"
        ? "text-[var(--danger)]"
        : tone === "gold"
          ? "text-[var(--gold)]"
          : "text-[var(--foreground)]";

  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">{label}</p>
      <p className={`text-2xl font-semibold font-mono ${toneClass}`}>{value}</p>
      {sub ? <p className="text-xs text-[var(--muted)] mt-2">{sub}</p> : null}
    </div>
  );
}
