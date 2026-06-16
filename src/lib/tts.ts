// Free, zero-cost text-to-speech using the browser-native Web Speech API
// (window.speechSynthesis). No API keys, no paid services, no network calls to
// a TTS provider. Voice availability/quality depends on the user's OS/browser.

export type TTSStatus = "idle" | "playing" | "paused";

export interface TTSState {
  status: TTSStatus;
  rate: number;
  title: string;
  index: number; // current sentence
  total: number; // total sentences
}

export const SPEEDS = [0.75, 1, 1.5, 2] as const;
const RATE_KEY = "tts-rate";

// Split text into sentence-sized chunks. Speaking sentence-by-sentence works
// around the Chrome bug where a single long utterance is cut off after ~15s.
export function chunk(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const parts = clean.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [clean];
  const out: string[] = [];
  for (const p of parts) {
    const s = p.trim();
    if (!s) continue;
    // Keep utterances reasonably short even without punctuation.
    if (s.length <= 240) {
      out.push(s);
    } else {
      for (let i = 0; i < s.length; i += 240) out.push(s.slice(i, i + 240));
    }
  }
  return out;
}

function loadRate(): number {
  if (typeof window === "undefined") return 1;
  const v = Number(window.localStorage.getItem(RATE_KEY));
  return SPEEDS.includes(v as (typeof SPEEDS)[number]) ? v : 1;
}

class SpeechController {
  private chunks: string[] = [];
  private index = 0;
  private title = "";
  private status: TTSStatus = "idle";
  private rate = 1;
  private listeners = new Set<(s: TTSState) => void>();
  private keepalive: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.rate = loadRate();
      // Voices load asynchronously in some browsers; touch them early.
      window.speechSynthesis?.getVoices();
    }
  }

  private get synth(): SpeechSynthesis | null {
    return typeof window !== "undefined" ? window.speechSynthesis : null;
  }

  getState(): TTSState {
    return {
      status: this.status,
      rate: this.rate,
      title: this.title,
      index: this.index,
      total: this.chunks.length,
    };
  }

  subscribe(fn: (s: TTSState) => void): () => void {
    this.listeners.add(fn);
    fn(this.getState());
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const s = this.getState();
    this.listeners.forEach((fn) => fn(s));
  }

  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  play(text: string, title = "") {
    if (!this.synth) return;
    this.synth.cancel();
    this.chunks = chunk(text);
    this.index = 0;
    this.title = title;
    if (this.chunks.length === 0) {
      this.stop();
      return;
    }
    this.status = "playing";
    this.startKeepalive();
    this.speakCurrent();
    this.emit();
  }

  private speakCurrent() {
    if (!this.synth) return;
    const text = this.chunks[this.index];
    if (text === undefined) {
      this.stop();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = this.rate;
    u.onend = () => {
      // Only advance if this utterance finished naturally while playing.
      if (this.status !== "playing") return;
      this.index += 1;
      if (this.index >= this.chunks.length) {
        this.stop();
      } else {
        this.speakCurrent();
        this.emit();
      }
    };
    this.synth.speak(u);
  }

  pause() {
    if (!this.synth || this.status !== "playing") return;
    this.synth.pause();
    this.status = "paused";
    this.stopKeepalive();
    this.emit();
  }

  resume() {
    if (!this.synth || this.status !== "paused") return;
    this.synth.resume();
    this.status = "playing";
    this.startKeepalive();
    this.emit();
  }

  stop() {
    if (this.synth) this.synth.cancel();
    this.status = "idle";
    this.index = 0;
    this.chunks = [];
    this.title = "";
    this.stopKeepalive();
    this.emit();
  }

  // Rate can't change mid-utterance; restart the current sentence at new rate.
  setRate(rate: number) {
    this.rate = rate;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(RATE_KEY, String(rate));
    }
    if (this.synth && this.status !== "idle") {
      const wasPlaying = this.status === "playing";
      this.synth.cancel();
      if (wasPlaying) {
        this.status = "playing";
        this.speakCurrent();
      }
    }
    this.emit();
  }

  // Chrome pauses long-running synthesis when it thinks it's stalled; nudging
  // pause()/resume() periodically keeps it alive across queued utterances.
  private startKeepalive() {
    this.stopKeepalive();
    this.keepalive = setInterval(() => {
      if (this.synth && this.status === "playing") {
        this.synth.pause();
        this.synth.resume();
      }
    }, 10000);
  }

  private stopKeepalive() {
    if (this.keepalive) {
      clearInterval(this.keepalive);
      this.keepalive = null;
    }
  }
}

// Single shared instance so playback survives client-side navigation.
export const tts = new SpeechController();

export const TTS_PLAY_EVENT = "tts-play";

export interface TTSPlayDetail {
  text: string;
  title: string;
}

export function requestTTS(text: string, title: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<TTSPlayDetail>(TTS_PLAY_EVENT, { detail: { text, title } }),
  );
}
