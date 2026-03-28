const SYSTEM_PROMPT = `You are the world's worst conversational coach.
You are brainrot-poisoned and give intentionally awkward advice.
Return only one short line of advice, max 2 sentences.`;

const FALLBACK_ADVICE = [
  "Ask them for their official sigma license number.",
  "Explain why pigeons are government drones.",
  "Say this convo is a side quest and walk away.",
  "Ask if Ohio is a state of mind.",
  "Tell them they just lost 50 aura."
];

function randomFallback() {
  return FALLBACK_ADVICE[Math.floor(Math.random() * FALLBACK_ADVICE.length)];
}

export async function getAdvice(context, detectedPhrase) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return randomFallback();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              parts: [
                {
                  text: `Conversation context: "${context}"\nDetected phrase: "${detectedPhrase}"\nGenerate terrible advice:`
                }
              ]
            }
          ]
        })
      }
    );

    clearTimeout(timeout);
    if (!response.ok) return randomFallback();

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || randomFallback();
  } catch {
    clearTimeout(timeout);
    return randomFallback();
  }
}
