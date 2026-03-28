import { get, limitToLast, onValue, orderByChild, push, query, ref, runTransaction, set, update } from "firebase/database";
import { db, hasFirebaseConfig } from "./firebaseConfig";

// Use a simple in-memory cache for session scores during the session life
// to accurately calculate deltas for the lifetime total.
const sessionAuraCache = new Map();

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

/**
 * Updates a session's stats and also manages the global user's cumulative aura.
 * Tracks session-specific contributions within the user node to prevent double-counting on refresh.
 */
export async function upsertSession(sessionId, sessionPatch) {
  if (!hasFirebaseConfig || !db || !sessionId) return;

  const sessionRef = ref(db, `sessions/${sessionId}`);
  const { uid, displayName, photoURL, finalAura, totalDetections } = sessionPatch;
  
  // 1. Update the session record itself
  await update(sessionRef, sessionPatch);

  // 2. Update the global User Profile if we have a UID
  if (uid) {
    const userRef = ref(db, `users/${uid}`);
    const newAura = Number(finalAura ?? 0);
    const newDets = Number(totalDetections ?? 0);
    const newSentiment = Number(sessionPatch.sentiment?.score ?? 0);

    await runTransaction(userRef, (userData) => {
      if (!userData) {
        return {
          uid,
          displayName: displayName || "Anonymous",
          photoURL: photoURL || null,
          totalAura: newAura,
          totalDetections: newDets,
          lastVibe: newSentiment,
          sessionStats: { [sessionId]: { aura: newAura, dets: newDets } },
          updatedAt: Date.now()
        };
      }

      const stats = userData.sessionStats || {};
      const lastSessionStats = stats[sessionId] || { aura: 0, dets: 0 };
      
      const auraDelta = newAura - Number(lastSessionStats.aura || 0);
      const detDelta = newDets - Number(lastSessionStats.dets || 0);

      return {
        ...userData,
        displayName: displayName || userData.displayName,
        photoURL: photoURL || userData.photoURL,
        totalAura: Number(userData.totalAura || 0) + auraDelta,
        totalDetections: Number(userData.totalDetections || 0) + detDelta,
        lastVibe: newSentiment,
        sessionStats: {
          ...stats,
          [sessionId]: { aura: newAura, dets: newDets }
        },
        updatedAt: Date.now()
      };
    });
  }
}

/**
 * Listens to a specific user's lifetime stats.
 */
export function subscribeToUserStats(uid, callback) {
  if (!hasFirebaseConfig || !db || !uid) {
    callback(null);
    return () => {};
  }
  const userRef = ref(db, `users/${uid}`);
  return onValue(userRef, (snapshot) => {
    callback(snapshot.val());
  });
}

// Top 10 users by totalAura (Sum of all sessions)
export function subscribeToLeaderboard(callback, limit = 10) {
  if (!hasFirebaseConfig || !db) {
    callback([]);
    return () => {};
  }

  const usersRef = query(
    ref(db, "users"),
    orderByChild("totalAura"),
    limitToLast(limit)
  );

  return onValue(usersRef, (snapshot) => {
    const raw = snapshot.val();
    const accounts = raw
      ? Object.entries(raw).map(([uid, value]) => ({ uid, ...value }))
      : [];
    // Sort descending by totalAura
    accounts.sort((a, b) => (b.totalAura || 0) - (a.totalAura || 0));
    callback(accounts);
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
