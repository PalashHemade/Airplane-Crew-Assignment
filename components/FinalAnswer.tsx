"use client";

import React from "react";
import type { Assignment } from "@/lib/types";

interface FinalAnswerProps {
  assignments: Assignment[];
  matrix: number[][];
}

export default function FinalAnswer({ assignments, matrix }: FinalAnswerProps) {
  const totalCost = assignments.reduce((s, a) => s + matrix[a.crew][a.flight], 0);

  return (
    <div className="bg-gradient-to-br from-emerald-50 dark:from-emerald-950/60 to-white dark:to-gray-900 border border-emerald-300 dark:border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/30">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">✅</span>
        <div>
          <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Optimal Solution Found!</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Branch &amp; Bound has finished — no better solution exists.</p>
        </div>
      </div>

      {/* Assignments */}
      <div className="space-y-2">
        {assignments
          .slice()
          .sort((a, b) => a.crew - b.crew)
          .map((a) => (
            <div key={a.crew} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium w-6">C{a.crew + 1}</span>
                <span className="text-sm text-gray-700 dark:text-white">→</span>
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">F{a.flight + 1}</span>
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 tabular-nums">
                cost: {matrix[a.crew][a.flight]}
              </span>
            </div>
          ))}
      </div>

      {/* Total */}
      <div className="border-t border-emerald-200 dark:border-emerald-500/20 pt-3 flex justify-between items-center">
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Minimum Total Cost</span>
        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{totalCost}</span>
      </div>
    </div>
  );
}
