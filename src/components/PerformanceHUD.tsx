import { useEffect, useRef, useState } from "react";
import { createFpsTracker } from "../telemetry/fpsTracker";
import type { HeapMemoryReading } from "../telemetry/types";
import { getDomNodeCount, getHeapMemory } from "../telemetry/memoryTracker";

const PerformanceHUD = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fps, setFps] = useState(60);
  const [frameTimeMs, setFrameTimeMs] = useState(16.7);
  const [domCount, setDomCount] = useState(0);
  const [heapMemory, setHeapMemory] = useState<HeapMemoryReading | null>(null);

  const trackerRef = useRef(createFpsTracker(60));
  const requestAnimationFrameIdRef = useRef<number | null>(null);
  const lastSampleTimeRef = useRef(0);

  useEffect(() => {
    const tracker = trackerRef.current;
    tracker.reset();

    const loop = (now: number) => {
      const reading = tracker.tick(now);

      // Frame time updates every frame
      setFps(reading.fps);
      setFrameTimeMs(reading.frameTimeMs);

      // memory and dom count
      // DOM count & memory are throttled to sample once every 500ms
      if (now - lastSampleTimeRef.current >= 500) {
        lastSampleTimeRef.current = now;
        setDomCount(getDomNodeCount());
        setHeapMemory(getHeapMemory());
      }

      requestAnimationFrameIdRef.current = requestAnimationFrame(loop);
    };

    requestAnimationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestAnimationFrameIdRef.current) {
        cancelAnimationFrame(requestAnimationFrameIdRef.current);
        requestAnimationFrameIdRef.current = null;
      }
    };
  }, []);

  // Determine FPS status color badge
  const fpsRounded = Math.round(fps);
  const fpsBadgeColor =
    fpsRounded >= 55
      ? "bg-emerald-500 text-emerald-400"
      : fpsRounded >= 30
        ? "bg-amber-500 text-amber-400"
        : "bg-rose-500 text-rose-400";

  const dotColor =
    fpsRounded >= 55
      ? "bg-emerald-400"
      : fpsRounded >= 30
        ? "bg-amber-400"
        : "bg-rose-400";

  return (
    <aside
      data-testid="performance-hud"
      aria-label="Performance Telemetry HUD"
      className="fixed bottom-4 right-4 z-50 font-mono text-xs select-none"
    >
      {/* Compact Pill Toggle */}
      <button
        data-testid="performance-hud-toggle"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-full border border-slate-800 bg-slate-900/90 px-3.5 py-1.5 text-slate-200 shadow-xl backdrop-blur-md transition hover:border-slate-700 hover:bg-slate-800/90 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span
          className={`h-2.5 w-2.5 rounded-full ${dotColor} animate-pulse`}
        />
        <span className="font-semibold text-white">{fpsRounded} FPS</span>
        <span className="text-slate-400">({frameTimeMs.toFixed(1)}ms)</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          {isExpanded ? "▼" : "▲ HUD"}
        </span>
      </button>

      {/* Expanded Diagnostics Drawer */}
      {isExpanded && (
        <div className="mt-2 w-72 rounded-xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="font-semibold text-slate-100 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${dotColor}`} />
              Performance Telemetry HUD
            </span>
            <span className="text-[10px] text-slate-500">
              Press ` to toggle
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {/* FPS */}
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2">
              <div className="text-slate-400 text-[10px] uppercase">
                Frame Rate
              </div>
              <div
                className={`text-base font-bold ${fpsBadgeColor.split(" ")[1]}`}
              >
                {fpsRounded}{" "}
                <span className="text-[10px] font-normal text-slate-400">
                  FPS
                </span>
              </div>
              <div className="text-[9px] text-slate-500">Target: 60 FPS</div>
            </div>

            {/* Frame Time */}
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2">
              <div className="text-slate-400 text-[10px] uppercase">
                Frame Time
              </div>
              <div className="text-base font-bold text-white">
                {frameTimeMs.toFixed(1)}{" "}
                <span className="text-[10px] font-normal text-slate-400">
                  ms
                </span>
              </div>
              <div className="text-[9px] text-slate-500">
                Budget: &le; 16.6ms
              </div>
            </div>

            {/* DOM Elements */}
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2">
              <div className="text-slate-400 text-[10px] uppercase">
                DOM Elements
              </div>
              <div className="text-base font-bold text-indigo-400">
                {domCount}
              </div>
              <div className="text-[9px] text-slate-500">Target: &le; 500</div>
            </div>

            {/* Heap Memory */}
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2">
              <div className="text-slate-400 text-[10px] uppercase">
                JS Heap (RAM)
              </div>
              {heapMemory ? (
                <>
                  <div className="text-base font-bold text-emerald-400">
                    {heapMemory.usedMb}{" "}
                    <span className="text-[10px] font-normal text-slate-400">
                      MB
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Total: {heapMemory.totalMb} MB
                  </div>
                </>
              ) : (
                <div className="text-slate-500 text-[10px] mt-1">
                  N/A (Chromium only)
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
export default PerformanceHUD;
