import { useEffect, useState } from "react";

export default function AdvicePopup({ advice }) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!advice) {
      setTyped("");
      return;
    }

    let i = 0;
    setTyped("");
    const timer = setInterval(() => {
      i += 1;
      setTyped(advice.slice(0, i));
      if (i >= advice.length) clearInterval(timer);
    }, 18);

    return () => clearInterval(timer);
  }, [advice]);

  if (!advice) return null;
  return <div className="advice">{typed}</div>;
}
