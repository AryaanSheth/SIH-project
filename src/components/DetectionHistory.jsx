export default function DetectionHistory({ detections, onReplay }) {
  return (
    <aside className="panel history-panel">
      <h3 style={{ marginTop: 0 }}>DETECTION LOG</h3>
      {detections.length === 0 ? <div style={{ color: "#9ca3af" }}>No detections yet.</div> : null}
      {detections.map((det) => (
        <div className="card" key={det.id || det.timestamp}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>{det.phrase}</strong>
            <span className="badge">sev {det.severity}</span>
          </div>
          <div className="code" style={{ color: "#9ca3af", marginTop: 6 }}>{det.context}</div>
          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: det.auraModifier >= 0 ? "#00C389" : "#EF4444" }}>
              {det.auraModifier >= 0 ? `+${det.auraModifier}` : det.auraModifier} aura
            </span>
            <button type="button" onClick={() => onReplay(det)}>
              Replay
            </button>
          </div>
          {det.badAdvice ? <div className="advice">{det.badAdvice}</div> : null}
        </div>
      ))}
    </aside>
  );
}
