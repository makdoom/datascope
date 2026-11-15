import type { FpsReading } from "./types";

/**
 * Create a rollindg window FPS and frame time tracker
 * @param windowSize The number of recent frames to average over (default: 60).
 */
export const createFpsTracker = (
  windowSize = 60,
): { tick: (now: number) => FpsReading; reset: () => void } => {
  let lastTime: number | null = null;
  const deltas: number[] = [];
  let sumDelta = 0;

  const reset = () => {
    lastTime = null;
    deltas.length = 0;
    sumDelta = 0;
  };

  const tick = (now: number): FpsReading => {
    if (lastTime == null) {
      lastTime = now;
      return { fps: 60, frameTimeMs: 16.67 };
    }

    // Difference between 2 consecutive frames
    const frameDiff = now - lastTime;
    lastTime = now;

    // Detect tab inactivity or background throttling (gap > 1000ms)
    if (frameDiff > 1000 || frameDiff <= 0) {
      deltas.length = 0;
      sumDelta = 0;
      // Return nominal values to avoid spikes
      return { fps: 60, frameTimeMs: 16.67 };
    }

    // Maintain circular buffer
    deltas.push(frameDiff);
    sumDelta += frameDiff;

    if (deltas.length > windowSize) {
      // Remove the oldest deltas
      const removed = deltas.shift();
      if (removed) sumDelta -= removed;
    }

    const avgDelta = sumDelta / deltas.length;
    const fps = Math.max(1, 1000 / avgDelta);

    return {
      fps,
      frameTimeMs: avgDelta,
    };
  };

  return {
    tick,
    reset,
  };
};
