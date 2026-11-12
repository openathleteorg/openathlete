import { getLocale } from '@/paraglide/runtime';

/**
 * What the player says and plays, so the athlete can keep the phone on the
 * floor: beeps from the browser's own synthesizer and the system voice in
 * the app's language. Nothing is downloaded and nothing leaves the device.
 */

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Context =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Context) return null;
  context ??= new Context();
  return context;
}

/** Browsers start audio only from a tap: call it from the start button */
export function unlockAudio() {
  const ctx = audio();
  if (ctx?.state === 'suspended') void ctx.resume();
  // An empty utterance opens speech on iOS as well
  try {
    window.speechSynthesis?.speak(new SpeechSynthesisUtterance(''));
  } catch {
    // No speech on this device: beeps only
  }
}

/** A short beep, higher and longer for the go */
export function beep(kind: 'tick' | 'go' = 'tick') {
  const ctx = audio();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = kind === 'go' ? 1320 : 880;
  const length = kind === 'go' ? 0.45 : 0.15;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + length);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + length + 0.05);
}

const VOICE_LANG: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  'pt-BR': 'pt-BR',
};

export function speak(text: string) {
  const synth =
    typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  if (!synth || !text) return;
  try {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = VOICE_LANG[getLocale()] ?? 'en-US';
    utterance.rate = 1.05;
    synth.speak(utterance);
  } catch {
    // Speech is a help, never a requirement
  }
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Not on iOS: the beep says it
  }
}
