import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeedCard from "./FeedCard";
import Leaderboard from "./Leaderboard";
import { subscribeToDetections, subscribeToUserStats } from "../lib/firebaseLogger";
import { useAuth } from "../lib/AuthContext";

export default function FeedViewer() {
  const [events, setEvents] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeToDetections(setEvents, 50);
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToUserStats(user.uid, (data) => {
      setUserStats(data);
    });
    return () => unsub?.();
  }, [user?.uid]);

  const aura = userStats?.totalAura ?? 0;

  return (
    <main className="app-shell">
      <header className="panel header">
        <div className="brand">BRAINROT FEED (LIVE)</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span>AURA: {aura}</span>
          <button onClick={() => navigate("/app")}>← Back to App</button>
        </div>
      </header>
      <div className="feed-layout">
        <section className="panel feed-panel">
          {events.length === 0 ? <div style={{ color: "#9ca3af" }}>No events yet. Start listening on main screen.</div> : null}
          {events.map((event) => (
            <FeedCard event={event} key={event.id || event.timestamp} />
          ))}
        </section>
        <Leaderboard />
      </div>
    </main>
  );
}
