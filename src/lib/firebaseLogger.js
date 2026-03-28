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
 * Uses a Delta-based transaction to ensure multi-tab/re-runs don't double-count.
 */
export async function upsertSession(sessionId, sessionPatch) {
  if (!hasFirebaseConfig || !db || !sessionId) return;

  const sessionRef = ref(db, `sessions/${sessionId}`);
  
  // 1. Calculate the change in aura for this specific session update
  const newAura = sessionPatch.finalAura ?? 0;
  const prevAura = sessionAuraCache.get(sessionId) ?? 0;
  const delta = newAura - prevAura;
  
  // Update cache immediately to prevent redundant calls and handle racing
  sessionAuraCache.set(sessionId, newAura);

  // 2. Update the session itself
  await update(sessionRef, sessionPatch);

  // 3. Update the global User Profile if we have a UID and score changed
  const { uid, displayName, photoURL } = sessionPatch;
  if (uid && delta !== 0) {
    const userRef = ref(db, `users/${uid}`);
    await runTransaction(userRef, (userData) => {
      if (!userData) {
        return {
          uid,
          displayName: displayName || "Anonymous",
          photoURL: photoURL || null,
          totalAura: delta,
          updatedAt: Date.now()
        };
      }
      return {
        ...userData,
        displayName: displayName || userData.displayName,
        photoURL: photoURL || userData.photoURL,
        totalAura: (userData.totalAura || 0) + delta,
        updatedAt: Date.now()
      };
    });
  }
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
