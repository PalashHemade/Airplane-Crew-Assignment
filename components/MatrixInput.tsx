"use client";

import React from "react";

interface MatrixInputProps {
  n: number;
  matrix: number[][];
  onNChange: (n: number) => void;
  onMatrixChange: (r: number, c: number, val: number) => void;
  onLoadDefault: () => void;
  onVisualize: () => void;
  isRunning: boolean;
}

const CREW_COLORS = [
  "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300",
  "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300",
  "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300",
  "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300",
  "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300",
];

export default function MatrixInput({
  n, matrix, onNChange, onMatrixChange, onLoadDefault, onVisualize, isRunning,
}: MatrixInputProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cost Matrix</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Rows = Crews &nbsp;·&nbsp; Columns = Flights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-300 font-medium">Size:</label>
          <select
            value={n}
            onChange={(e) => onNChange(Number(e.target.value))}
            disabled={isRunning}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {[3, 4, 5, 6].map((v) => (
              <option key={v} value={v}>{v} × {v}</option>
            ))}
          </select>
          <button
            onClick={onLoadDefault}
            disabled={isRunning}
            className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 transition-colors disabled:opacity-50"
          >
            Load Default
          </button>
        </div>
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="w-16 text-xs text-gray-400 dark:text-gray-500 font-medium pb-2" />
              {Array.from({ length: n }, (_, f) => (
                <th key={f} className="text-center text-xs font-semibold text-blue-600 dark:text-blue-400 pb-2 px-2">
                  F{f + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, r) => (
              <tr key={r}>
                <td className="pr-2 py-1">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold ${CREW_COLORS[r % CREW_COLORS.length]}`}>
                    C{r + 1}
                  </span>
                </td>
                {Array.from({ length: n }, (_, c) => (
                  <td key={c} className="px-1 py-1">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={matrix[r]?.[c] ?? ""}
                      disabled={isRunning}
                      onChange={(e) => onMatrixChange(r, c, Number(e.target.value) || 0)}
                      className="w-14 text-center bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-colors"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visualize button */}
      <button
        onClick={onVisualize}
        disabled={isRunning}
        className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm tracking-wide"
      >
        {isRunning ? "Visualization in Progress…" : "▶ Visualize Branch & Bound"}
      </button>
    </div>
  );
}
