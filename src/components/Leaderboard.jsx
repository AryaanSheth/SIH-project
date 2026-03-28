import { useEffect, useState } from "react";
import { subscribeToLeaderboard } from "../lib/firebaseLogger";

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((data) => {
      setEntries(data);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  return (
    <div className="leaderboard panel">
      <h3 className="lb-title">🏆 AURA LEADERBOARD</h3>

      {entries.length === 0 ? (
        <p style={{ color: "var(--muted, #888)" }}>no sessions yet</p>
      ) : (
        <div className="lb-list">
          {entries.map((entry, index) => (
            <div className="lb-entry" key={entry.uid ?? index}>
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
                style={{ color: (entry.totalAura || 0) >= 0 ? "green" : "red" }}
              >
                {(entry.totalAura || 0) >= 0
                  ? `+${entry.totalAura || 0} aura`
                  : `${entry.totalAura || 0} aura`}
              </span>

              <span className="lb-detections" style={{ color: "var(--muted, #888)" }}>
                {entry.totalDetections || 0} detections
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

}
