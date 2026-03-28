function severityColor(sev = 0) {
  if (sev >= 8) return "#ef4444";
  if (sev >= 5) return "#f59e0b";
  return "#22c55e";
}

function relativeTime(ts) {
  if (!ts) return "just now";
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

export default function FeedCard({ event }) {
  return (
    <div className="card code">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <strong style={{ color: "#a855f7" }}>{event.phrase}</strong>
        <span className="badge" style={{ borderColor: severityColor(event.severity), color: severityColor(event.severity) }}>
          {event.severity}/10
        </span>
      </div>
      <div style={{ color: "#94a3b8", marginTop: 6 }}>{event.context}</div>
      {event.badAdvice ? <div className="advice">{event.badAdvice}</div> : null}
      <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", color: "#9ca3af" }}>
        <span>{relativeTime(event.timestamp)}</span>
        <span style={{ color: (event.auraModifier || 0) >= 0 ? "#00C389" : "#EF4444" }}>
          {(event.auraModifier || 0) >= 0 ? `+${event.auraModifier}` : event.auraModifier} aura
        </span>
      </div>
    </div>
  );
}
