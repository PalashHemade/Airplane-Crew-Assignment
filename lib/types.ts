// ─── Core Types ──────────────────────────────────────────────────────────────

export type Assignment = {
  crew: number; // 0-indexed
  flight: number; // 0-indexed
};

export type NodeStatus =
  | "unexplored"
  | "active"
  | "expanded"
  | "pruned"
  | "optimal";

export type BBNode = {
  id: number;
  parentId: number | null;
  assignments: Assignment[]; // fixed assignments so far
  level: number; // which crew we are about to assign (0 = root)
  lc: number; // lower bound
  status: NodeStatus;
  branchLabel: string; // e.g. "C1 → F2"
  childIds: number[];
};

// ─── LC Breakdown ─────────────────────────────────────────────────────────────

export type LCRow = {
  crewLabel: string;
  flightLabel: string;
  cost: number;
  isFixed: boolean; // true = already in path, false = minimum remaining
};

export type LCBreakdown = {
  rows: LCRow[];
  total: number;
};

// ─── Step ─────────────────────────────────────────────────────────────────────

export type Step = {
  stepNumber: number;
  title: string;
  description: string; // student-friendly explanation
  activeNodeId: number | null;
  nodes: BBNode[]; // full snapshot of all nodes at this step
  liveQueue: BBNode[]; // priority queue snapshot (unexplored, sorted by LC)
  lcBreakdown: LCBreakdown;
  currentUC: number; // current upper bound (Infinity initially)
  finalAnswer: Assignment[] | null; // set only on the final step
  exploredNodeIds: Set<number>; // nodes touched so far (for "explored only" toggle)
};
