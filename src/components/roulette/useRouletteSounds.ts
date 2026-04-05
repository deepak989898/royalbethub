"use client";

import { useCallback, useRef } from "react";

function beep(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.08
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function useRouletteSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ctx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playSpin = useCallback(() => {
    const c = ctx();
    if (!c) return;
    void c.resume();
    beep(c, 180, 0.15, "triangle", 0.06);
    setTimeout(() => beep(c, 220, 0.12, "triangle", 0.05), 80);
    setTimeout(() => beep(c, 260, 0.2, "sine", 0.04), 400);
  }, [ctx]);

  const playWin = useCallback(() => {
    const c = ctx();
    if (!c) return;
    void c.resume();
    beep(c, 523, 0.1, "square", 0.05);
    setTimeout(() => beep(c, 659, 0.12, "square", 0.05), 100);
    setTimeout(() => beep(c, 784, 0.18, "square", 0.04), 200);
  }, [ctx]);

  const playChip = useCallback(() => {
    const c = ctx();
    if (!c) return;
    void c.resume();
    beep(c, 440, 0.05, "sine", 0.03);
  }, [ctx]);

  return { playSpin, playWin, playChip };
}
