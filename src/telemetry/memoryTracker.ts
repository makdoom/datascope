import type { HeapMemoryReading } from "./types";

type PerformanceWithMemory = Performance & {
  memory: {
    totalJSHeapSize: number;
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
};

/**
 * Reads estimated JS heap memory in Megabytes if supported (Chromium browsers).
 * Returns null in Firefox / Safari or environments without performance.memory.
 */
export const getHeapMemory = (): HeapMemoryReading => {
  if (typeof performance === "undefined") return null;

  const perf = performance as PerformanceWithMemory;
  if (!perf.memory) return null;

  const { usedJSHeapSize, totalJSHeapSize } = perf.memory;
  const bytesInMb = 1024 * 1024;

  return {
    usedMb: Math.round((usedJSHeapSize / bytesInMb) * 10) / 10,
    totalMb: Math.round((totalJSHeapSize / bytesInMb) * 10) / 10,
  };
};

/**
 * Counts total active DOM elements in the document.
 * Crucial for verifying that 2D virtualization maintains a constant DOM pool.
 */
export function getDomNodeCount(): number {
  if (typeof document === "undefined") {
    return 0;
  }
  return document.getElementsByTagName("*").length;
}
