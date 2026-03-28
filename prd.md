# Rizz-istential Crisis — Technical PRD

An ambient listening web app that detects brainrot phrases in real-time conversation and responds with chaotic media (sound effects, GIFs, videos) plus AI-generated terrible conversational advice.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Feature Specification (P0 / P1 / P2)](#2-feature-specification)
3. [System Architecture](#3-system-architecture)
4. [Tech Stack & Dependencies](#4-tech-stack--dependencies)
5. [Data Models & Schemas](#5-data-models--schemas)
6. [File Structure](#6-file-structure)
7. [Component Specifications](#7-component-specifications)
   - 7.1 Frontend — Main App UI
   - 7.2 Speech-to-Text Pipeline
   - 7.3 Brainrot Detection Engine
   - 7.4 Media Playback System
   - 7.5 Firebase Integration
   - 7.6 Gemini Bad Advice Engine
   - 7.7 Aura Score Tracker
   - 7.8 Live Feed Viewer
8. [Brainrot Trigger Dictionary](#8-brainrot-trigger-dictionary)
9. [API Contracts](#9-api-contracts)
10. [UI/UX Specification](#10-uiux-specification)
11. [Demo Script](#11-demo-script)
12. [Build & Deploy Instructions](#12-build--deploy-instructions)
13. [Task Breakdown (5-Hour Sprint)](#13-task-breakdown)
14. [Testing Checklist](#14-testing-checklist)
15. [Devpost Submission Copy](#15-devpost-submission-copy)

---

## 1. Project Overview

Rizz-istential Crisis is a browser-based ambient listening application. It uses the Web Speech API to continuously transcribe microphone input, runs a client-side keyword detection engine against a dictionary of brainrot/internet slang phrases, and on detection triggers chaotic media responses: full-screen GIF/video overlays, loud sound effects, and screen-shake animations. Optionally, the Gemini API generates intentionally terrible conversational advice. All detections stream to a Firebase Realtime Database, creating a live "Brainrot Feed" that spectators can watch on a separate screen.

---

## 2. Feature Specification

### P0 — Must Ship (Core MVP)

These features constitute the minimum viable demo. If any P0 is missing, the project is not submittable.

**F-001: Microphone Capture**
Browser requests mic permission via `navigator.mediaDevices.getUserMedia()`. Audio stream feeds into Web Speech API `SpeechRecognition` with `continuous=true` and `interimResults=true`.

**F-002: Live Transcript Display**
Real-time transcript displayed in a scrolling panel on the main UI. Shows interim (gray/italic) and final (white/bold) results. Auto-scrolls to latest.

**F-003: Brainrot Keyword Detection**
Client-side detection engine matches final transcript segments against a dictionary of 25+ brainrot trigger phrases. Case-insensitive. Supports exact match and substring match. Returns the matched trigger, surrounding context (10 words), and a severity score.

**F-004: Media Response System**
On keyword detection, triggers: (a) audio playback of a mapped sound effect, (b) full-screen GIF/image/video overlay lasting 2-4 seconds, (c) CSS screen-shake animation on the body element. Each trigger phrase maps to specific media assets via a JSON dictionary.

**F-005: Firebase Event Logging**
Every detection event writes to Firebase Realtime DB at path `/detections/{timestamp}`. Payload includes: phrase, context, severity, timestamp, cumulativeAura.

**F-006: Live Feed Viewer Page**
Separate `/feed` route (or standalone HTML page) that reads Firebase Realtime DB and displays detection events in real-time as a scrolling feed. Spectators open this on a separate device. Each card shows the detected phrase, context snippet, severity badge, and timestamp.

### P1 — High Value Add (Build if ahead of schedule)

**F-007: Gemini Bad Advice Coach**
After a detection event, send the transcript context to Gemini API with a system prompt instructing it to generate the worst possible conversational follow-up. Display the advice in a dramatic pop-up overlay with typewriter animation.

**F-008: Aura Score Tracker**
Running score displayed on main UI. Each brainrot detection modifies the score based on severity (positive phrases like "sigma" add aura, cringe phrases subtract). Large animated counter with color transitions (green > 0, red < 0).

**F-009: Detection History Panel**
Sidebar or bottom panel showing the last 20 detections with timestamp, phrase, and media thumbnail. Clickable to replay the media response.

### P2 — Stretch Goals

**F-010: TTS Bad Advice**
Use Web Speech Synthesis API to read the bad advice aloud in a deep "sigma" voice (lowest pitch setting, slow rate).

**F-011: 2016 Mode**
Toggle that switches the trigger dictionary to 2016-era phrases (dabbing, harambe, damn daniel, what are those) with era-appropriate media.

**F-012: Multi-User Leaderboard**
Firebase-backed leaderboard comparing aura scores across multiple listeners running the app simultaneously.

---

## 3. System Architecture

The architecture is intentionally client-heavy to minimize latency on the core detection loop. The only external calls are Firebase writes (async, non-blocking) and optional Gemini API calls (P1).

### Data Flow

```
1. Microphone audio stream captured via getUserMedia()
2. Fed to Web Speech API SpeechRecognition (browser-native, no API key needed)
3. Transcript chunks emitted via onresult callback
4. Client-side BrainrotDetector class runs keyword matching on each chunk
5. On match: MediaPlayer triggers sound + visual overlay simultaneously
6. On match: FirebaseLogger.logDetection() writes event to Realtime DB (async)
7. On match (P1): GeminiAdvisor.getAdvice(context) calls Gemini API, displays result
8. Feed viewer page subscribes to Firebase onValue() and renders events in real-time
```

### Architecture Diagram

```
+------------------+     +-------------------+     +--------------------+
|   Microphone     | --> | Web Speech API    | --> | Transcript Stream  |
+------------------+     +-------------------+     +--------------------+
                                                          |
                                                          v
                                                  +--------------------+
                                                  | BrainrotDetector   |
                                                  | (client-side)      |
                                                  +--------------------+
                                                          |
                                             match detected|
                             +----------------------------+-------------------+
                             |                            |                   |
                             v                            v                   v
                   +------------------+     +-------------------+   +------------------+
                   | MediaPlayer      |     | FirebaseLogger    |   | GeminiAdvisor    |
                   | (sound + GIF +   |     | (Realtime DB      |   | (P1: bad advice) |
                   |  screen shake)   |     |  async write)     |   +------------------+
                   +------------------+     +-------------------+
                                                    |
                                                    v
                                           +-------------------+
                                           | /feed viewer page |
                                           | (spectators)      |
                                           +-------------------+
```

---

## 4. Tech Stack & Dependencies

| Layer | Technology | Version / Notes | Why |
|---|---|---|---|
| Frontend Framework | React (Vite) | `npm create vite@latest` | Fast scaffold, hot reload, component model |
| Styling | Tailwind CSS | v3+ | Rapid UI, animation utilities, neon aesthetic easy |
| Speech-to-Text | Web Speech API | Browser native (Chrome required) | Zero setup, no API key, low latency, free |
| Keyword Detection | Custom JS module | Client-side | Sub-millisecond matching, no network latency |
| Media Assets | Local + Tenor GIF API | Bundled in `/public` | GIFs, sounds, videos for each trigger |
| Real-time DB | Firebase Realtime DB | v9 modular SDK | Real-time sync for live feed, free tier sufficient |
| AI Advice (P1) | Google Gemini API | gemini-1.5-flash | Fast, cheap, good at following unhinged prompts |
| Hosting | localhost / Firebase Hosting | Dev server for demo | localhost is fine |
| Animations | CSS + Framer Motion | Optional | Screen shake, overlay transitions, counter animations |

### Required API Keys / Setup

- Firebase project with Realtime Database enabled (free Spark plan)
- Firebase config object (apiKey, authDomain, databaseURL, projectId, etc.)
- Google Gemini API key (for P1 bad advice feature) -- get from aistudio.google.com
- Chrome browser (Web Speech API has best support in Chrome)

---

## 5. Data Models & Schemas

### 5.1 BrainrotTrigger (client-side dictionary entry)

```json
{
  "id": "skibidi",
  "phrases": ["skibidi", "skibidi toilet"],
  "matchType": "substring",
  "severity": 8,
  "auraModifier": -15,
  "media": {
    "sound": "/assets/sounds/skibidi.mp3",
    "gif": "/assets/gifs/skibidi.gif",
    "video": null,
    "duration": 3000
  },
  "category": "brainrot"
}
```

### 5.2 DetectionEvent (Firebase write payload)

```json
{
  "id": "det_1711612800000",
  "timestamp": 1711612800000,
  "phrase": "skibidi",
  "context": "...and then I saw the skibidi toilet meme and...",
  "severity": 8,
  "auraModifier": -15,
  "cumulativeAura": -42,
  "badAdvice": "Ask them to rank all skibidi toilet episodes by lore depth",
  "category": "brainrot",
  "sessionId": "sess_abc123"
}
```

### 5.3 AppState (React state shape)

```json
{
  "isListening": "boolean",
  "transcript": "string (full running transcript)",
  "interimText": "string (current interim result)",
  "detections": "DetectionEvent[] (last 50)",
  "auraScore": "number (cumulative)",
  "currentOverlay": {
    "triggerId": "string",
    "mediaUrl": "string",
    "advice": "string | null"
  },
  "isShaking": "boolean (CSS shake trigger)",
  "mode": "brainrot | 2016"
}
```

### 5.4 Firebase Realtime DB Structure

```
rizzistential-crisis/
  detections/
    {timestamp}/
      phrase: string
      context: string
      severity: number
      auraModifier: number
      cumulativeAura: number
      badAdvice: string | null
      category: string
      sessionId: string
      timestamp: number
  sessions/
    {sessionId}/
      startedAt: number
      totalDetections: number
      finalAura: number
```

---

## 6. File Structure

```
rizzistential-crisis/
  public/
    assets/
      sounds/                # .mp3 files for each trigger
        skibidi.mp3
        rizz.mp3
        sigma.mp3
        ...
      gifs/                  # .gif files for each trigger
        skibidi.gif
        rizz.gif
        sigma.gif
        ...
      videos/                # optional .mp4/.webm for select triggers
  src/
    App.jsx                  # Root component, routing
    main.jsx                 # Vite entry point
    index.css                # Tailwind imports + custom animations
    components/
      MainApp.jsx            # Primary listening UI
      TranscriptPanel.jsx    # Scrolling transcript display
      MediaOverlay.jsx       # Full-screen GIF/video overlay
      AuraCounter.jsx        # Animated aura score display
      DetectionHistory.jsx   # Sidebar of recent detections
      AdvicePopup.jsx        # P1: Gemini bad advice display
      FeedViewer.jsx         # /feed route for judges
      FeedCard.jsx           # Individual detection card in feed
      Controls.jsx           # Start/stop listening, mode toggle
    lib/
      speechRecognition.js   # Web Speech API wrapper
      brainrotDetector.js    # Keyword matching engine
      mediaPlayer.js         # Sound + overlay trigger logic
      firebaseConfig.js      # Firebase initialization
      firebaseLogger.js      # Write/read detection events
      geminiAdvisor.js       # P1: Gemini API integration
      auraCalculator.js      # Score computation logic
    data/
      triggers.json          # Full brainrot trigger dictionary
      triggers2016.json      # P2: 2016-era trigger dictionary
  .env                       # VITE_FIREBASE_*, VITE_GEMINI_API_KEY
  package.json
  vite.config.js
  tailwind.config.js
  README.md
```

---

## 7. Component Specifications

### 7.1 Frontend -- Main App UI (MainApp.jsx)

**Responsibilities:**
- Manages global app state (listening status, transcript, detections, aura score)
- Initializes SpeechRecognition on user click (browser requires user gesture)
- Pipes transcript events to BrainrotDetector
- Triggers MediaOverlay and FirebaseLogger on detection
- Renders all child components

**Layout:**
Full viewport dark background (`#0D1117`). Center: large aura score counter. Below: scrolling transcript. Bottom bar: start/stop button + mode toggle. Right sidebar (optional): detection history. MediaOverlay renders as fixed position, z-index 9999, pointer-events-none overlay.

### 7.2 Speech-to-Text Pipeline (speechRecognition.js)

```javascript
class SpeechListener {
  constructor(onTranscript, onInterim) {
    this.recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.recognition.onresult = (event) => {
      // Process results, call onTranscript for final,
      // onInterim for interim
    };
    this.recognition.onend = () => {
      // Auto-restart if still listening (Chrome stops after silence)
      if (this.isListening) this.recognition.start();
    };
  }
  start() { this.isListening = true; this.recognition.start(); }
  stop()  { this.isListening = false; this.recognition.stop(); }
}
```

**Key behaviors:**
- Auto-restart on end (Chrome kills recognition after ~60s of silence)
- Debounce interim results to avoid flooding the detector
- Only pass final results to the brainrot detector (interim too noisy)
- Error handling: notify user if mic permission denied

### 7.3 Brainrot Detection Engine (brainrotDetector.js)

```javascript
class BrainrotDetector {
  constructor(triggers) {
    this.triggers = triggers; // from triggers.json
    this.processedSegments = new Set(); // avoid double-detection
    this.cooldowns = new Map(); // trigger id -> last fired timestamp
  }

  detect(transcriptSegment) {
    const lower = transcriptSegment.toLowerCase();
    const matches = [];
    const now = Date.now();

    for (const trigger of this.triggers) {
      // Check cooldown (5 second minimum between same-phrase detections)
      if (this.cooldowns.has(trigger.id) &&
          now - this.cooldowns.get(trigger.id) < 5000) {
        continue;
      }

      for (const phrase of trigger.phrases) {
        let matched = false;
        if (trigger.matchType === "substring" && lower.includes(phrase)) {
          matched = true;
        } else if (trigger.matchType === "exact") {
          const regex = new RegExp(`\\b${phrase}\\b`, "i");
          matched = regex.test(lower);
        }

        if (matched) {
          this.cooldowns.set(trigger.id, now);
          matches.push({
            trigger,
            matchedPhrase: phrase,
            context: this.extractContext(transcriptSegment, phrase)
          });
          break; // one match per trigger per segment
        }
      }
    }

    // Sort by severity descending, fire highest first
    return matches.sort((a, b) => b.trigger.severity - a.trigger.severity);
  }

  extractContext(text, phrase) {
    const words = text.split(/\s+/);
    const phraseWords = phrase.split(/\s+/);
    const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
    if (idx === -1) return text;

    // Get ~10 words surrounding the match
    const beforeText = text.substring(0, idx);
    const afterText = text.substring(idx + phrase.length);
    const beforeWords = beforeText.trim().split(/\s+/).slice(-5);
    const afterWords = afterText.trim().split(/\s+/).slice(0, 5);

    return [...beforeWords, phrase, ...afterWords].join(" ");
  }
}
```

**Key behaviors:**
- Cooldown per trigger: 5 second minimum between same-phrase detections to prevent spam
- Segment deduplication: track processed transcript segments to avoid re-matching
- Priority: if multiple triggers match in one segment, fire the highest-severity one first

### 7.4 Media Playback System (mediaPlayer.js + MediaOverlay.jsx)

**Sound Playback:**
Use `HTMLAudioElement`. Pre-load all sound files on app init to avoid latency on first trigger. Play at full volume. Sounds should be short (1-3 seconds).

```javascript
class MediaPlayer {
  constructor(triggers) {
    this.audioCache = new Map();
    // Pre-load all sounds
    for (const trigger of triggers) {
      if (trigger.media.sound) {
        const audio = new Audio(trigger.media.sound);
        audio.preload = "auto";
        this.audioCache.set(trigger.id, audio);
      }
    }
  }

  playSound(triggerId) {
    const audio = this.audioCache.get(triggerId);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(console.error);
    }
  }
}
```

**Visual Overlay (MediaOverlay.jsx):**
Fixed-position, full-viewport div with z-index 9999. On trigger, displays the mapped GIF/video with a fade-in animation (200ms), holds for the configured duration (2-4 seconds), then fades out (200ms). The overlay should be semi-transparent (opacity 0.85) so the underlying app is still partially visible.

**Screen Shake:**

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}
.shaking { animation: shake 0.5s ease-in-out; }
```

### 7.5 Firebase Integration

**firebaseConfig.js:**

```javascript
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
```

**firebaseLogger.js:**

```javascript
import { ref, push, onValue, query, orderByChild, limitToLast } from "firebase/database";
import { db } from "./firebaseConfig";

export function logDetection(event) {
  const detectionsRef = ref(db, "detections");
  return push(detectionsRef, {
    ...event,
    timestamp: Date.now()
  });
}

export function subscribeToDetections(callback, limit = 50) {
  const detectionsRef = query(
    ref(db, "detections"),
    orderByChild("timestamp"),
    limitToLast(limit)
  );
  return onValue(detectionsRef, (snapshot) => {
    const data = snapshot.val();
    const events = data
      ? Object.values(data).sort((a, b) => b.timestamp - a.timestamp)
      : [];
    callback(events);
  });
}
```

**Firebase Rules (set in Firebase Console):**

```json
{
  "rules": {
    "detections": {
      ".read": true,
      ".write": true
    },
    "sessions": {
      ".read": true,
      ".write": true
    }
  }
}
```

> Wide-open rules are fine for a hackathon. Do not ship this to production.

### 7.6 Gemini Bad Advice Engine (P1) (geminiAdvisor.js)

**System Prompt:**

```javascript
const SYSTEM_PROMPT = `You are the world's worst conversational coach.
You are a brainrot-poisoned AI that gives intentionally terrible,
awkward, and unhinged conversational advice.

When given a conversation context and a detected brainrot phrase,
generate a single follow-up suggestion that is:
- Maximally awkward and socially destructive
- References niche internet culture, memes, or conspiracies
- Delivered with complete confidence
- 1-2 sentences max

Examples:
- "Now ask them to rate the top 5 skibidi toilet episodes by lore depth"
- "Pivot to explaining why Ohio is actually a simulation"
- "Tell them you just gained 50 aura from this interaction"
- "Ask them if they think the Rizzler is real"

Respond with ONLY the advice. No preamble, no explanation.`;
```

**API Call:**

```javascript
const FALLBACK_ADVICE = [
  "Just stare at them in silence for 30 seconds.",
  "Now explain why you think pigeons are government drones.",
  "Ask them what their sigma ID number is.",
  "Tell them you've been mewing for 6 hours straight.",
  "Pivot to your theory about the Ohio conspiracy.",
  "Ask if they've accepted the Rizzler as their lord and savior.",
  "Tell them you need to check your aura levels real quick.",
  "Now would be a great time to hit the griddy.",
  "Ask them to rate your mewing form on a scale of 1-10.",
  "Explain that this conversation just cost them 50 aura.",
  "Tell them you're actually an NPC and this is a side quest.",
  "Ask if they think fanum tax should be federally regulated.",
  "Say 'hold on I need to edge' and just stand there.",
  "Tell them skibidi toilet changed your life philosophy.",
  "Ask them to be your duo in the sigma grindset.",
  "Inform them that you've been gooning since 6 AM.",
  "Ask what their W/L ratio is this week.",
  "Tell them Ohio isn't a state, it's a state of mind.",
  "Now recite the entire skibidi toilet lore timeline.",
  "Ask them if they've ever been mogged in public."
];

export async function getAdvice(context, detectedPhrase) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{
            parts: [{
              text: `Conversation context: "${context}"\nDetected phrase: "${detectedPhrase}"\nGenerate terrible advice:`
            }]
          }]
        })
      }
    );
    clearTimeout(timeout);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ||
      FALLBACK_ADVICE[Math.floor(Math.random() * FALLBACK_ADVICE.length)];
  } catch (err) {
    clearTimeout(timeout);
    return FALLBACK_ADVICE[Math.floor(Math.random() * FALLBACK_ADVICE.length)];
  }
}
```

Timeout: 5 second max. If Gemini is slow or fails, fall back to the hardcoded array. Never block the UI waiting for Gemini.

### 7.7 Aura Score Tracker (auraCalculator.js + AuraCounter.jsx)

- Start at 0
- Each detection adds `trigger.auraModifier` to cumulative score
- Score can go negative (no floor)
- Display: large centered number, animated count-up/down transitions
- Color: green (`#00C389`) when positive, red (`#EF4444`) when negative, gray at 0
- Flash animation on change: brief scale-up (1.2x) then return to 1x over 300ms

### 7.8 Live Feed Viewer (FeedViewer.jsx)

Accessible at `/feed` route. Full-screen dark background. Auto-subscribes to Firebase detections. Shows cards in reverse-chronological order (newest at top). Each card displays:

- Detected phrase (large, colored by category)
- Context snippet (monospace, smaller)
- Severity badge (1-10, color-coded)
- Bad advice text (P1, italic, yellow)
- Timestamp (relative, e.g., "3s ago")
- Running aura score in header

New cards should animate in from the top with a slide-down + fade effect. Play a subtle notification sound on new detection (different from the main app sounds).

---

## 8. Brainrot Trigger Dictionary

Starter set of 25 triggers. Each needs sound + GIF assets sourced before or during Hour 1.

| Phrase | Severity | Aura | Category | Match Type |
|---|---|---|---|---|
| skibidi | 9 | -20 | brainrot | substring |
| rizz | 7 | +10 | sigma | substring |
| sigma | 8 | +15 | sigma | exact |
| gyatt | 9 | -15 | brainrot | substring |
| fanum tax | 8 | -10 | brainrot | substring |
| ohio | 6 | -5 | brainrot | exact |
| mewing | 7 | +5 | sigma | substring |
| aura | 5 | +10 | sigma | exact |
| brainrot | 10 | -25 | brainrot | substring |
| 67 | 6 | -5 | brainrot | exact |
| sus | 4 | -3 | zoomer | exact |
| no cap | 5 | -5 | zoomer | substring |
| bussin | 6 | -8 | zoomer | substring |
| slay | 4 | +5 | zoomer | exact |
| delulu | 7 | -10 | zoomer | substring |
| beta | 6 | -10 | sigma | exact |
| alpha | 5 | +10 | sigma | exact |
| griddy | 7 | -12 | brainrot | substring |
| hawk tuah | 9 | -20 | brainrot | substring |
| edging | 8 | -15 | brainrot | substring |
| mogging | 7 | +10 | sigma | substring |
| gooning | 9 | -20 | brainrot | substring |
| W rizz | 8 | +15 | sigma | substring |
| L rizz | 8 | -15 | sigma | substring |
| NPC | 6 | -8 | brainrot | exact |

### P2: 2016 Mode Triggers (sample)

| Phrase | Severity | Aura | Category |
|---|---|---|---|
| harambe | 10 | -20 | classic |
| dabbing | 8 | -15 | classic |
| damn daniel | 7 | -10 | classic |
| what are those | 6 | -8 | classic |
| deez nuts | 8 | -12 | classic |
| cash me outside | 7 | -10 | classic |
| bottle flip | 5 | -5 | classic |
| mannequin challenge | 6 | -8 | classic |

---

## 9. API Contracts

There is no custom backend server. All communication is client-side to external services.

### 9.1 Web Speech API (browser-native)

```
Input:  Audio stream from getUserMedia()
Output: SpeechRecognitionEvent with results[]
  - results[i].isFinal: boolean
  - results[i][0].transcript: string
  - results[i][0].confidence: number (0-1)
```

### 9.2 Firebase Realtime DB

```
Write: push(ref(db, "detections"), DetectionEvent)
Read:  onValue(query(ref(db, "detections"),
         orderByChild("timestamp"), limitToLast(50)),
         callback)
```

### 9.3 Gemini API (P1)

```
Endpoint: POST https://generativelanguage.googleapis.com/v1beta/
          models/gemini-1.5-flash:generateContent?key={API_KEY}
Request body: See section 7.6
Response: { candidates: [{ content: { parts: [{ text: string }] } }] }
Timeout: 5000ms
Fallback: Random selection from hardcoded advice array
```

### 9.4 Tenor GIF API (optional, for dynamic GIF sourcing)

```
Endpoint: GET https://tenor.googleapis.com/v2/search
Params: q={phrase}&key={API_KEY}&limit=1&media_filter=gif
Response: { results: [{ media_formats: { gif: { url: string } } }] }
Note: Only use if pre-bundled GIFs are insufficient. Pre-bundling preferred.
```

---

## 10. UI/UX Specification

### Visual Theme: Chaotic Neon Terminal

Dark background (`#0D1117`), neon green (`#00C389`) primary accent, purple (`#A855F7`) secondary, red (`#EF4444`) for warnings/negative aura. Monospace font (JetBrains Mono or Fira Code from Google Fonts) for transcript and data displays. Sans-serif (Inter) for headings and controls. Intentionally over-the-top: glow effects, scanline overlays, CRT-style vignette optional.

### Main App Screen Layout

```
+------------------------------------------------------------------+
|  RIZZ-ISTENTIAL CRISIS              [Mode: Brainrot v]  [STOP]  |
+------------------------------------------------------------------+
|                                                                  |
|                        AURA: -347                               |
|                    (large, animated, colored)                    |
|                                                                  |
+------------------------------------------------------------------+
|  TRANSCRIPT                          |  DETECTION LOG           |
|  ----------------------------------- |  ----------------------- |
|  ...and then I was like you know     |  [skibidi] -20 aura     |
|  that is so sigma bro honestly I     |  3s ago                  |
|  think the whole skibidi thing is...  |  "now ask them to..."   |
|  [interim text in gray italic]       |  ----------------------- |
|                                       |  [sigma] +15 aura      |
|                                       |  45s ago               |
+------------------------------------------------------------------+
|  Status: Listening...  |  Detections: 12  |  Session: 4m 23s   |
+------------------------------------------------------------------+
```

### Media Overlay (on detection)

```
+------------------------------------------------------------------+
|                                                                  |
|                                                                  |
|                    [FULL SCREEN GIF/VIDEO]                       |
|                    opacity: 0.85                                 |
|                    z-index: 9999                                 |
|                                                                  |
|                    DETECTED: "SKIBIDI"                           |
|                    -20 AURA                                      |
|                                                                  |
|    "Ask them to rank all skibidi toilet episodes by lore depth"  |
|                    (typewriter animation)                        |
|                                                                  |
+------------------------------------------------------------------+
```

### Feed Viewer Screen (/feed)

```
+------------------------------------------------------------------+
|  BRAINROT FEED (LIVE)                        AURA: -347         |
+------------------------------------------------------------------+
|  +------------------------------------------------------------+ |
|  | SKIBIDI                            severity: 9/10   3s ago | |
|  | "...the whole skibidi thing is honestly..."                | |
|  | Advice: "Ask them to rank skibidi episodes by lore depth" | |
|  | Aura: -20                                                  | |
|  +------------------------------------------------------------+ |
|  +------------------------------------------------------------+ |
|  | SIGMA                              severity: 8/10  45s ago | |
|  | "...that is so sigma bro honestly..."                     | |
|  | Advice: "Now explain the sigma male grindset hierarchy"   | |
|  | Aura: +15                                                  | |
|  +------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

---

## 11. Demo Script (2-3 minutes)

Rehearse at least twice. Have a backup screen recording ready.

| Time | Action | Expected Result |
|---|---|---|
| 0:00 | "Have you ever had a conversation go so wrong you wish an AI was listening?" | Set the premise |
| 0:15 | Open app on laptop. Show the UI -- dark theme, aura counter at 0. | Establish the interface |
| 0:25 | Open /feed on a second device (phone/tablet). Hand to a judge if possible. | Judges see the live feed |
| 0:35 | Click START. "Let me just have a normal conversation..." | Transcript starts appearing |
| 0:50 | Talk normally for 10 seconds. Nothing happens. | Prove it's listening, build tension |
| 1:00 | Casually say: "Yeah that's so sigma honestly" | BOOM: sigma sound, GIF overlay, screen shake, +15 aura |
| 1:15 | Point to feed device: "The judges can see everything in real-time" | Feed shows the detection card |
| 1:30 | Say: "Have you seen the skibidi toilet thing?" | Bigger explosion: skibidi sound, GIF, -20 aura, bad advice popup |
| 1:45 | Read the bad advice aloud. Laugh. | Gemini-generated advice gets laughs |
| 2:00 | Rapid fire: drop 3-4 brainrot phrases in a row | Cascading chaos, aura plummeting, feed flooding |
| 2:20 | "Your final aura score: negative 347. Rizz-istential crisis confirmed." | Punchline |
| 2:30 | End. Take questions. | -- |

---

## 12. Build & Deploy Instructions

### Project Setup

```bash
# Create project
npm create vite@latest rizzistential-crisis -- --template react
cd rizzistential-crisis

# Install dependencies
npm install firebase
npm install -D tailwindcss @tailwindcss/vite

# Optional
npm install framer-motion  # for animations
```

### Environment Variables (.env)

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_GEMINI_API_KEY=your_gemini_key
```

### Firebase Setup

1. Go to console.firebase.google.com
2. Create new project (name: rizzistential-crisis)
3. Enable Realtime Database (Start in test mode)
4. Copy config object to .env
5. Set database rules to allow read/write (see section 7.5)

### Run Locally

```bash
npm run dev
# Open http://localhost:5173 in Chrome
# Open http://localhost:5173/feed on second device (same network)
```

### Media Asset Preparation

Before hacking begins, prepare a `/public/assets` directory with sounds and GIFs for each trigger. Source sounds from freesound.org or record short clips. Source GIFs from Tenor (search manually, download). Keep files small: sounds under 200KB (MP3), GIFs under 2MB. Name files to match trigger IDs: `skibidi.mp3`, `skibidi.gif`, `rizz.mp3`, `rizz.gif`, etc.

---

## 13. Task Breakdown

| Hour | Time | Tasks | Deliverable | Blocker If Late |
|---|---|---|---|---|
| 1 | 12:00-1:00 | Vite + React scaffold. Tailwind config. Firebase project + config. Web Speech API prototype (mic to transcript on screen). Source 15 sound + GIF assets into /public/assets. | Working transcript display with mic input | Everything. Start here. |
| 2 | 1:00-2:00 | Build brainrotDetector.js with triggers.json (25 entries). Wire detection to MediaOverlay component (sound + GIF + shake). Eat pizza. | Say "skibidi", see/hear chaos | Core demo not possible |
| 3 | 2:00-3:00 | Firebase Realtime DB integration. firebaseLogger.js write on detection. Build FeedViewer.jsx page at /feed route. Style feed cards. | Detections stream to /feed in real-time | No live feed for judges |
| 4 | 3:00-4:00 | P1: Gemini bad advice integration with fallback. AuraCounter.jsx with animations. Detection history sidebar. Polish UI: neon theme, glow effects, transitions. | Full feature set working | Missing wow factor |
| 5 | 4:00-5:00 | Bug fixes. Test full demo flow 2x. Record backup video. Write Devpost submission. Take screenshots. Submit before 5:00 PM. | Submitted on Devpost, demo-ready | Cannot submit late |

---

## 14. Testing Checklist

Run through at 4:30 PM before final submission.

- [ ] Chrome mic permission prompt appears on first START click
- [ ] Transcript updates in real-time while speaking
- [ ] Saying "skibidi" triggers: sound + GIF overlay + screen shake
- [ ] Saying "sigma" triggers different sound + GIF
- [ ] Saying "rizz" triggers different sound + GIF
- [ ] Cooldown works: saying same phrase twice quickly only fires once
- [ ] Aura counter updates correctly (positive and negative)
- [ ] Aura counter color changes (green positive, red negative)
- [ ] Firebase: open /feed on phone, verify detections appear in < 2 seconds
- [ ] Feed cards show phrase, context, severity, timestamp
- [ ] (P1) Bad advice appears in overlay after detection
- [ ] (P1) Bad advice appears in feed cards
- [ ] (P1) Gemini timeout fallback works (disconnect wifi, trigger detection)
- [ ] App recovers from speech recognition timeout (stay silent 60s, verify auto-restart)
- [ ] STOP button actually stops listening
- [ ] START after STOP resumes correctly
- [ ] No console errors in Chrome DevTools
- [ ] Demo flow rehearsed at least twice
- [ ] Backup screen recording saved
- [ ] Devpost submission complete with screenshots + description

---

## 15. Devpost Submission Copy

**Project Name:** Rizz-istential Crisis

**Tagline:** Your phone listens to everything you say and judges your brainrot in real-time.

**Description:**
What if your phone was always listening -- not for ads, but to judge your vocabulary? Rizz-istential Crisis is an ambient listening web app that detects brainrot phrases in real-time conversation and responds with maximum chaos: sound effects, full-screen GIF explosions, screen-shake animations, and AI-generated advice that will guarantee you never rizz anyone up again. Every detection streams to a live Firebase feed so your friends (or hackathon judges) can watch your aura score plummet in real-time. Your conversations will never recover.

**Built With:** React, Vite, Tailwind CSS, Web Speech API, Firebase Realtime Database, Google Gemini API, Framer Motion, JavaScript, HTML/CSS

**How It Works:**
- Browser captures microphone audio via Web Speech API
- Real-time transcript analyzed by client-side brainrot detection engine (25+ trigger phrases)
- On detection: plays mapped sound effect + full-screen GIF overlay + screen shake
- Gemini API generates intentionally terrible conversational advice
- All events stream to Firebase Realtime DB for live spectator feed
- Cumulative "aura score" tracks your brainrot damage

**Challenges:**
Web Speech API has quirks (auto-stops after silence, inconsistent across browsers). Balancing detection sensitivity to avoid false positives while still catching brainrot. Making Gemini generate consistently funny/terrible advice under time pressure. Sourcing 25+ unique sound effects and GIFs in under an hour.

**What We Learned:**
Web Speech API, Firebase Realtime Database subscriptions, Gemini API prompt engineering for humor, real-time event-driven architecture in React, CSS animation chaining.