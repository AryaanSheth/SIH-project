export default function Controls({ isListening, mode, onStart, onStop, onToggleMode }) {
  return (
    <div className="controls">
      {!isListening ? (
        <button className="primary" type="button" onClick={onStart}>
          START LISTENING
        </button>
      ) : (
        <button className="danger" type="button" onClick={onStop}>
          STOP
        </button>
      )}
      <button type="button" onClick={onToggleMode}>
        Mode: {mode}
      </button>
      <a href="/feed" target="_blank" rel="noreferrer">
        <button type="button">Open Feed</button>
      </a>
    </div>
  );
}
