import { useEffect, useMemo, useRef, useState } from "react";
import AuraCounter from "./AuraCounter";
import Controls from "./Controls";
import DetectionHistory from "./DetectionHistory";
import MediaOverlay from "./MediaOverlay";
import TranscriptPanel from "./TranscriptPanel";
import triggers from "../data/triggers.json";
import triggers2016 from "../data/triggers2016.json";
import { applyAuraModifier } from "../lib/auraCalculator";
import { BrainrotDetector } from "../lib/brainrotDetector";
import { logDetection, upsertSession } from "../lib/firebaseLogger";
import { getAdvice } from "../lib/geminiAdvisor";
import { MediaPlayer } from "../lib/mediaPlayer";
import { exportSessionToGcs } from "../lib/sessionExportClient";
import { SpeechListener } from "../lib/speechRecognition";

function makeSessionId() {
  return `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

export default function MainApp() {
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
  const detectorRef = useRef(new BrainrotDetector(activeTriggers));
  const mediaPlayerRef = useRef(new MediaPlayer(activeTriggers));

  useEffect(() => {
    detectorRef.current = new BrainrotDetector(activeTriggers);
    mediaPlayerRef.current = new MediaPlayer(activeTriggers);
  }, [activeTriggers]);

  const runtimeSeconds = useMemo(() => {
    if (!startedAt) return 0;
    return Math.floor((Date.now() - startedAt) / 1000);
  }, [startedAt, finalSegments.length, detections.length]);

  const handleDetection = async (match) => {
    const { trigger, matchedPhrase, context } = match;
    const timestamp = Date.now();
    const id = `det_${timestamp}`;

    const nextAura = applyAuraModifier(auraScore, trigger.auraModifier);
    setAuraScore(nextAura);

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    mediaPlayerRef.current.playSound(trigger.id);

    const baseOverlay = {
      triggerId: trigger.id,
      matchedPhrase,
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
      timestamp,
      phrase: matchedPhrase,
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

    setTimeout(() => setOverlay(null), trigger?.media?.duration || 3000);

    void logDetection(event);
    void upsertSession(sessionId, {
      startedAt,
      totalDetections: detections.length + 1,
      finalAura: nextAura,
      mode
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());

      if (!speechRef.current) {
        speechRef.current = new SpeechListener({
          onFinal: handleFinalTranscript,
          onInterim: setInterimText,
          onError: (err) => setStatus(`Speech error: ${err}`)
        });
      }

      if (!startedAt) {
        const now = Date.now();
        setStartedAt(now);
        void upsertSession(sessionId, {
          startedAt: now,
          totalDetections: 0,
          finalAura: 0,
          mode
        });
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
      mode
    });

    setSessionId(makeSessionId());
    setStartedAt(null);
  };

  const replayDetection = (det) => {
    const fakeOverlay = {
      triggerId: det.phrase,
      matchedPhrase: det.phrase,
      media: {
        gif: `/assets/gifs/${String(det.phrase).toLowerCase().replace(/\s+/g, "-")}.gif`,
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
