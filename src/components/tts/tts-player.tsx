"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  tts,
  SPEEDS,
  TTS_PLAY_EVENT,
  type TTSPlayDetail,
  type TTSState,
} from "@/lib/tts";

const EMPTY: TTSState = { status: "idle", rate: 1, title: "", index: 0, total: 0 };

export function TTSPlayer() {
  const state = useSyncExternalStore(
    (cb) => tts.subscribe(cb),
    () => tts.getState(),
    () => EMPTY,
  );
  const [unsupported, setUnsupported] = useState(false);

  // Start/replace playback when a note or selection requests it.
  useEffect(() => {
    function onPlay(e: Event) {
      const detail = (e as CustomEvent<TTSPlayDetail>).detail;
      if (!tts.isSupported()) {
        setUnsupported(true);
        return;
      }
      setUnsupported(false);
      tts.play(detail.text, detail.title);
    }
    window.addEventListener(TTS_PLAY_EVENT, onPlay);
    return () => window.removeEventListener(TTS_PLAY_EVENT, onPlay);
  }, []);

  // Stop speech if the page is fully unloaded.
  useEffect(() => {
    const stop = () => tts.stop();
    window.addEventListener("beforeunload", stop);
    return () => window.removeEventListener("beforeunload", stop);
  }, []);

  const visible = state.status !== "idle" || unsupported;
  const playing = state.status === "playing";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed inset-x-0 bottom-4 z-[90] mx-auto flex w-[min(92vw,640px)] items-center gap-3 rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 shadow-lg backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/80"
          role="region"
          aria-label="Audio player"
        >
          {unsupported ? (
            <>
              <span className="flex-1 text-sm text-neutral-600 dark:text-neutral-300">
                Text-to-speech isn&apos;t supported in this browser.
              </span>
              <IconButton label="Dismiss" onClick={() => setUnsupported(false)}>
                <CloseIcon />
              </IconButton>
            </>
          ) : (
            <>
              {/* Play / pause */}
              <IconButton
                label={playing ? "Pause" : "Resume"}
                onClick={() => (playing ? tts.pause() : tts.resume())}
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </IconButton>

              {/* Stop */}
              <IconButton label="Stop" onClick={() => tts.stop()}>
                <StopIcon />
              </IconButton>

              {/* Title + progress */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
                  {state.title || "Reading"}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  {playing ? "Playing" : "Paused"}
                  {state.total > 0 &&
                    ` · ${Math.min(state.index + 1, state.total)}/${state.total}`}
                </p>
              </div>

              {/* Speed selector */}
              <div className="flex items-center gap-0.5 rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800/80">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => tts.setRate(s)}
                    aria-label={`Speed ${s} times`}
                    className={`rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums transition-colors ${
                      state.rate === s
                        ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-50"
                        : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>

              {/* Close */}
              <IconButton label="Close player" onClick={() => tts.stop()}>
                <CloseIcon />
              </IconButton>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
    >
      {children}
    </button>
  );
}

const svg = "h-4 w-4";

function PlayIcon() {
  return (
    <svg className={svg} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg className={svg} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}
function StopIcon() {
  return (
    <svg className={svg} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
