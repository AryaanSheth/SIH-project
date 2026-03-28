import AdvicePopup from "./AdvicePopup";

export default function MediaOverlay({ overlay }) {
  if (!overlay) return null;

  const hasVideo = Boolean(overlay.media?.video);
  const hasGif = Boolean(overlay.media?.gif);

  return (
    <div className="overlay">
      <div>
        {hasVideo ? (
          <video src={overlay.media.video} autoPlay muted playsInline />
        ) : hasGif ? (
          <img src={overlay.media.gif} alt={overlay.triggerId} />
        ) : (
          <div className="panel" style={{ padding: 24, textAlign: "center" }}>
            Media missing for {overlay.triggerId}
          </div>
        )}
        <div className="overlay-caption">DETECTED: {overlay.matchedPhrase?.toUpperCase()}</div>
        {overlay.auraModifier !== undefined ? (
          <div className="overlay-caption" style={{ color: overlay.auraModifier >= 0 ? "#00C389" : "#EF4444" }}>
            {overlay.auraModifier >= 0 ? `+${overlay.auraModifier}` : overlay.auraModifier} AURA
          </div>
        ) : null}
        <AdvicePopup advice={overlay.badAdvice || null} />
      </div>
    </div>
  );
}
