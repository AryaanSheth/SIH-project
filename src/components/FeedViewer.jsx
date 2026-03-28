import { useEffect, useMemo, useState } from "react";
import FeedCard from "./FeedCard";
import { subscribeToDetections } from "../lib/firebaseLogger";

export default function FeedViewer() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const unsub = subscribeToDetections(setEvents, 50);
    return () => unsub?.();
  }, []);

  const aura = useMemo(
    () => events.reduce((sum, e) => sum + Number(e.auraModifier || 0), 0),
    [events]
  );

  return (
    <main className="app-shell">
      <header className="panel header">
        <div className="brand">BRAINROT FEED (LIVE)</div>
        <div>AURA: {aura}</div>
      </header>
      <section className="panel feed-panel">
        {events.length === 0 ? <div style={{ color: "#9ca3af" }}>No events yet. Start listening on main screen.</div> : null}
        {events.map((event) => (
          <FeedCard event={event} key={event.id || event.timestamp} />
        ))}
      </section>
    </main>
  );
}
