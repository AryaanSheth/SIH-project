import { useEffect, useState } from "react";

export default function AuraCounter({ score }) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const color = score > 0 ? "#00C389" : score < 0 ? "#EF4444" : "#9CA3AF";

  return (
    <section className="panel aura">
      <div style={{ fontSize: "0.9rem", letterSpacing: "0.08em", color: "#9ca3af" }}>AURA</div>
      <div className={`aura-value ${flash ? "flash" : ""}`} style={{ color }}>
        {score}
      </div>
    </section>
  );
}
