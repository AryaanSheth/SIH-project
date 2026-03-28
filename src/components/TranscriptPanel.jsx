import { useEffect, useRef } from "react";

export default function TranscriptPanel({ finalSegments, interimText }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [finalSegments, interimText]);

  return (
    <div className="panel transcript-panel code" ref={scrollRef}>
      <h3 style={{ marginTop: 0 }}>TRANSCRIPT</h3>
      {finalSegments.map((seg, i) => (
        <div className="transcript-final" key={`${seg.timestamp}-${i}`}>
          {seg.text}
        </div>
      ))}
      {interimText ? <div className="transcript-interim">{interimText}</div> : null}
    </div>
  );
}
