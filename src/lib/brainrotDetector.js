function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class BrainrotDetector {
  constructor(triggers, cooldownMs = 5000) {
    this.triggers = triggers;
    this.cooldownMs = cooldownMs;
    this.cooldowns = new Map();
    this.processedSegments = new Set();
  }

  detect(transcriptSegment) {
    if (!transcriptSegment || !transcriptSegment.trim()) return [];
    const segment = transcriptSegment.trim();
    const segmentKey = segment.toLowerCase();
    if (this.processedSegments.has(segmentKey)) return [];
    this.processedSegments.add(segmentKey);
    if (this.processedSegments.size > 500) {
      const firstKey = this.processedSegments.values().next().value;
      this.processedSegments.delete(firstKey);
    }

    const now = Date.now();
    const lower = segment.toLowerCase();
    const matches = [];

    for (const trigger of this.triggers) {
      const last = this.cooldowns.get(trigger.id);
      if (last && now - last < this.cooldownMs) continue;

      for (const phraseRaw of trigger.phrases || []) {
        const phrase = phraseRaw.toLowerCase();
        let matched = false;

        if (trigger.matchType === "substring") {
          matched = lower.includes(phrase);
        } else {
          const rx = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i");
          matched = rx.test(lower);
        }

        if (matched) {
          this.cooldowns.set(trigger.id, now);
          matches.push({
            trigger,
            matchedPhrase: phraseRaw,
            context: this.extractContext(segment, phraseRaw)
          });
          break;
        }
      }
    }

    return matches.sort((a, b) => b.trigger.severity - a.trigger.severity);
  }

  extractContext(text, phrase) {
    const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
    if (idx === -1) return text;

    const before = text.slice(0, idx).trim().split(/\s+/).filter(Boolean).slice(-5);
    const after = text
      .slice(idx + phrase.length)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5);

    return [...before, phrase, ...after].join(" ").trim();
  }
}
