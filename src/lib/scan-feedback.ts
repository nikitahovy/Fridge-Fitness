/**
 * Cross-platform scan feedback — fires multiple channels at once so
 * the user gets confirmation regardless of device support.
 *
 * - navigator.vibrate: Android Chrome/Firefox only. iOS Safari ignores it.
 * - Web Audio beep: works everywhere including iOS Safari, as long as
 *   the audio context is resumed (we lazily create + resume it on first
 *   call, which is fine because scan detection happens after the user
 *   has already tapped through to the camera screen).
 *
 * Use:
 *   import { playScanFeedback } from "@/lib/scan-feedback";
 *   playScanFeedback(); // call when a barcode is detected
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    return audioCtx;
  } catch {
    return null;
  }
}

function playBeep(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // iOS Safari starts the context in "suspended" state — resume on demand.
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Classic checkout-scanner ding: 880Hz for ~80ms with quick fade
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    // best-effort, audio failures shouldn't break the scan flow
  }
}

function vibrate(): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  // Pattern: short buzz, gap, longer buzz — much more noticeable than a
  // single 100ms blip on Android. Some browsers ignore it on first call,
  // so fire twice with a tiny delay.
  try {
    navigator.vibrate([40, 30, 80]);
  } catch {
    // ignore
  }
}

export function playScanFeedback(): void {
  vibrate();
  playBeep();
}
