export class MediaPlayer {
  constructor(triggers = []) {
    this.audioCache = new Map();

    for (const trigger of triggers) {
      const url = trigger?.media?.sound;
      if (!url) continue;
      const audio = new Audio(url);
      audio.preload = "auto";
      this.audioCache.set(trigger.id, audio);
    }
  }

  playSound(triggerId) {
    const audio = this.audioCache.get(triggerId);
    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;
      void audio.play();
    } catch {
      // Ignore autoplay failures during hackathon demo.
    }
  }
}
