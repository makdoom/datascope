import React, { useState, useRef } from "react";

export type IngestionMode = "naive" | "worker";

interface FileDropzoneProps {
  onFileSelected: (file: File, mode: IngestionMode) => void;
  isProcessing: boolean;
}

export function FileDropzone({
  onFileSelected,
  isProcessing,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [mode, setMode] = useState<IngestionMode>("naive");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!isProcessing) {
      setIsDragOver(true);
    }
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return;

    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.name.endsWith(".csv") ||
        file.name.endsWith(".tsv") ||
        file.type.includes("csv"))
    ) {
      onFileSelected(file, mode);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file, mode);
    }
    // Reset value so the user can re-select the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Mode Selector Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div>
          <div className="text-xs font-semibold text-slate-200">
            Execution Strategy
          </div>
          <div className="text-[11px] text-slate-400">
            {mode === "naive"
              ? "Synchronous Main Thread — Will trigger Long Tasks and frame drops"
              : "Dedicated Web Worker — Streaming chunks off-thread with 0ms jank"}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setMode("naive")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              mode === "naive"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Naive (Main Thread)
          </button>
          <button
            type="button"
            onClick={() => setMode("worker")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              mode === "worker"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Web Worker (Streaming)
          </button>
        </div>
      </div>

      {/* Drag & Drop Target Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
            : "border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/50"
        } ${isProcessing ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,text/csv"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 rounded-full bg-slate-800/80 text-indigo-400 border border-slate-700/60 shadow-lg">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <span className="font-semibold text-white">Click to upload</span> or
            drag and drop a CSV file
            <p className="text-xs text-slate-400 mt-1">
              Supports large CSV/TSV files (10MB–500MB+)
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 font-mono">
            <span>
              Generated samples available in <code>./data/</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
