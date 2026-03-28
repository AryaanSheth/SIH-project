export class SpeechListener {
  constructor({ onFinal, onInterim, onError }) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      throw new Error("Web Speech API is not available in this browser.");
    }

    this.onFinal = onFinal;
    this.onInterim = onInterim;
    this.onError = onError;
    this.isListening = false;
    this.restartTimer = null;

    this.recognition = new Recognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    this.recognition.onresult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const chunk = (result[0]?.transcript || "").trim();
        if (!chunk) continue;

        if (result.isFinal) {
          this.onFinal?.(chunk, result[0]?.confidence ?? null);
        } else {
          interim = `${interim} ${chunk}`.trim();
        }
      }

      this.onInterim?.(interim);
    };

    this.recognition.onerror = (event) => {
      this.onError?.(event.error || "speech-error");
    };

    this.recognition.onend = () => {
      if (!this.isListening) return;
      clearTimeout(this.restartTimer);
      this.restartTimer = setTimeout(() => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch {
            // ignore duplicate start race
          }
        }
      }, 200);
    };
  }

  start() {
    this.isListening = true;
    this.recognition.start();
  }

  stop() {
    this.isListening = false;
    clearTimeout(this.restartTimer);
    this.recognition.stop();
  }
}
