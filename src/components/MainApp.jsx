import { useEffect, useRef, useState } from "react";
import AuraCounter from "./AuraCounter";
import Controls from "./Controls";
import DetectionHistory from "./DetectionHistory";
import MediaOverlay from "./MediaOverlay";
import TranscriptPanel from "./TranscriptPanel";
import triggers from "../data/triggers.json";
import triggers2016 from "../data/triggers2016.json";
import { applyAuraModifier } from "../lib/auraCalculator";
import { useAuth } from "../lib/AuthContext";
import { BrainrotDetector } from "../lib/brainrotDetector";
import { logDetection, upsertSession } from "../lib/firebaseLogger";
import { getAdvice } from "../lib/geminiAdvisor";
import { MediaPlayer } from "../lib/mediaPlayer";
import { exportSessionToGcs, streamAudioToGcs } from "../lib/sessionExportClient";
import { SpeechListener } from "../lib/speechRecognition";

function makeSessionId() {
  return `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

export default function MainApp() {
  const { user, signIn, signOut } = useAuth();
  const [mode, setMode] = useState("brainrot");
  const activeTriggers = mode === "2016" ? triggers2016 : triggers;

  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [interimText, setInterimText] = useState("");
  const [finalSegments, setFinalSegments] = useState([]);
  const [detections, setDetections] = useState([]);
  const [auraScore, setAuraScore] = useState(0);
  const [overlay, setOverlay] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [sessionId, setSessionId] = useState(makeSessionId());
  const [startedAt, setStartedAt] = useState(null);

  const speechRef = useRef(null);
  const micStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamIntervalRef = useRef(null);
  const detectorRef = useRef(new BrainrotDetector(activeTriggers));
  const mediaPlayerRef = useRef(new MediaPlayer(activeTriggers));
  const auraRef = useRef(0);
  const detectionCountRef = useRef(0);
  // Refs for streaming interval — always hold latest state without stale closures
  const finalSegmentsRef = useRef([]);
  const detectionsRef = useRef([]);
  const sessionIdRef = useRef(sessionId);
  const modeRef = useRef(mode);
  const startedAtRef = useRef(null);

  useEffect(() => {
    detectorRef.current = new BrainrotDetector(activeTriggers);
    mediaPlayerRef.current = new MediaPlayer(activeTriggers);
  }, [activeTriggers]);

  // Keep refs in sync with state so streaming interval always reads latest values
  useEffect(() => { auraRef.current = auraScore; }, [auraScore]);
  useEffect(() => { finalSegmentsRef.current = finalSegments; }, [finalSegments]);
  useEffect(() => { detectionsRef.current = detections; }, [detections]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { startedAtRef.current = startedAt; }, [startedAt]);

  // 15-second GCS streaming interval — fires while listening
  useEffect(() => {
    if (!isListening) return;
    streamIntervalRef.current = setInterval(() => {
      const now = Date.now();
      void exportSessionToGcs({
        sessionId: sessionIdRef.current,
        mode: modeRef.current,
        startedAt: startedAtRef.current,
        endedAt: null,
        transcript: finalSegmentsRef.current,
        detections: detectionsRef.current,
        auraScore: auraRef.current,
        uid: user?.uid || null,
        metadata: {
          totalDetections: detectionCountRef.current,
          runtimeSeconds: startedAtRef.current
            ? Math.floor((now - startedAtRef.current) / 1000)
            : 0,
          exportedAt: now,
          streaming: true,
        }
      });
    }, 15000);
    return () => {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    };
  }, [isListening, user?.uid]);

  // Real-time session clock — ticks every second while listening (BUG-005)
  const [runtimeSeconds, setRuntimeSeconds] = useState(0);
  useEffect(() => {
    if (!startedAt) { setRuntimeSeconds(0); return; }
    setRuntimeSeconds(Math.floor((Date.now() - startedAt) / 1000));
    const id = setInterval(() => {
      setRuntimeSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const handleDetection = async (match) => {
    const { trigger, matchedPhrase, context } = match;
    const timestamp = Date.now();
    const id = `det_${timestamp}`;

    // Read from ref to get the latest value regardless of closure age (BUG-002)
    const nextAura = applyAuraModifier(auraRef.current, trigger.auraModifier);
    setAuraScore(nextAura);
    auraRef.current = nextAura; // Update immediately so concurrent detections see it

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    mediaPlayerRef.current.playSound(trigger.id);

    const displayPhrase = trigger.displayName || matchedPhrase;
    const baseOverlay = {
      triggerId: trigger.id,
      matchedPhrase: displayPhrase,
      media: trigger.media,
      auraModifier: trigger.auraModifier,
      badAdvice: null
    };
    setOverlay(baseOverlay);

    let badAdvice = null;
    try {
      badAdvice = await getAdvice(context, matchedPhrase);
    } catch {
      badAdvice = null;
    }

    const event = {
      id,
      triggerId: trigger.id, // stored so replay can look up media reliably (BUG-004)
      timestamp,
      phrase: displayPhrase,
      context,
      severity: trigger.severity,
      auraModifier: trigger.auraModifier,
      cumulativeAura: nextAura,
      badAdvice,
      category: trigger.category,
      sessionId
    };

    setOverlay((prev) => (prev ? { ...prev, badAdvice } : prev));
    setDetections((prev) => [event, ...prev].slice(0, 50));
    detectionCountRef.current += 1; // increment synchronously (BUG-006)

    setTimeout(() => setOverlay(null), trigger?.media?.duration || 3000);

    void logDetection(event);
    void upsertSession(sessionId, {
      startedAt,
      totalDetections: detectionCountRef.current,
      finalAura: nextAura,
      mode,
      uid: user?.uid || null,
      displayName: user?.displayName || "Anonymous",
      photoURL: user?.photoURL || null,
    });
  };

  const handleFinalTranscript = (text) => {
    const chunk = { text, timestamp: Date.now() };
    setFinalSegments((prev) => [...prev, chunk].slice(-120));

    const matches = detectorRef.current.detect(text);
    if (matches.length > 0) {
      void handleDetection(matches[0]);
    }
  };

  const startListening = async () => {
    try {
      setStatus("Requesting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          sampleRate: { ideal: 48000 },
        }
      });
      micStreamRef.current = stream;

      if (!speechRef.current) {
        speechRef.current = new SpeechListener({
          onFinal: handleFinalTranscript,
          onInterim: setInterimText,
          onError: (err) => setStatus(`Speech error: ${err}`)
        });
      }

      const now = Date.now();
      if (!startedAt) {
        setStartedAt(now);
        void upsertSession(sessionId, {
          startedAt: now,
          totalDetections: 0,
          finalAura: 0,
          mode,
          uid: user?.uid || null,
          displayName: user?.displayName || "Anonymous",
          photoURL: user?.photoURL || null,
        });
      }

      // Start continuous audio streaming to GCS (Chrome 105+ supports fetch streaming)
      try {
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
        const audioStream = new ReadableStream({
          start(controller) {
            recorder.ondataavailable = async (e) => {
              if (e.data.size > 0) {
                const buffer = await e.data.arrayBuffer();
                controller.enqueue(new Uint8Array(buffer));
              }
            };
            recorder.onstop = () => controller.close();
            recorder.start(1000); // 1-second chunks for processing
          },
          cancel() {
            recorder.stop();
          }
        });
        mediaRecorderRef.current = recorder;
        void streamAudioToGcs(sessionId, audioStream);
      } catch (streamErr) {
        console.warn("Live audio streaming failed to initialize:", streamErr);
      }

      speechRef.current.start();
      setIsListening(true);
      setStatus("Listening...");
    } catch (err) {
      setStatus(`Microphone unavailable: ${err?.message || "permission denied"}`);
    }
  };

  const stopListening = async () => {
    speechRef.current?.stop();
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    setIsListening(false);
    setStatus("Stopped");

    const endedAt = Date.now();
    const payload = {
      sessionId,
      mode,
      startedAt,
      endedAt,
      transcript: finalSegments,
      detections,
      auraScore,
      metadata: {
        totalDetections: detections.length,
        runtimeSeconds: startedAt ? Math.floor((endedAt - startedAt) / 1000) : 0,
        exportedAt: endedAt
      }
    };

    try {
      await exportSessionToGcs(payload);
      setStatus("Stopped - transcript exported to GCS");
    } catch (err) {
      setStatus(`Stopped - export failed (${err.message})`);
    }

    void upsertSession(sessionId, {
      startedAt,
      endedAt,
      totalDetections: detections.length,
      finalAura: auraScore,
      mode,
      uid: user?.uid || null,
      displayName: user?.displayName || "Anonymous",
      photoURL: user?.photoURL || null,
    });

    detectionCountRef.current = 0;
    setSessionId(makeSessionId());
    setStartedAt(null);
  };

  const replayDetection = (det) => {
    // Use stored triggerId (BUG-004); fall back to phrase-derived path for older events
    const tid = det.triggerId || String(det.phrase).toLowerCase().replace(/\s+/g, "-");
    const fakeOverlay = {
      triggerId: tid,
      matchedPhrase: det.phrase,
      media: {
        gif: `/assets/gifs/${tid}.gif`,
        video: null
      },
      auraModifier: det.auraModifier,
      badAdvice: det.badAdvice
    };
    setOverlay(fakeOverlay);
    setTimeout(() => setOverlay(null), 2000);
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "brainrot" ? "2016" : "brainrot"));
  };

  return (
    <main className={`app-shell ${isShaking ? "shaking" : ""}`}>
      <header className="panel header">
        <div className="brand">RIZZ-ISTENTIAL CRISIS</div>
        <Controls
          isListening={isListening}
          mode={mode}
          onStart={startListening}
          onStop={stopListening}
          onToggleMode={toggleMode}
        />
        <div className="auth-controls">
          {user ? (
            <>
              {user.photoURL && <img src={user.photoURL} alt="" className="auth-avatar" referrerPolicy="no-referrer" />}
              <span className="auth-name">{user.displayName}</span>
              <button onClick={signOut}>Sign out</button>
            </>
          ) : (
            <button className="primary" onClick={signIn}>Sign in with Google</button>
          )}
        </div>
      </header>

      <section className="main-grid">
        <div className="left-stack">
          <AuraCounter score={auraScore} />
          <TranscriptPanel finalSegments={finalSegments} interimText={interimText} />
        </div>
        <DetectionHistory detections={detections} onReplay={replayDetection} />
      </section>

      <footer className="panel statusbar code">
        <span>Status: {status}</span>
        <span>Detections: {detections.length}</span>
        <span>Session: {runtimeSeconds}s</span>
      </footer>

      <MediaOverlay overlay={overlay} />
    </main>
  );
}
