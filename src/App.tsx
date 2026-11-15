import { useState } from "react";
import PerformanceHUD from "./components/PerformanceHUD";
import { FileDropzone, type IngestionMode } from "./components/FileDropzone";

interface BenchmarkResult {
  fileName: string;
  fileSizeBytes: number;
  durationMs: number;
  rowCount: number;
  mode: IngestionMode;
}

const App = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<BenchmarkResult | null>(null);

  const handleFileSelected = (file: File, mode: IngestionMode) => {
    if (mode === "naive") {
      runNaiveIngestion(file);
    } else {
      // Worker mode will be connected in Milestone 2.2 / 2.3
      alert(
        "Worker Streaming Mode will be enabled in Task 2 & 3! For now, run in Naive mode to observe the main-thread freeze.",
      );
    }
  };

  const runNaiveIngestion = (file: File) => {
    setIsProcessing(true);
    setStatusText(
      `[Naive Mode] Reading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB) into memory via FileReader.readAsText()...`,
    );

    const reader = new FileReader();

    reader.onload = (e) => {
      setStatusText(
        `[Naive Mode] File loaded into V8 string. Now parsing ${file.name} on the MAIN THREAD (Watch the spinner freeze)...`,
      );

      // Allow one frame for the status text to render before blocking the event loop
      setTimeout(() => {
        const parseStart = performance.now();
        const rawText = e.target?.result as string;

        // NAIVE APPROACH: Splitting a 50MB string into millions of substrings and objects on the Main Thread
        const lines = rawText.split("\n");
        const headers = (lines[0] || "").split(",");
        const rows: Array<Record<string, string>> = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;
          const cols = line.split(",");
          const rowObj: Record<string, string> = {};
          for (let c = 0; c < headers.length; c++) {
            const header = headers[c];
            if (header) {
              rowObj[header] = cols[c] || "";
            }
          }
          rows.push(rowObj);
        }

        const parseDuration = performance.now() - parseStart;

        setLastResult({
          fileName: file.name,
          fileSizeBytes: file.size,
          durationMs: parseDuration,
          rowCount: rows.length,
          mode: "naive",
        });

        setIsProcessing(false);
        setStatusText(null);
      }, 50);
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            D
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Big Data Explorer
            </h1>
            <p className="text-xs text-slate-400">
              Phase 2: Ingestion & Web Worker Pipeline
            </p>
          </div>
        </div>

        {/* Live Animation Indicator: Freezes during Main Thread Long Tasks */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Main Thread Vsync Heartbeat</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        {/* Lab Overview Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                Milestone 2.1 Failure Lab
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Main Thread Blocking Demonstration
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">
                Sample files ready in
              </span>
              <div className="text-xs font-mono text-emerald-400">
                ./data/sample-25mb.csv (230k rows)
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Drag and drop <code>sample-25mb.csv</code> or{" "}
            <code>sample-50mb.csv</code> using{" "}
            <strong>Naive (Main Thread)</strong> mode. Watch the{" "}
            <em>Heartbeat</em> indicator above freeze solid and the Performance
            HUD plunge to <strong>0 FPS</strong> while the main thread event
            loop is blocked.
          </p>
        </div>

        {/* Dropzone */}
        <FileDropzone
          onFileSelected={handleFileSelected}
          isProcessing={isProcessing}
        />

        {/* In-Flight Processing Status */}
        {isProcessing && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 flex items-center gap-3">
            <svg
              className="animate-spin h-5 w-5 text-amber-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <div className="text-xs font-mono">{statusText}</div>
          </div>
        )}

        {/* Benchmark Result Card */}
        {lastResult && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-4 border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                <span className="font-semibold text-rose-200 text-sm">
                  Naive Main Thread Result
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {(lastResult.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                &bull; {lastResult.fileName}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] uppercase text-slate-400 font-mono">
                  Main Thread Blocked
                </div>
                <div className="text-2xl font-bold text-rose-400 mt-1">
                  {(lastResult.durationMs / 1000).toFixed(2)}s
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {Math.round(lastResult.durationMs)} ms freeze
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] uppercase text-slate-400 font-mono">
                  Rows Parsed
                </div>
                <div className="text-2xl font-bold text-white mt-1">
                  {lastResult.rowCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Objects created in state
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] uppercase text-slate-400 font-mono">
                  Verdict
                </div>
                <div className="text-sm font-bold text-amber-400 mt-2">
                  Catastrophic Jank
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Zero UI responsiveness
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Performance Telemetry HUD */}
      <PerformanceHUD />
    </div>
  );
};
export default App;
