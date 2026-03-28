# Changelog — Rizz-istential Crisis

## Code & Structure Evaluation (2026-03-28)

Evaluation performed against `prd.md` (Technical PRD). Issues are grouped by severity.

---

## Critical Bugs

### BUG-001 — `/public` directory missing; all media assets are 404

**Files affected:** `triggers.json`, `triggers2016.json`, `src/lib/mediaPlayer.js`, `src/components/MediaOverlay.jsx`

All trigger entries reference media at `/assets/sounds/*.mp3` and `/assets/gifs/*.gif` (e.g. `"/assets/sounds/skibidi.mp3"`). Vite serves static files from the `/public` directory, but **no `/public` directory exists in the repo**. The actual media files live in `/brainrot-research/sounds/` and `/brainrot-research/visuals/`, which are not a Vite static root.

**Impact:** Every detection fires the overlay and screen-shake animation, but no GIF renders and no sound plays. The `MediaPlayer` pre-caches silent `Audio` elements. `MediaOverlay` receives a valid `media.gif` path that resolves to a 404.

**Fix:** Create `public/assets/sounds/` and `public/assets/gifs/`, copy the files from `brainrot-research/` into them, and rename files to match the kebab-case IDs in the trigger dictionary (e.g. `hawk-tuah.mp3`, `no-cap.gif`).

---

### BUG-002 — Stale closure in `SpeechListener` callback corrupts aura accumulation

**Files affected:** `src/components/MainApp.jsx` (lines 116–141, 50–104)

`startListening()` creates the `SpeechListener` once (`if (!speechRef.current)`) and passes `handleFinalTranscript` as the `onFinal` callback at that moment. `handleFinalTranscript` → `handleDetection` closes over React state: `auraScore`, `detections`, `sessionId`, `startedAt`. Because `SpeechListener` holds the captured-at-creation function reference, every subsequent speech event invokes the version from the **first render**, reading those state values as stale.

**Observed effect:** `applyAuraModifier(auraScore, trigger.auraModifier)` always starts from `0` (the initial value). Each detection sets the displayed aura to its own individual `auraModifier` rather than a running total. After two detections the counter resets to whatever the second detection's modifier is.

**Fix options (pick one):**

Option A — Use a stable callback ref:
```js
// in MainApp.jsx
const handleFinalRef = useRef();
handleFinalRef.current = handleFinalTranscript;

// SpeechListener wrapper:
speechRef.current = new SpeechListener({
  onFinal: (...args) => handleFinalRef.current?.(...args),
  ...
});
```

Option B — Use functional state updates so `handleDetection` never reads `auraScore` from closure:
```js
setAuraScore(prev => {
  const next = applyAuraModifier(prev, trigger.auraModifier);
  // pass `next` downstream via a ref rather than state
  return next;
});
```

---

## Code Bugs

### BUG-003 — Duplicate trigger phrases cause spurious `rizz` cooldown

**Files affected:** `src/data/triggers.json`

The `rizz` trigger declares `phrases: ["rizz", "w rizz", "l rizz"]`. Two standalone triggers, `w-rizz` and `l-rizz`, also declare `phrases: ["w rizz"]` and `phrases: ["l rizz"]` respectively.

When the user says "w rizz", `BrainrotDetector.detect()` iterates all triggers and matches **both** `rizz` (via substring "w rizz") and `w-rizz`. The 5-second cooldown is set on both `rizz.id` and `w-rizz.id`. The correct trigger fires (highest severity `w-rizz` wins), but `rizz` is now locked out for 5 seconds — blocking a plain "rizz" utterance that follows immediately.

**Fix:** Remove `"w rizz"` and `"l rizz"` from the `rizz` trigger's `phrases` array. The dedicated triggers cover those variants.

```json
// triggers.json — rizz entry
{ "id": "rizz", "phrases": ["rizz"], ... }
```

---

### BUG-004 — Detection events don't store `triggerId`; replay path reconstruction is fragile

**Files affected:** `src/components/MainApp.jsx` (lines 79–90, 189–201)

The detection event object stored in state and Firebase omits `triggerId`. The `replayDetection` function reconstructs the GIF path via:
```js
gif: `/assets/gifs/${String(det.phrase).toLowerCase().replace(/\s+/g, "-")}.gif`
```
This breaks for triggers whose `id` differs from the matched phrase (e.g. `phrase = "fanum tax"` → reconstructed path `fanum-tax.gif` ✓ coincidentally works, but `phrase = "no cap"` → `no-cap.gif` ✓ also happens to work). However, using `det.phrase` as `triggerId` in the overlay object is semantically wrong and will mismatch the actual trigger if the phrase is an alias (e.g. `matchedPhrase = "skibidi toilet"` produces `triggerId = "skibidi toilet"` but the trigger ID is `"skibidi"`).

**Fix:** Add `triggerId: trigger.id` to the detection event at creation, and store `trigger.media` directly so replay doesn't reconstruct anything:
```js
const event = {
  id,
  triggerId: trigger.id,   // ADD THIS
  ...
};
```

---

### BUG-005 — `runtimeSeconds` doesn't update in real time

