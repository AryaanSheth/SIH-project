import { useEffect, useState } from "react";
import { subscribeToLeaderboard } from "../lib/firebaseLogger";
import { useAuth } from "../lib/AuthContext";

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const { user, signIn } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((data) => {
      setEntries(data);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const getVibeLabel = (score) => {
    if (score > 0.5) return "SIGMA VIBES";
    if (score > 0.1) return "POSITIVE AURA";
    if (score < -0.5) return "BRAINROT CRISIS";
    if (score < -0.1) return "NEGATIVE AURA";
    return "MID VIBES";
  };

  return (
    <div className="leaderboard panel">
      <h3 className="lb-title">🏆 AURA LEADERBOARD</h3>

      {!user && (
        <div style={{ marginBottom: 14, fontSize: "0.75rem", background: "#f59e0b22", padding: 8, border: "1px dashed #f59e0b", color: "#f59e0b" }}>
          You're Anonymous! <button onClick={signIn} className="hp-btn-sm" style={{ padding: "2px 6px", fontSize: "0.7rem", marginLeft: 4 }}>Sign in</button> to join the leaderboard.
        </div>
      )}

      {entries.length === 0 ? (
        <p style={{ color: "var(--muted, #888)" }}>no users documented yet</p>
      ) : (
        <div className="lb-list">
          {entries.map((entry, index) => (
            <div className="lb-entry" key={entry.uid ?? index} style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                <span className="lb-rank">#{index + 1}</span>

                <div className="lb-user">
                  {entry.photoURL && (
                    <img
                      className="lb-avatar"
                      src={entry.photoURL}
                      alt={entry.displayName || "Anonymous"}
                    />
                  )}
                  <span className="lb-name">
                    {entry.displayName || "Anonymous"}
                  </span>
                </div>

                <span
                  className="lb-score"
                  style={{ color: (entry.totalAura || 0) >= 0 ? "var(--green)" : "var(--red)" }}
                >
                  {(entry.totalAura || 0) >= 0
                    ? `+${entry.totalAura || 0}`
                    : `${entry.totalAura || 0}`}
                </span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", paddingLeft: 30, fontSize: "0.7rem" }}>
                <span style={{ color: "var(--muted)" }}>{entry.totalDetections || 0} dets</span>
                {entry.lastVibe !== undefined && (
                  <span style={{ 
                    color: entry.lastVibe > 0 ? "var(--green)" : entry.lastVibe < 0 ? "var(--red)" : "var(--purple)",
                    fontWeight: 800,
                    letterSpacing: "0.02em"
                  }}>
                    {getVibeLabel(entry.lastVibe)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

}
