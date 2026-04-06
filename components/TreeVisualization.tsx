"use client";

import React, { useMemo, useRef, useState } from "react";
import type { BBNode, Step } from "@/lib/types";

interface TreeVisualizationProps {
  step: Step;
  showFullTree: boolean;
}

// ─── Layout constants ─────────────────────────────────────────────────────────
const NODE_R = 26; // circle radius
const LEVEL_H = 110; // vertical gap between levels
const MIN_H_SPACING = 80; // minimum horizontal gap between siblings

// ─── Colors ───────────────────────────────────────────────────────────────────
const NODE_COLOR: Record<string, { fill: string; stroke: string; text: string }> = {
  unexplored: { fill: "#1e293b", stroke: "#475569", text: "#94a3b8" },
  active: { fill: "#451a03", stroke: "#f59e0b", text: "#fcd34d" },
  expanded: { fill: "#0f172a", stroke: "#3b82f6", text: "#93c5fd" },
  pruned: { fill: "#1a0a0a", stroke: "#ef4444", text: "#fca5a5" },
  optimal: { fill: "#052e16", stroke: "#22c55e", text: "#86efac" },
};

// ─── Tree layout ─────────────────────────────────────────────────────────────

type LayoutNode = BBNode & { x: number; y: number };

function layoutTree(nodes: BBNode[]): {
  layoutNodes: LayoutNode[];
  width: number;
  height: number;
} {
  if (nodes.length === 0) return { layoutNodes: [], width: 0, height: 0 };

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const root = nodes.find((n) => n.parentId === null);
  if (!root) return { layoutNodes: [], width: 0, height: 0 };

  // Build subtree widths bottom-up
  const subtreeWidth = new Map<number, number>();
  function calcWidth(id: number): number {
    const node = nodeMap.get(id)!;
    if (node.childIds.length === 0) {
      subtreeWidth.set(id, MIN_H_SPACING);
      return MIN_H_SPACING;
    }
    const total = node.childIds.reduce(
      (s, cid) => s + calcWidth(cid),
      0
    );
    const w = Math.max(total, MIN_H_SPACING);
    subtreeWidth.set(id, w);
    return w;
  }
  calcWidth(root.id);

  // Assign x, y positions top-down
  const positions = new Map<number, { x: number; y: number }>();
  function assignPos(id: number, left: number) {
    const node = nodeMap.get(id)!;
    const w = subtreeWidth.get(id)!;
    const x = left + w / 2;
    const y = NODE_R * 2 + node.level * LEVEL_H;
    positions.set(id, { x, y });

    let cursor = left;
    for (const cid of node.childIds) {
      const cw = subtreeWidth.get(cid)!;
      assignPos(cid, cursor);
      cursor += cw;
    }
  }
  assignPos(root.id, 0);

  const layoutNodes: LayoutNode[] = nodes.map((n) => {
    const pos = positions.get(n.id) ?? { x: 0, y: 0 };
    return { ...n, x: pos.x, y: pos.y };
  });

  const totalW = subtreeWidth.get(root.id)!;
  const maxLevel = Math.max(...nodes.map((n) => n.level));
  const totalH = NODE_R * 2 + (maxLevel + 1) * LEVEL_H + NODE_R;

  return { layoutNodes, width: totalW, height: totalH };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TreeVisualization({
  step,
  showFullTree,
}: TreeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filter nodes based on toggle
  const visibleNodes = useMemo(() => {
    if (showFullTree) return step.nodes;
    return step.nodes.filter((n) => step.exploredNodeIds.has(n.id));
  }, [step, showFullTree]);

  const { layoutNodes, width, height } = useMemo(
    () => layoutTree(visibleNodes),
    [visibleNodes]
  );

  const nodeMap = useMemo(
    () => new Map(layoutNodes.map((n) => [n.id, n])),
    [layoutNodes]
  );

  // ── Pan + Zoom handlers ────────────────────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent) {
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }
  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }
  function handleMouseUp() {
    setDragging(false);
  }
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setScale((s) => Math.min(2, Math.max(0.3, s - e.deltaY * 0.001)));
  }

  function resetView() {
    setPan({ x: 0, y: 0 });
    setScale(1);
  }

  const svgW = Math.max(width + 80, 400);
  const svgH = Math.max(height + 40, 200);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-white">
            🌳 State Space Tree
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Drag to pan · Scroll to zoom
          </p>
        </div>
        <button
          onClick={resetView}
          className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 transition-colors"
        >
          Reset View
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-5 py-2 border-b border-gray-800">
        {[
          { status: "unexplored", label: "Unexplored" },
          { status: "active", label: "Active" },
          { status: "expanded", label: "Expanded" },
          { status: "pruned", label: "Pruned ❌" },
          { status: "optimal", label: "Optimal ✅" },
        ].map(({ status, label }) => {
          const c = NODE_COLOR[status];
          return (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: c.fill, borderColor: c.stroke }}
              />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          );
        })}
      </div>

      {/* SVG Canvas */}
      <div
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{ minHeight: 300 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", minHeight: 300 }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
            {/* Edges */}
            {layoutNodes.map((node) => {
              if (node.parentId === null) return null;
              const parent = nodeMap.get(node.parentId);
              if (!parent) return null;

              const isOptimalEdge =
                node.status === "optimal" && parent.status === "optimal";
              const isPrunedEdge = node.status === "pruned";

              return (
                <g key={`edge-${node.id}`}>
                  <line
                    x1={parent.x + 40}
                    y1={parent.y + 40}
                    x2={node.x + 40}
                    y2={node.y + 40}
                    stroke={
                      isOptimalEdge
                        ? "#22c55e"
                        : isPrunedEdge
                        ? "#552222"
                        : "#334155"
                    }
                    strokeWidth={isOptimalEdge ? 2.5 : 1.5}
                    strokeDasharray={isPrunedEdge ? "4,4" : undefined}
                  />
                  {/* Branch label */}
                  <text
                    x={(parent.x + node.x) / 2 + 40}
                    y={(parent.y + node.y) / 2 + 40 - 6}
                    textAnchor="middle"
                    fontSize="9"
                    fill={isOptimalEdge ? "#4ade80" : "#64748b"}
                    fontFamily="monospace"
                  >
                    {node.branchLabel}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {layoutNodes.map((node) => {
              const c = NODE_COLOR[node.status] ?? NODE_COLOR.unexplored;
              const isActive = node.id === step.activeNodeId;
              const cx = node.x + 40;
              const cy = node.y + 40;

              // Abbreviate assignment label
              const assignLabel =
                node.assignments.length === 0
                  ? "Root"
                  : node.assignments
                      .slice(-1)
                      .map((a) => `C${a.crew + 1}→F${a.flight + 1}`)
                      .join("");

              return (
                <g key={`node-${node.id}`}>
                  {/* Pulse ring for active node */}
                  {isActive && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={NODE_R + 7}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      opacity={0.5}
                    />
                  )}

                  {/* Main circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={NODE_R}
                    fill={c.fill}
                    stroke={c.stroke}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />

                  {/* Node ID */}
                  <text
                    x={cx}
                    y={cy - 7}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill={c.text}
                    fontFamily="monospace"
                  >
                    #{node.id}
                  </text>

                  {/* Assignment label */}
                  <text
                    x={cx}
                    y={cy + 3}
                    textAnchor="middle"
                    fontSize="8"
                    fill={c.text}
                    fontFamily="monospace"
                  >
                    {assignLabel}
                  </text>

                  {/* LC value */}
                  <text
                    x={cx}
                    y={cy + 13}
                    textAnchor="middle"
                    fontSize="8"
                    fill={c.text}
                    opacity={0.8}
                    fontFamily="monospace"
                  >
                    {node.lc === Infinity ? "∞" : `LC=${node.lc}`}
                  </text>

                  {/* Status icon */}
                  {(node.status === "pruned" || node.status === "optimal") && (
                    <text
                      x={cx + NODE_R - 2}
                      y={cy - NODE_R + 8}
                      textAnchor="middle"
                      fontSize="10"
                    >
                      {node.status === "pruned" ? "❌" : "✅"}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Node count */}
      <div className="px-5 py-2 border-t border-gray-800 flex gap-4 text-xs text-gray-500">
        <span>Total: {step.nodes.length}</span>
        <span className="text-blue-400">
          Expanded: {step.nodes.filter((n) => n.status === "expanded").length}
        </span>
        <span className="text-rose-400">
          Pruned: {step.nodes.filter((n) => n.status === "pruned").length}
        </span>
        <span className="text-emerald-400">
          Optimal:{" "}
          {step.nodes.filter((n) => n.status === "optimal").length}
        </span>
      </div>
    </div>
  );
}
