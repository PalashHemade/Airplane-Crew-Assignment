"use client";

import React from "react";

interface ControlBarProps {
  stepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (s: number) => void;
}

const SPEEDS = [
  { label: "Slow", ms: 2000 },
  { label: "Normal", ms: 1000 },
  { label: "Fast", ms: 400 },
];

export default function ControlBar({
  stepIndex, totalSteps, isPlaying, onPrev, onNext, onPlay, onPause, onReset, speed, onSpeedChange,
}: ControlBarProps) {
  const progress = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3 shadow-sm">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 dark:text-gray-400 w-20 shrink-0 tabular-nums">
          Step {stepIndex + 1} / {totalSteps}
        </span>
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm transition-colors border border-gray-300 dark:border-gray-600"
          >
            ↺ Reset
          </button>
          <button
            onClick={onPrev}
            disabled={stepIndex === 0}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium transition-colors border border-gray-300 dark:border-gray-600 disabled:opacity-40"
          >
            ← Prev
          </button>
          {isPlaying ? (
            <button
              onClick={onPause}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium transition-colors shadow shadow-amber-500/30"
            >
              ⏸ Pause
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={stepIndex >= totalSteps - 1}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shadow shadow-blue-500/30 disabled:opacity-40"
            >
              ▶ Play
            </button>
          )}
          <button
            onClick={onNext}
            disabled={stepIndex >= totalSteps - 1}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium transition-colors border border-gray-300 dark:border-gray-600 disabled:opacity-40"
          >
            Next →
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Speed:</span>
          <div className="flex gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s.ms}
                onClick={() => onSpeedChange(s.ms)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  speed === s.ms
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
