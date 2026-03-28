import { useEffect, useState } from "react";

const COMBO_LABELS = { 2: "x1.5", 3: "x2", 4: "x3" };

export default function AuraCounter({ score, combo = 1 }) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const inDebt = score < 0;
  const color = score > 0 ? "#00C389" : inDebt ? "#EF4444" : "#9CA3AF";
  const comboLabel = COMBO_LABELS[Math.min(combo, 4)];

  return (
    <section className={`panel aura ${inDebt ? "aura-debt" : ""}`}>
      <div className="aura-header">
        <div style={{ fontSize: "0.9rem", letterSpacing: "0.08em", color: inDebt ? "#ef4444" : "#9ca3af" }}>
          {inDebt ? "💀 AURA DEBT" : "AURA"}
        </div>
        {combo >= 2 && (
          <div className="combo-badge">{comboLabel} COMBO 🔥</div>
        )}
      </div>
      <div className={`aura-value ${flash ? "flash" : ""}`} style={{ color }}>
        {score}
      </div>
      {inDebt && <div className="debt-label">ur in debt bestie</div>}
    </section>
  );
}
