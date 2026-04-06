"use client";

import React from "react";
import type { Step, BBNode } from "@/lib/types";

interface LiveQueueProps {
  step: Step;
}

const STATUS_STYLE: Record<string, string> = {
  unexplored: "text-gray-300 bg-gray-800 border-gray-600",
  active: "text-amber-300 bg-amber-950/40 border-amber-500/40",
  expanded: "text-blue-300 bg-blue-950/30 border-blue-500/30",
  pruned: "text-rose-300 bg-rose-950/30 border-rose-500/30",
  optimal: "text-emerald-300 bg-emerald-950/30 border-emerald-500/30",
};

const STATUS_ICON: Record<string, string> = {
  unexplored: "○",
  active: "◉",
  expanded: "●",
  pruned: "❌",
  optimal: "✅",
};

export default function LiveQueue({ step }: LiveQueueProps) {
  const sorted = [...step.liveQueue].sort((a, b) => a.lc - b.lc);
  const best = sorted[0];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-white">
          🔢 Live Nodes (Priority Queue)
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Sorted by LC — lowest LC is selected next
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-gray-500 italic py-2">
          Queue is empty — algorithm finished.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
          {sorted.map((node, i) => (
            <div
              key={node.id}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                STATUS_STYLE[node.status] ?? STATUS_STYLE.unexplored
              } ${i === 0 ? "ring-1 ring-blue-400" : ""}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{STATUS_ICON[node.status]}</span>
                <span className="font-medium shrink-0">Node {node.id}</span>
                <span className="text-gray-400 truncate">
                  {node.assignments.length === 0
                    ? "Root"
                    : node.assignments
                        .map((a) => `C${a.crew + 1}→F${a.flight + 1}`)
                        .join(", ")}
                </span>
              </div>
              <span className="font-bold tabular-nums shrink-0 ml-2">
                LC={node.lc}
              </span>
            </div>
          ))}
        </div>
      )}

      {best && (
        <div className="border-t border-gray-700 pt-3">
          <p className="text-xs text-gray-400">
            ▶&nbsp;
            <span className="text-blue-300 font-semibold">
              Selected next: Node {best.id}
            </span>{" "}
            with minimum LC = {best.lc}
          </p>
        </div>
      )}
    </div>
  );
}
