function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Levenshtein edit distance — returns number of single-char edits to turn a into b.
// Fast-rejects if the length difference alone exceeds the threshold.
function levenshtein(a, b, maxDist = 2) {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev.splice(0, prev.length, ...curr);
  }
  return prev[b.length];
}

// Only fuzzy-match phrases that are long enough to have unambiguous mishears.
// Short words (≤4 chars) must match exactly — too many false positives otherwise.
function fuzzyThreshold(phraseLen) {
  return phraseLen >= 5 ? 1 : 0;
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
    // Pre-split into words once for fuzzy matching
    const words = lower.split(/\s+/).filter(Boolean);
    const matches = [];

    for (const trigger of this.triggers) {
      const last = this.cooldowns.get(trigger.id);
      if (last && now - last < this.cooldownMs) continue;

      for (const phraseRaw of trigger.phrases || []) {
        const phrase = phraseRaw.toLowerCase();
        let matched = false;

        // — Exact / substring matching (primary) —
        if (trigger.matchType === "substring") {
          matched = lower.includes(phrase);
        } else {
          const rx = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i");
          matched = rx.test(lower);
        }

        // — Fuzzy fallback for single-word phrases (handles distant/muffled speech) —
        // Only kicks in when exact match failed and the phrase is long enough
        // to have a meaningful edit-distance threshold (avoids false positives
        // on short words like "sus", "npc", "ohio").
        if (!matched && !phrase.includes(" ")) {
          const threshold = fuzzyThreshold(phrase.length);
          if (threshold > 0) {
            matched = words.some(
              (w) => levenshtein(w, phrase, threshold) <= threshold
            );
          }
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
