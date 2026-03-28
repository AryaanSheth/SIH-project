# Devpost Submission — Rizz-istential Crisis™

---

## Project Name
```
Rizz-istential Crisis
```
*(21 / 60 chars)*

---

## Elevator Pitch
```
Real-time ambient speech monitor that detects brainrot phrases, nukes your aura score, and fires GIFs + AI bad advice every time you say sigma, rizz, or skibidi. No cap.
```
*(169 / 200 chars)*

---

## About the Project

### Inspiration

we were in a meeting. someone said "that's so sigma" unironically. we looked at each other. we knew.

the brainrot epidemic is real and spreading. your coworkers have it. your professors have it. *you* might have it and not even know. we asked ourselves: *what if there was a tool that listened to everything you said and publicly shamed you every time you said something unhinged?*

the answer is this. you're looking at it.

---

### What it does

**Rizz-istential Crisis** is a real-time ambient speech monitoring platform. It listens to your microphone continuously using the Web Speech API and detects brainrot phrases — "sigma", "rizz", "skibidi", "no cap", "aura", "gyatt", and 20+ more. When a phrase is detected:

- a **GIF explodes on screen** and a sound plays
- your **Aura Score** gets modified (sigma = good, skibidi = catastrophic)
- **Gemini AI generates bad advice** specifically tuned to be unhelpful
- a **combo multiplier** activates if you say two phrases within 5 seconds (1.5×, 2×, up to 3×)
- go below zero aura and enter **Aura Debt** — the UI tells you "ur in debt bestie"

A separate **Live Feed** page shows every detection across all users in real time, with a global **leaderboard** ranked by aura score. There's also a **2016 Mode** for the historians: harambe, damn daniel, deez nuts, what are those.

The aura modifier formula is simple:

$$\text{effective modifier} = \text{base modifier} \times \text{combo multiplier}$$

where combo multiplier $c$ is defined as:

$$c = \begin{cases} 1 & \text{combo} = 1 \\ 1.5 & \text{combo} = 2 \\ 2 & \text{combo} = 3 \\ 3 & \text{combo} \geq 4 \end{cases}$$

---

### How we built it

**Frontend:** React 18 + Vite. No UI framework. All CSS is handwritten and intentionally bad. Comic Sans is load-bearing architecture.

**Speech pipeline:** Web Speech API with continuous listening and interim results. `getUserMedia` with `noiseSuppression`, `echoCancellation`, and `autoGainControl` constraints keeps the audio pipeline optimised for far-away speakers.

**Detection engine:** Custom `BrainrotDetector` class with three layers:
1. Word-boundary regex for exact matches (`\bphrase\b`)
2. Substring matching for multi-word phrases
3. Levenshtein edit-distance fuzzy fallback for single words ≥ 5 characters — catches mishears like "riz" → rizz and "aurora" → aura

**Cloud stack:**
- **Firebase Realtime Database** — detection events written in real time, subscribed to by the live feed and leaderboard
- **Firebase Auth** — Google OAuth gates the main app
- **Google Cloud Storage** — full session transcripts + detection logs exported as versioned JSON, streamed every 15 seconds
- **Google Cloud Functions** — server-side proxy for GCS writes
- **Gemini API (`gemini-2.0-flash`)** — generates contextual bad advice after each detection

---

### Challenges

**Stale closures everywhere.** React 18 concurrent rendering + async detection handlers + a 15-second streaming interval meant every captured value was stale. Solution: mirror all critical state into refs (`auraRef`, `detectionsRef`, `finalSegmentsRef`, etc.) and read exclusively from refs inside async contexts and intervals.

**"Rizz" transcription.** The Web Speech API consistently transcribes "rizz" as "riz", "chris", or "ritz" depending on accent and context. We added alias phrases with a `displayName` override and fuzzy matching as a fallback. The word cannot escape us.

**`onerror("aborted")` spam.** Chrome fires this event every time `SpeechRecognition` auto-restarts between utterances. This is not an error. We ignore it now. We are at peace.

**Intentionally bad UI that's still usable.** There is a fine line between "chaotic brainrot aesthetic" and "unreadable garbage". We found that line. We crossed it twice. We came back.

---

### What we learned

- The Web Speech API is extremely powerful and extremely chaotic and we have a complicated relationship with it now
- React refs are the correct solution to stale closures in async contexts and nobody talks about this enough
- Gemini is very good at giving bad advice when you ask it to
- "Comic Sans as a deliberate design choice" is a sentence you can say with a straight face
- Harambe still has cultural power in 2025. some things are forever.

---

## Built With

| Category | Technologies |
|---|---|
| Languages | JavaScript (ES2022) |
| Frontend | React 18, React Router v6, Vite, CSS3 |
| APIs | Web Speech API, Web Audio API (`getUserMedia`) |
| AI | Google Gemini API (`gemini-2.0-flash`) |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Firebase Realtime Database |
| Cloud Storage | Google Cloud Storage |
| Cloud Functions | Google Cloud Functions (Node.js) |
| Hosting | Vite (static) |

---

*© 2025 Rizz-istential Crisis Inc. Legally incorporated in Ohio. All aura lost is non-refundable. Chad is not a financial advisor.*
