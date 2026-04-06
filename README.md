# 🌳 Branch & Bound Visualizer
### Airline Crew Assignment Problem — Step-by-Step Educational Dashboard

A fully **frontend-only** interactive teaching tool that visually explains how the **Branch and Bound** algorithm solves the **Airline Crew Assignment** (Assignment) problem — step by step, with real-time tree visualization, bound calculations, pruning decisions, and optimal path highlighting.

Built with **Next.js 16**, **React 19**, and **Tailwind CSS v4**. No backend, no database, no API calls.

---

## 📸 What It Does

| Feature | Description |
|---|---|
| 🌳 **Tree Visualization** | SVG-based state space tree that builds step by step. Drag to pan, scroll to zoom. |
| 📐 **Bound Panel** | Shows exactly how LC (Lower Bound) is computed at each node — fixed path cost + minimum remaining. |
| 📋 **Step Explainer** | Student-friendly description of what's happening at every step — what node was chosen, why, and what happens next. |
| 🔢 **Live Queue** | Priority queue panel showing all live nodes sorted by LC, with the next selected node highlighted. |
| ✅ **Final Answer** | Clearly shows the optimal assignment and minimum cost once the algorithm terminates. |
| ⌨️ **Keyboard Navigation** | Use `←` `→` arrow keys to step through, `Space` to play/pause. |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later

### Installation

```bash
# Clone or navigate to the project folder
cd "d:/OS Ass/DAA assignments/bnb-visualizer"

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧑‍🎓 How to Use

1. **Load the default matrix** — Click **"Load Default"** to load the pre-built 4×4 airline crew cost matrix, or enter your own values.
2. **Click "Visualize Branch & Bound"** — The algorithm runs instantly in the browser and generates all steps.
3. **Step through the algorithm** — Use the **Next / Prev** buttons, arrow keys, or **Play** for auto-stepping.
4. **Read the panels** — The Step Explainer, Bound Panel, and Live Queue update at every step to explain exactly what is happening.
5. **Watch the tree grow** — Nodes appear colored by status. Pruned nodes are red ❌, optimal path is green ✅.

### Controls

| Control | Action |
|---|---|
| `→` / `↓` | Next step |
| `←` / `↑` | Previous step |
| `Space` | Play / Pause auto-stepping |
| Mouse drag | Pan the tree canvas |
| Mouse scroll | Zoom in / out |
| **Reset View** button | Reset pan and zoom |

### Toggles (top-right)

| Toggle | Effect |
|---|---|
| **Full Tree** | ON → show all nodes ever created · OFF → show only nodes explored so far |
| **Verbose Mode** | ON → detailed student-friendly explanations · OFF → compact step titles only |

---

## 🧮 The Problem

### Default Cost Matrix (4×4)

|  | F1 | F2 | F3 | F4 |
|---|---|---|---|---|
| **C1** | 9 | 2 | 7 | 8 |
| **C2** | 6 | 4 | 3 | 7 |
| **C3** | 5 | 8 | 1 | 8 |
| **C4** | 7 | 6 | 9 | 4 |

### Optimal Assignment

| Crew | Flight | Cost |
|---|---|---|
| C1 | F2 | 2 |
| C2 | F1 | 6 |
| C3 | F3 | 1 |
| C4 | F4 | 4 |
| **Total** | | **13** |

---

## 🔍 Algorithm Explained

### Branch and Bound for Assignment Problems

Branch and Bound is an exact optimization algorithm that systematically explores the solution space while pruning branches that cannot possibly lead to a better solution.

#### Key Concepts

**Lower Bound (LC)**
> LC = cost of assignments already fixed + Σ (minimum possible cost for each remaining crew over still-available flights)

This gives the best-case cost this branch can achieve. If LC ≥ UC, the branch is useless.

**Upper Bound (UC)**
> UC = cost of the best complete assignment found so far (starts at ∞).

Every time a complete assignment is found with lower cost, UC is updated.

**Pruning**
> When LC ≥ UC, the current node's subtree cannot yield a better solution. It is pruned (discarded).

**Best-First Search**
> At each step, the live node with the smallest LC is selected for expansion. This is implemented as a priority queue ordered by LC.

#### Step-by-step flow

```
1. Create root node (no assignments yet), compute LC
2. Expand root → create child nodes (one per flight for Crew 1)
3. Add valid children to priority queue
4. Pick node with minimum LC from queue
5. If it's a complete assignment → update UC if better
6. Otherwise → expand (generate children for next crew)
7. For each child: compute LC → if LC ≥ UC → prune → else add to queue
8. Repeat from step 4 until queue is empty
9. The last UC value is the optimal solution
```

---

## 📁 Project Structure

```
bnb-visualizer/
├── app/
│   ├── layout.tsx          # Root layout, metadata, fonts
│   ├── page.tsx            # Main page — state management, layout assembly
│   └── globals.css         # Tailwind import + dark theme + scrollbar styles
│
├── components/
│   ├── MatrixInput.tsx     # Editable cost matrix table + Load Default button
│   ├── ControlBar.tsx      # Next/Prev/Play/Pause/Reset + progress bar + speed
│   ├── StepExplainer.tsx   # Current step title + student-friendly description
│   ├── BoundPanel.tsx      # LC breakdown (fixed path + remaining mins) + legend
│   ├── TreeVisualization.tsx  # SVG tree with pan/zoom, color-coded nodes
│   ├── LiveQueue.tsx       # Priority queue snapshot panel
│   └── FinalAnswer.tsx     # Optimal assignment + minimum cost card
│
├── lib/
│   ├── types.ts            # Shared TypeScript types (BBNode, Step, LCBreakdown…)
│   └── branchAndBound.ts   # Pure algorithm engine — runs B&B and returns Step[]
│
├── .gitignore
├── README.md
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16.2 | React framework, App Router |
| [React](https://react.dev/) | 19 | UI rendering |
| [Tailwind CSS](https://tailwindcss.com/) | v4 | Styling |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type safety |
| SVG (native) | — | Tree visualization (no external lib) |

**No backend. No database. No API calls. No external state libraries. 100% pure frontend.**

---

## 🎨 Node Color Legend

| Color | Status | Meaning |
|---|---|---|
| 🔵 Blue border | Expanded | Node has been processed and children generated |
| 🟡 Amber border | Active | Currently selected node being expanded |
| ⚪ Gray | Unexplored | In the queue but not yet processed |
| 🔴 Rose/Red | Pruned ❌ | Discarded because LC ≥ UC |
| 🟢 Emerald/Green | Optimal ✅ | Part of the final optimal path |

---

## 📦 Available Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server (after build)
npm run lint     # Run ESLint
```

---

## 🙏 Academic Context

This project was built as part of a **Design and Analysis of Algorithms (DAA)** assignment to demonstrate:

- Branch and Bound algorithm
- Assignment Problem / Airline Crew Scheduling
- State space tree construction
- Bounding functions and pruning strategies
- Best-first search (LC-search)

---

*Frontend-only visualization — no server required.*
