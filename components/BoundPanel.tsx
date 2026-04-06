"use client";

import React from "react";
import type { LCBreakdown } from "@/lib/types";

interface BoundPanelProps {
  breakdown: LCBreakdown;
  currentUC: number;
}

export default function BoundPanel({ breakdown, currentUC }: BoundPanelProps) {
  const fixedRows = breakdown.rows.filter((r) => r.isFixed);
  const remainingRows = breakdown.rows.filter((r) => !r.isFixed);
  const fixedCost = fixedRows.reduce((s, r) => s + r.cost, 0);
  const remainingCost = remainingRows.reduce((s, r) => s + r.cost, 0);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white">
          📐 Bound Calculation
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          LC = fixed path cost + minimum remaining cost
        </p>
      </div>

      {/* Fixed assignments */}
      {fixedRows.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
            Fixed Path
          </p>
          <div className="space-y-1">
            {fixedRows.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-blue-950/30 border border-blue-500/20 rounded-lg px-3 py-1.5"
              >
                <span className="text-xs text-blue-300 font-medium">
                  {row.crewLabel} → {row.flightLabel}
                </span>
                <span className="text-xs text-white font-semibold tabular-nums">
                  {row.cost}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-3 py-1">
            <span className="text-xs text-gray-400">Path subtotal</span>
            <span className="text-xs text-blue-300 font-semibold tabular-nums">
              {fixedCost}
            </span>
          </div>
        </div>
      )}

      {fixedRows.length === 0 && (
        <p className="text-xs text-gray-500 italic">No assignments yet (Root)</p>
      )}

      {/* Remaining min costs */}
      {remainingRows.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
            Min Remaining (per crew)
          </p>
          <div className="space-y-1">
            {remainingRows.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-amber-950/20 border border-amber-500/20 rounded-lg px-3 py-1.5"
              >
                <span className="text-xs text-amber-300">
                  {row.crewLabel} → min = {row.flightLabel}
                </span>
                <span className="text-xs text-white font-semibold tabular-nums">
                  {row.cost === Infinity ? "∞" : row.cost}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-3 py-1">
            <span className="text-xs text-gray-400">Remaining subtotal</span>
            <span className="text-xs text-amber-300 font-semibold tabular-nums">
              {remainingCost}
            </span>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="border-t border-gray-700 pt-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-200">
            LC (Lower Bound)
          </span>
          <span className="text-base font-bold text-white tabular-nums">
            = {fixedCost} + {remainingCost} = {breakdown.total}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">UC (Upper Bound / Best)</span>
          <span
            className={`text-sm font-bold tabular-nums ${
              currentUC === Infinity ? "text-gray-500" : "text-emerald-400"
            }`}
          >
            {currentUC === Infinity ? "∞" : currentUC}
          </span>
        </div>
        {currentUC !== Infinity && (
          <div
            className={`text-xs px-3 py-2 rounded-lg font-medium ${
              breakdown.total >= currentUC
                ? "bg-rose-950/40 text-rose-300 border border-rose-500/30"
                : "bg-emerald-950/30 text-emerald-300 border border-emerald-500/20"
            }`}
          >
            {breakdown.total >= currentUC
              ? `❌ LC (${breakdown.total}) ≥ UC (${currentUC}) → Prune this node`
              : `✓ LC (${breakdown.total}) < UC (${currentUC}) → Worth exploring`}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="border-t border-gray-700 pt-3 space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Legend
        </p>
        <p className="text-xs text-gray-400">
          <span className="text-blue-400 font-semibold">LC</span> = Lower Cost
          Bound — minimum this branch can possibly cost
        </p>
        <p className="text-xs text-gray-400">
          <span className="text-emerald-400 font-semibold">UC</span> = Upper
          Cost Bound — best complete solution found so far
        </p>
        <p className="text-xs text-gray-400">
          <span className="text-rose-400 font-semibold">Pruning</span> =
          discarding a node because LC ≥ UC (can&apos;t improve)
        </p>
      </div>
    </div>
  );
}
