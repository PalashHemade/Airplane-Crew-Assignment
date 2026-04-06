"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import type { BBNode, Step } from "@/lib/types";

interface TreeVisualizationProps {
  step: Step;
  showFullTree: boolean;
  isDark: boolean;
}

// ── Layout constants ──────────────────────────────────────────────────────────
const NODE_R = 26;
const LEVEL_H = 110;
const MIN_H_SPACING = 82;

// ── Theme-aware node colors ───────────────────────────────────────────────────
function getNodeColors(isDark: boolean) {
  return {
    unexplored: isDark
      ? { fill: "#1e293b", stroke: "#475569", text: "#94a3b8" }
      : { fill: "#f8fafc", stroke: "#94a3b8", text: "#475569" },
    active: isDark
      ? { fill: "#431407", stroke: "#f59e0b", text: "#fcd34d" }
      : { fill: "#fffbeb", stroke: "#d97706", text: "#92400e" },
    expanded: isDark
      ? { fill: "#0f172a", stroke: "#3b82f6", text: "#93c5fd" }
      : { fill: "#eff6ff", stroke: "#2563eb", text: "#1d4ed8" },
    pruned: isDark
      ? { fill: "#1a0808", stroke: "#ef4444", text: "#fca5a5" }
      : { fill: "#fef2f2", stroke: "#ef4444", text: "#991b1b" },
    optimal: isDark
      ? { fill: "#052e16", stroke: "#22c55e", text: "#86efac" }
      : { fill: "#f0fdf4", stroke: "#16a34a", text: "#166534" },
  } as const;
}

// ── Tree layout ───────────────────────────────────────────────────────────────
type LayoutNode = BBNode & { x: number; y: number };