**Files affected:** `src/components/MainApp.jsx` (lines 45–48)

```js
const runtimeSeconds = useMemo(() => {
  if (!startedAt) return 0;
  return Math.floor((Date.now() - startedAt) / 1000);
}, [startedAt, finalSegments.length, detections.length]);
```

`Date.now()` is evaluated only when `finalSegments` or `detections` changes. In a quiet room the footer timer freezes between utterances.

**Fix:** Replace with a `useEffect` + `setInterval(1s)` pattern, or a `useState` that ticks every second:
```js
const [runtimeSeconds, setRuntimeSeconds] = useState(0);
useEffect(() => {
  if (!startedAt) { setRuntimeSeconds(0); return; }
  const id = setInterval(() => {
    setRuntimeSeconds(Math.floor((Date.now() - startedAt) / 1000));
  }, 1000);
  return () => clearInterval(id);
}, [startedAt]);
```

---

### BUG-006 — `detections.length + 1` in Firebase session upsert is always stale

**Files affected:** `src/components/MainApp.jsx` (line 101)

```js
void upsertSession(sessionId, {
  totalDetections: detections.length + 1,
  ...
});
```

`detections` is the state value captured at the start of `handleDetection`. React batches `setDetections` asynchronously, so `detections.length` hasn't changed yet when this line executes. The Firebase `sessions/` document will always lag by one.

**Fix:** Use a separate `useRef` counter or read `detections.length` from a ref that is updated synchronously alongside `setDetections`.

---

## PRD vs. Implementation Gaps

### GAP-001 — Tailwind CSS not implemented (PRD §4, §6)

The PRD specifies **Tailwind CSS v3+** with a `tailwind.config.js` and Tailwind imports in `index.css`. The project uses vanilla CSS with CSS custom properties instead. There is no `tailwind.config.js`, no `@tailwind` directives, and no Tailwind package in `package.json`.

**Assessment:** The vanilla CSS implementation is functionally equivalent and arguably cleaner for a project this size. If Tailwind is required for demo/judge expectations, install and configure it. Otherwise, update the PRD §4 and §6 to reflect the actual stack.

---

### GAP-002 — `triggers2016.json` is incomplete (PRD §2 F-011, §8)

The PRD describes 2016 Mode as covering phrases like *"dabbing, harambe, damn daniel, what are those"* with "era-appropriate media." The current file has only 3 entries and is missing at least: `"what are those"`, `"on fleek"`, `"it's lit"`, `"deez nuts"`, `"yass"`, `"aye bay bay"`.

With only 3 triggers the 2016 mode toggle provides a noticeably thinner experience than the 26-trigger modern mode.

---

### GAP-003 — P2 TTS bad advice (F-010) not implemented

The Web Speech Synthesis API integration that would read bad advice aloud ("deep sigma voice, lowest pitch, slow rate") is absent from the codebase. `AdvicePopup.jsx` displays text only.

---

### GAP-004 — P2 Multi-user leaderboard (F-012) not implemented

No Firebase leaderboard structure, no leaderboard UI component, no session comparison logic exists. Marked P2 in PRD so this is expected; noted for completeness.

---

### GAP-005 — `sessionExportClient.js` + backend Express service not in PRD spec

`src/lib/sessionExportClient.js` and the entire `functions/` Express backend (GCS export endpoint) are present in the codebase but not described anywhere in the PRD. This is a net-positive addition (gives persistent session archives) but the PRD should be updated to document:
- The `VITE_GCS_EXPORT_ENDPOINT` and `VITE_GCS_EXPORT_TOKEN` env vars
- The `/export-session` endpoint contract
- The `functions/` service in the file structure (§6) and build instructions (§12)

---

## Security Notes

### SEC-001 — Gemini API key exposed in client bundle

`VITE_GEMINI_API_KEY` is a Vite public env var and is embedded verbatim in the compiled JS bundle. Any visitor to the deployed app can extract it from browser DevTools. For a hackathon demo on `localhost` this is acceptable, but if deployed to Firebase Hosting the key should be rotated or proxied through the Express backend.

---

## Summary Table

| ID | Type | Severity | Status |
|----|------|----------|--------|
| BUG-001 | Missing public/assets directory | Critical | Fixed |
| BUG-002 | Stale closure corrupts aura accumulation | Critical | Fixed |
| BUG-003 | Duplicate rizz trigger phrases | Medium | Fixed |
| BUG-004 | `triggerId` missing from detection events | Medium | Fixed |
| BUG-005 | `runtimeSeconds` doesn't tick live | Low | Fixed |
| BUG-006 | `detections.length + 1` stale in Firebase | Low | Fixed |
| GAP-001 | Tailwind CSS not used despite PRD spec | Informational | Open |
| GAP-002 | `triggers2016.json` only 3 entries | Low | Fixed |
| GAP-003 | P2 TTS bad advice not implemented | P2 | Not started |
| GAP-004 | P2 Multi-user leaderboard not implemented | P2 | Not started |
| GAP-005 | GCS export feature undocumented in PRD | Informational | Open |
| SEC-001 | Gemini API key exposed in client | Known risk | Accepted |
