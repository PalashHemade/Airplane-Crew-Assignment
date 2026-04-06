"use client";

import React from "react";
import type { Step } from "@/lib/types";

interface StepExplainerProps {
  step: Step;
  verbose: boolean;
}

export default function StepExplainer({ step, verbose }: StepExplainerProps) {
  const isPrune = step.title.startsWith("Prune");
  const isOptimal = step.title.startsWith("✅");
  const isNewBest = step.title.startsWith("New Optimal");

  const containerClass = isOptimal
    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
    : isNewBest
    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
    : isPrune
    ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30"
    : "border-blue-500 bg-blue-50 dark:bg-blue-950/20";

  const badgeClass = isOptimal
    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-500/40"
    : isNewBest
    ? "bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border-emerald-400 dark:border-emerald-600/30"
    : isPrune
    ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400 dark:border-rose-500/40"
    : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-500/30";

  const lines = step.description.split("\n").filter(Boolean);

  return (
    <div className={`border rounded-2xl p-5 space-y-3 transition-all duration-300 ${containerClass}`}>
      {/* Badge + title */}
      <div className="flex items-start gap-3 flex-wrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${badgeClass}`}>
          Step {step.stepNumber}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
          {step.title}
        </h3>
      </div>

      {/* Description */}
      {verbose && (
        <div className="space-y-1.5 border-t border-gray-200 dark:border-white/10 pt-3">
          {lines.map((line, i) => (
            <p key={i} className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      )}

      {/* UC + Active node */}
      <div className="flex items-center gap-4 text-xs pt-1">
        <span className="text-gray-500 dark:text-gray-400">
          UC (Best Cost):{" "}
          <span className={`font-semibold ${step.currentUC === Infinity ? "text-gray-400 dark:text-gray-500" : "text-emerald-600 dark:text-emerald-400"}`}>
            {step.currentUC === Infinity ? "∞" : step.currentUC}
          </span>
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          Active Node:{" "}
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {step.activeNodeId !== null ? `#${step.activeNodeId}` : "—"}
          </span>
        </span>
      </div>
    </div>
  );
}