function layoutTree(nodes: BBNode[]): { layoutNodes: LayoutNode[]; width: number; height: number } {
  if (nodes.length === 0) return { layoutNodes: [], width: 0, height: 0 };
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const root = nodes.find((n) => n.parentId === null);
  if (!root) return { layoutNodes: [], width: 0, height: 0 };

  const subtreeWidth = new Map<number, number>();
  function calcWidth(id: number): number {
    const node = nodeMap.get(id)!;
    if (node.childIds.length === 0) { subtreeWidth.set(id, MIN_H_SPACING); return MIN_H_SPACING; }
    const total = node.childIds.reduce((s, cid) => s + calcWidth(cid), 0);
    const w = Math.max(total, MIN_H_SPACING);
    subtreeWidth.set(id, w);
    return w;
  }
  calcWidth(root.id);

  const positions = new Map<number, { x: number; y: number }>();
  function assignPos(id: number, left: number) {
    const node = nodeMap.get(id)!;
    const w = subtreeWidth.get(id)!;
    positions.set(id, { x: left + w / 2, y: NODE_R * 2 + node.level * LEVEL_H });
    let cursor = left;
    for (const cid of node.childIds) { assignPos(cid, cursor); cursor += subtreeWidth.get(cid)!; }
  }
  assignPos(root.id, 0);

  const layoutNodes: LayoutNode[] = nodes.map((n) => {
    const pos = positions.get(n.id) ?? { x: 0, y: 0 };
    return { ...n, x: pos.x, y: pos.y };
  });
  const totalW = subtreeWidth.get(root.id)!;
  const maxLevel = Math.max(...nodes.map((n) => n.level));
  return { layoutNodes, width: totalW, height: NODE_R * 2 + (maxLevel + 1) * LEVEL_H + NODE_R };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TreeVisualization({ step, showFullTree, isDark }: TreeVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Fullscreen API ──────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Filter nodes ────────────────────────────────────────────────────────────
  const visibleNodes = useMemo(
    () => showFullTree ? step.nodes : step.nodes.filter((n) => step.exploredNodeIds.has(n.id)),
    [step, showFullTree]
  );

  const { layoutNodes, width, height } = useMemo(() => layoutTree(visibleNodes), [visibleNodes]);
  const nodeMap = useMemo(() => new Map(layoutNodes.map((n) => [n.id, n])), [layoutNodes]);
  const NODE_COLOR = useMemo(() => getNodeColors(isDark), [isDark]);

  // ── Pan + Zoom ──────────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => { setDragging(true); setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); };
  const handleMouseMove = (e: React.MouseEvent) => { if (dragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp = () => setDragging(false);
  const handleWheel = (e: React.WheelEvent) => { e.preventDefault(); setScale((s) => Math.min(2.5, Math.max(0.25, s - e.deltaY * 0.001))); };
  const resetView = () => { setPan({ x: 0, y: 0 }); setScale(1); };

  const svgW = Math.max(width + 80, 400);
  const svgH = Math.max(height + 40, 200);

  const bgClass = isDark ? "bg-gray-900" : "bg-white";
  const borderClass = isDark ? "border-gray-700" : "border-gray-200";
  const headerBorderClass = isDark ? "border-gray-700" : "border-gray-200";
  const legendBorderClass = isDark ? "border-gray-800" : "border-gray-100";
  const footerBorderClass = isDark ? "border-gray-800" : "border-gray-100";
  const titleClass = isDark ? "text-white" : "text-gray-900";
  const subtitleClass = isDark ? "text-gray-400" : "text-gray-500";
  const btnClass = isDark
    ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600"
    : "bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300";
  const svgBg = isDark ? "#0f172a" : "#ffffff";

  const legendItems = [
    { status: "unexplored", label: "Unexplored" },
    { status: "active", label: "Active" },
    { status: "expanded", label: "Expanded" },
    { status: "pruned", label: "Pruned ❌" },
    { status: "optimal", label: "Optimal ✅" },
  ] as const;

  return (
    <div
      ref={containerRef}
      className={`tree-fs-container ${bgClass} border ${borderClass} rounded-2xl overflow-hidden flex flex-col shadow-sm transition-colors duration-300`}
    >
      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-5 py-3 border-b ${headerBorderClass}`}>
        <div>
          <h3 className={`text-sm font-semibold ${titleClass}`}>🌳 State Space Tree</h3>
          <p className={`text-xs ${subtitleClass} mt-0.5`}>Drag to pan · Scroll to zoom</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetView} className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${btnClass}`}>
            Reset View
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-medium ${btnClass}`}
          >
            {isFullscreen ? "⊠ Exit" : "⛶ Fullscreen"}
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className={`flex flex-wrap gap-3 px-5 py-2 border-b ${legendBorderClass}`}>
        {legendItems.map(({ status, label }) => {
          const c = NODE_COLOR[status];
          return (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border-2" style={{ backgroundColor: c.fill, borderColor: c.stroke }} />
              <span className={`text-xs ${subtitleClass}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* ── SVG Canvas ── */}
      <div
        className={`flex-1 overflow-hidden cursor-grab active:cursor-grabbing select-none ${isFullscreen ? "" : "min-h-[300px]"}`}
        style={{ background: svgBg }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", minHeight: isFullscreen ? 0 : 300 }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
            {/* Edges */}
            {layoutNodes.map((node) => {
              if (node.parentId === null) return null;
              const parent = nodeMap.get(node.parentId);
              if (!parent) return null;
              const isOptEdge = node.status === "optimal" && parent.status === "optimal";
              const isPruned = node.status === "pruned";
              return (
                <g key={`edge-${node.id}`}>
                  <line
                    x1={parent.x + 40} y1={parent.y + 40}
                    x2={node.x + 40} y2={node.y + 40}
                    stroke={isOptEdge ? "#22c55e" : isPruned ? (isDark ? "#552222" : "#fecaca") : (isDark ? "#334155" : "#cbd5e1")}
                    strokeWidth={isOptEdge ? 2.5 : 1.5}
                    strokeDasharray={isPruned ? "4,4" : undefined}
                  />
                  <text
                    x={(parent.x + node.x) / 2 + 40}
                    y={(parent.y + node.y) / 2 + 40 - 6}
                    textAnchor="middle" fontSize="9"
                    fill={isOptEdge ? "#16a34a" : (isDark ? "#64748b" : "#94a3b8")}
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
              const assignLabel = node.assignments.length === 0
                ? "Root"
                : node.assignments.slice(-1).map((a) => `C${a.crew + 1}→F${a.flight + 1}`).join("");
              return (
                <g key={`node-${node.id}`}>
                  {isActive && (
                    <circle cx={cx} cy={cy} r={NODE_R + 8} fill="none" stroke="#f59e0b" strokeWidth={2} opacity={0.5} />
                  )}
                  <circle cx={cx} cy={cy} r={NODE_R} fill={c.fill} stroke={c.stroke} strokeWidth={isActive ? 2.5 : 1.5} />
                  <text x={cx} y={cy - 7} textAnchor="middle" fontSize="9" fontWeight="bold" fill={c.text} fontFamily="monospace">
                    #{node.id}
                  </text>
                  <text x={cx} y={cy + 3} textAnchor="middle" fontSize="8" fill={c.text} fontFamily="monospace">
                    {assignLabel}
                  </text>
                  <text x={cx} y={cy + 13} textAnchor="middle" fontSize="8" fill={c.text} opacity={0.8} fontFamily="monospace">
                    {node.lc === Infinity ? "∞" : `LC=${node.lc}`}
                  </text>
                  {(node.status === "pruned" || node.status === "optimal") && (
                    <text x={cx + NODE_R - 2} y={cy - NODE_R + 8} textAnchor="middle" fontSize="10">
                      {node.status === "pruned" ? "❌" : "✅"}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* ── Footer counts ── */}
      <div className={`px-5 py-2 border-t ${footerBorderClass} flex gap-4 text-xs`}>
        <span className={subtitleClass}>Total: {step.nodes.length}</span>
        <span className="text-blue-500 dark:text-blue-400">Expanded: {step.nodes.filter((n) => n.status === "expanded").length}</span>
        <span className="text-rose-500 dark:text-rose-400">Pruned: {step.nodes.filter((n) => n.status === "pruned").length}</span>
        <span className="text-emerald-600 dark:text-emerald-400">Optimal: {step.nodes.filter((n) => n.status === "optimal").length}</span>
      </div>
    </div>
  );
}
