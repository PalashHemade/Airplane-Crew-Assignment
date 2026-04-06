import type {
  Assignment,
  BBNode,
  LCBreakdown,
  LCRow,
  NodeStatus,
  Step,
} from "./types";

// ─── Default Matrix ───────────────────────────────────────────────────────────

export const DEFAULT_MATRIX: number[][] = [
  [9, 2, 7, 8],
  [6, 4, 3, 7],
  [5, 8, 1, 8],
  [7, 6, 9, 4],
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function label(prefix: string, i: number) {
  return `${prefix}${i + 1}`;
}

/** Compute lower bound for a partial assignment.
 *
 * LC = sum of costs already fixed
 *    + for each remaining crew → min cost over still-available flights
 */
function computeLC(
  matrix: number[][],
  assignments: Assignment[]
): { lc: number; breakdown: LCBreakdown } {
  const n = matrix.length;
  const assignedFlights = new Set(assignments.map((a) => a.flight));
  const rows: LCRow[] = [];

  // Fixed path cost
  let fixed = 0;
  for (const a of assignments) {
    fixed += matrix[a.crew][a.flight];
    rows.push({
      crewLabel: label("C", a.crew),
      flightLabel: label("F", a.flight),
      cost: matrix[a.crew][a.flight],
      isFixed: true,
    });
  }

  // Min remaining cost for each unassigned crew
  const assignedCrews = new Set(assignments.map((a) => a.crew));
  let remaining = 0;
  for (let c = 0; c < n; c++) {
    if (assignedCrews.has(c)) continue;
    const availableFlights = [];
    for (let f = 0; f < n; f++) {
      if (!assignedFlights.has(f)) availableFlights.push(f);
    }
    // min cost over available flights
    let minCost = Infinity;
    let minFlight = -1;
    for (const f of availableFlights) {
      if (matrix[c][f] < minCost) {
        minCost = matrix[c][f];
        minFlight = f;
      }
    }
    remaining += minCost;
    rows.push({
      crewLabel: label("C", c),
      flightLabel: minFlight >= 0 ? label("F", minFlight) : "—",
      cost: minCost,
      isFixed: false,
    });
  }

  return {
    lc: fixed + remaining,
    breakdown: { rows, total: fixed + remaining },
  };
}

/** Deep-clone a BBNode array (with status mutation safety) */
function cloneNodes(nodes: BBNode[]): BBNode[] {
  return nodes.map((n) => ({
    ...n,
    assignments: [...n.assignments],
    childIds: [...n.childIds],
  }));
}

function cloneNode(node: BBNode): BBNode {
  return {
    ...node,
    assignments: [...node.assignments],
    childIds: [...node.childIds],
  };
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function runBranchAndBound(matrix: number[][]): Step[] {
  const n = matrix.length;
  const steps: Step[] = [];
  let nodeCounter = 0;
  let currentUC = Infinity;
  let incumbentAssignments: Assignment[] = [];

  // All nodes ever created (grows over time)
  const allNodes: Map<number, BBNode> = new Map();

  // Priority queue of live nodes (unexplored), sorted by LC ascending
  let liveNodes: BBNode[] = [];

  const exploredIds = new Set<number>();

  // ── Helper: snapshot current state into a Step ──────────────────────────────
  function pushStep(
    title: string,
    description: string,
    activeNodeId: number | null,
    lcBreakdown: LCBreakdown,
    finalAnswer: Assignment[] | null = null
  ) {
    const nodesSnapshot = cloneNodes(Array.from(allNodes.values()));
    const queueSnapshot = liveNodes
      .map((n) => cloneNode(n))
      .sort((a, b) => a.lc - b.lc);

    steps.push({
      stepNumber: steps.length + 1,
      title,
      description,
      activeNodeId,
      nodes: nodesSnapshot,
      liveQueue: queueSnapshot,
      lcBreakdown,
      currentUC: currentUC === Infinity ? Infinity : currentUC,
      finalAnswer,
      exploredNodeIds: new Set(exploredIds),
    });
  }

  // ── Create root node ────────────────────────────────────────────────────────
  const root: BBNode = {
    id: nodeCounter++,
    parentId: null,
    assignments: [],
    level: 0,
    lc: 0,
    status: "unexplored",
    branchLabel: "Root",
    childIds: [],
  };

  const { lc: rootLC, breakdown: rootBreakdown } = computeLC(
    matrix,
    root.assignments
  );
  root.lc = rootLC;
  allNodes.set(root.id, root);
  liveNodes.push(root);
  exploredIds.add(root.id);

  pushStep(
    "Root node created",
    `We start at the root node. No crew has been assigned yet.\n\nThe Lower Bound (LC) at the root is calculated by taking the minimum possible cost for each crew: LC = ${rootLC}.\n\nThis is our starting point. We will now explore assignments level by level — one crew at a time.`,
    root.id,
    rootBreakdown
  );

  // ── Best-First Search ───────────────────────────────────────────────────────
  while (liveNodes.length > 0) {
    // Select node with minimum LC
    liveNodes.sort((a, b) => a.lc - b.lc);
    const current = liveNodes.shift()!;
    const currentNode = allNodes.get(current.id)!;

    exploredIds.add(currentNode.id);

    // Mark as active
    currentNode.status = "active";
    const { breakdown: activeBD } = computeLC(matrix, currentNode.assignments);
    pushStep(
      `Expand Node ${currentNode.id} (Level ${currentNode.level})`,
      `Selected Node ${currentNode.id} because it has the smallest LC = ${currentNode.lc} among all live nodes.\n\nCurrent assignments: ${
        currentNode.assignments.length === 0
          ? "None (Root)"
          : currentNode.assignments
              .map((a) => `C${a.crew + 1}→F${a.flight + 1}`)
              .join(", ")
      }\n\n${
        currentUC === Infinity
          ? "No complete solution found yet (UC = ∞)."
          : `Current best complete solution cost = ${currentUC} (UC).`
      }\n\nWe will now assign Crew C${currentNode.level + 1} to each available flight and create child nodes.`,
      currentNode.id,
      activeBD
    );

    // Check if this is a complete assignment (leaf node)
    if (currentNode.level === n) {
      const totalCost = currentNode.lc;
      if (totalCost < currentUC) {
        currentUC = totalCost;
        incumbentAssignments = [...currentNode.assignments];
        currentNode.status = "expanded";
        const { breakdown: leafBD } = computeLC(
          matrix,
          currentNode.assignments
        );
        pushStep(
          `New Optimal Solution Found! Cost = ${totalCost}`,
          `Node ${currentNode.id} is a complete assignment!\n\nAll ${n} crews have been assigned.\n\nTotal cost = ${totalCost}.\n\nThis is better than our previous best (UC = ${
            currentUC === totalCost ? "∞" : currentUC
          }), so we update UC = ${totalCost}.\n\nWe continue exploring to make sure this is truly optimal.`,
          currentNode.id,
          leafBD
        );
      }
      continue;
    }

    // Mark as expanded (will generate children)
    currentNode.status = "expanded";
    exploredIds.add(currentNode.id);

    const crewToAssign = currentNode.level;
    const assignedFlights = new Set(
      currentNode.assignments.map((a) => a.flight)
    );

    // Generate children for each available flight
    for (let f = 0; f < n; f++) {
      if (assignedFlights.has(f)) continue;

      const childAssignments: Assignment[] = [
        ...currentNode.assignments,
        { crew: crewToAssign, flight: f },
      ];

      const { lc: childLC, breakdown: childBD } = computeLC(
        matrix,
        childAssignments
      );

      const childNode: BBNode = {
        id: nodeCounter++,
        parentId: currentNode.id,
        assignments: childAssignments,
        level: crewToAssign + 1,
        lc: childLC,
        status: "unexplored",
        branchLabel: `C${crewToAssign + 1}→F${f + 1}`,
        childIds: [],
      };

      allNodes.set(childNode.id, childNode);
      currentNode.childIds.push(childNode.id);
      exploredIds.add(childNode.id);

      // Prune?
      if (currentUC !== Infinity && childLC >= currentUC) {
        childNode.status = "pruned";
        pushStep(
          `Prune Node ${childNode.id} (C${crewToAssign + 1}→F${f + 1})`,
          `Created Node ${childNode.id} for assigning Crew C${
            crewToAssign + 1
          } to Flight F${f + 1}.\n\nLC = ${childLC} ≥ UC = ${currentUC}\n\n❌ Since the lower bound is already ≥ our best known cost, this branch CANNOT produce a better solution.\n\nPruning this node — we discard it and won't explore further.`,
          childNode.id,
          childBD
        );
      } else {
        childNode.status = "unexplored";
        liveNodes.push(childNode);
        pushStep(
          `Add Node ${childNode.id}: C${crewToAssign + 1}→F${f + 1} (LC=${childLC})`,
          `Created Node ${childNode.id}: Crew C${crewToAssign + 1} assigned to Flight F${
            f + 1
          }.\n\nCost so far: ${currentNode.assignments
            .map((a) => `C${a.crew + 1}→F${a.flight + 1}`)
            .join(" + ")}${
            currentNode.assignments.length > 0 ? " + " : ""
          }C${crewToAssign + 1}→F${f + 1} = ${childAssignments.reduce(
            (s, a) => s + matrix[a.crew][a.flight],
            0
          )}\n\nMinimum remaining cost estimate = ${
            childLC -
            childAssignments.reduce((s, a) => s + matrix[a.crew][a.flight], 0)
          }\n\nLC = ${childLC}${
            currentUC === Infinity ? "" : ` < UC = ${currentUC} ✓`
          }\n\nAdded to the Live Nodes queue.`,
          childNode.id,
          childBD
        );
      }
    }
  }

  // ── Mark optimal path ───────────────────────────────────────────────────────
  // Trace back from the optimal leaf to root
  if (incumbentAssignments.length > 0) {
    // Find the node whose assignments match incumbentAssignments exactly
    for (const node of allNodes.values()) {
      if (
        node.level === n &&
        node.assignments.every(
          (a, i) =>
            a.crew === incumbentAssignments[i]?.crew &&
            a.flight === incumbentAssignments[i]?.flight
        )
      ) {
        // trace back
        let cur: BBNode | undefined = node;
        while (cur) {
          cur.status = "optimal";
          cur = cur.parentId !== null ? allNodes.get(cur.parentId) : undefined;
        }
        break;
      }
    }

    const { breakdown: finalBD } = computeLC(matrix, incumbentAssignments);
    const totalCost = incumbentAssignments.reduce(
      (s, a) => s + matrix[a.crew][a.flight],
      0
    );

    pushStep(
      "✅ Optimal Solution Found!",
      `Branch and Bound has finished exploring all live nodes.\n\nOptimal Assignment:\n${incumbentAssignments
        .map((a) => `C${a.crew + 1} → F${a.flight + 1} (cost: ${matrix[a.crew][a.flight]})`)
        .join("\n")}\n\nMinimum Total Cost = ${totalCost}\n\nThe green path in the tree shows the optimal route taken.`,
      null,
      finalBD,
      incumbentAssignments
    );
  }

  return steps;
}
