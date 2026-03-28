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
  
  /**
   * Safari/iOS requirement: The first play must be triggered by a direct user gesture.
   * This "unlocks" the audio context for future background plays.
   */
  async unlock() {
    // Play a tiny silent sound to trigger the initial user-interaction requirement
    const silentBlob = new Blob(
      [new Uint8Array([71, 105, 102, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59])],
      { type: "audio/wav" }
    );
    const silentAudio = new Audio(URL.createObjectURL(silentBlob));
    try {
      await silentAudio.play();
    } catch (e) {
      console.warn("Audio unlock failed (likely no user gesture):", e);
    }
  }

  playSound(triggerId) {
    const audio = this.audioCache.get(triggerId);
    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;
      void audio.play();
      clearTimeout(audio._stopTimer);
      audio._stopTimer = setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 5000);
    } catch {
      // Ignore autoplay failures during hackathon demo.
    }
  }
}
