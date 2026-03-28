import { limitToLast, onValue, orderByChild, push, query, ref, set } from "firebase/database";
import { db, hasFirebaseConfig } from "./firebaseConfig";

export async function logDetection(event) {
  if (!hasFirebaseConfig || !db) return null;
  const detectionsRef = ref(db, "detections");
  const entryRef = push(detectionsRef);
  await set(entryRef, {
    ...event,
    timestamp: event.timestamp ?? Date.now()
  });
  return entryRef.key;
}

export async function upsertSession(sessionId, sessionPatch) {
  if (!hasFirebaseConfig || !db || !sessionId) return;
  await set(ref(db, `sessions/${sessionId}`), {
    sessionId,
    ...sessionPatch
  });
}

// Top 10 sessions by finalAura — used for the leaderboard
export function subscribeToLeaderboard(callback, limit = 10) {
  if (!hasFirebaseConfig || !db) {
    callback([]);
    return () => {};
  }

  const sessionsRef = query(
    ref(db, "sessions"),
    orderByChild("finalAura"),
    limitToLast(limit)
  );

  return onValue(sessionsRef, (snapshot) => {
    const raw = snapshot.val();
    const sessions = raw
      ? Object.entries(raw).map(([id, value]) => ({ id, ...value }))
      : [];
    sessions.sort((a, b) => (b.finalAura || 0) - (a.finalAura || 0));
    callback(sessions);
  });
}

export function subscribeToDetections(callback, limit = 50) {
  if (!hasFirebaseConfig || !db) {
    callback([]);
    return () => {};
  }

  const detectionsRef = query(
    ref(db, "detections"),
    orderByChild("timestamp"),
    limitToLast(limit)
  );

  return onValue(detectionsRef, (snapshot) => {
    const raw = snapshot.val();
    const events = raw
      ? Object.entries(raw).map(([id, value]) => ({ id, ...value }))
      : [];
    events.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    callback(events);
  });
}
