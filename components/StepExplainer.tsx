"use client";

import React from "react";
import type { Step } from "@/lib/types";

interface StepExplainerProps {
  step: Step;
  verbose: boolean;
}

export default function StepExplainer({ step, verbose }: StepExplainerProps) {
  const isPruneStep = step.title.startsWith("Prune");
  const isOptimalStep = step.title.startsWith("✅");
  const isNewBestStep = step.title.startsWith("New Optimal");

  const accentClass = isOptimalStep
    ? "border-emerald-500 bg-emerald-950/40"
    : isNewBestStep
    ? "border-emerald-600 bg-emerald-950/20"
    : isPruneStep
    ? "border-rose-600 bg-rose-950/30"
    : "border-blue-600 bg-blue-950/20";

  const badgeClass = isOptimalStep
    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
    : isNewBestStep
    ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30"
    : isPruneStep
    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
    : "bg-blue-500/20 text-blue-300 border-blue-500/30";

  const lines = step.description.split("\n").filter(Boolean);

  return (
    <div
      className={`border rounded-2xl p-5 space-y-3 transition-all duration-300 ${accentClass}`}
    >
      {/* Step badge + title */}
      <div className="flex items-start gap-3 flex-wrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${badgeClass}`}
        >
          Step {step.stepNumber}
        </span>
        <h3 className="text-sm font-semibold text-white leading-snug">
          {step.title}
        </h3>
      </div>

      {/* Description */}
      {verbose && (
        <div className="space-y-1.5 border-t border-white/10 pt-3">
          {lines.map((line, i) => (
            <p key={i} className="text-xs text-gray-300 leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      )}

      {/* UC indicator */}
      <div className="flex items-center gap-4 text-xs pt-1">
        <span className="text-gray-400">
          UC (Best Cost):{" "}
          <span
            className={`font-semibold ${
              step.currentUC === Infinity ? "text-gray-500" : "text-emerald-400"
            }`}
          >
            {step.currentUC === Infinity ? "∞" : step.currentUC}
          </span>
        </span>
        <span className="text-gray-400">
          Active Node:{" "}
          <span className="font-semibold text-amber-400">
            {step.activeNodeId !== null ? `#${step.activeNodeId}` : "—"}
          </span>
        </span>
      </div>
    </div>
  );
}
