"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import MatrixInput from "@/components/MatrixInput";
import ControlBar from "@/components/ControlBar";
import StepExplainer from "@/components/StepExplainer";
import BoundPanel from "@/components/BoundPanel";
import TreeVisualization from "@/components/TreeVisualization";
import LiveQueue from "@/components/LiveQueue";
import FinalAnswer from "@/components/FinalAnswer";
import { runBranchAndBound, DEFAULT_MATRIX } from "@/lib/branchAndBound";
import type { Step } from "@/lib/types";

function makeEmptyMatrix(n: number): number[][] {
  return Array.from({ length: n }, () => Array(n).fill(0));
}
function deepCopy(m: number[][]): number[][] {
  return m.map((row) => [...row]);
}

// ── Theme Toggle Button ────────────────────────────────────────────────────────
function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
        isDark
          ? "bg-gray-700 hover:bg-gray-600 text-yellow-300 border-gray-600"
          : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm"
      }`}
    >
      <span className="text-base leading-none">{isDark ? "☀️" : "🌙"}</span>
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}

// ── Toggle Switch ──────────────────────────────────────────────────────────────
function ToggleSwitch({ on, onToggle, label, isDark }: { on: boolean; onToggle: () => void; label: string; isDark: boolean }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none" onClick={onToggle}>
      <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${on ? "bg-blue-600" : isDark ? "bg-gray-700" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${on ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}>{label}</span>
    </label>
  );
}

export default function Home() {
  // ── Theme ────────────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(true); // default dark (matches layout.tsx)

  // Read saved theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("bnb-theme");
    if (saved === "light") setIsDark(false);
  }, []);

  // Apply .dark class to <html> + persist
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
      localStorage.setItem("bnb-theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("bnb-theme", "light");
    }
  }, [isDark]);

  // ── Matrix state ─────────────────────────────────────────────────────────────
  const [n, setN] = useState(4);
  const [matrix, setMatrix] = useState<number[][]>(deepCopy(DEFAULT_MATRIX));

  // ── Viz state ─────────────────────────────────────────────────────────────────
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── UI toggles ────────────────────────────────────────────────────────────────
  const [showFullTree, setShowFullTree] = useState(false);
  const [verboseMode, setVerboseMode] = useState(true);

  const currentStep: Step | null = steps[stepIndex] ?? null;

  // ── Matrix handlers ───────────────────────────────────────────────────────────
  function handleNChange(newN: number) {
    setN(newN);
    const blank = makeEmptyMatrix(newN);
    for (let r = 0; r < Math.min(newN, matrix.length); r++)
      for (let c = 0; c < Math.min(newN, matrix[r].length); c++)
        blank[r][c] = matrix[r][c];
    setMatrix(blank);
    handleReset();
  }

  function handleMatrixChange(r: number, c: number, val: number) {
    setMatrix((prev) => { const next = deepCopy(prev); next[r][c] = val; return next; });
  }

  function handleLoadDefault() { setN(4); setMatrix(deepCopy(DEFAULT_MATRIX)); handleReset(); }

  // ── Viz control ───────────────────────────────────────────────────────────────
  function handleVisualize() {
    stopPlay();
    setSteps(runBranchAndBound(matrix));
    setStepIndex(0);
    setIsRunning(true);
  }

  function handleReset() { stopPlay(); setSteps([]); setStepIndex(0); setIsRunning(false); }

  // ── Navigation ────────────────────────────────────────────────────────────────
  const goNext = useCallback(() => setStepIndex((i) => Math.min(i + 1, steps.length - 1)), [steps.length]);
  const goPrev = useCallback(() => setStepIndex((i) => Math.max(i - 1, 0)), []);

  function startPlay() { if (stepIndex < steps.length - 1) setIsPlaying(true); }
  function stopPlay() {
    setIsPlaying(false);
    if (playTimer.current) { clearInterval(playTimer.current); playTimer.current = null; }
  }

  useEffect(() => {
    if (isPlaying) {
      playTimer.current = setInterval(() => {
        setStepIndex((i) => { if (i >= steps.length - 1) { setIsPlaying(false); return i; } return i + 1; });
      }, speed);
    }
    return () => { if (playTimer.current) clearInterval(playTimer.current); };
  }, [isPlaying, speed, steps.length]);

  useEffect(() => { if (stepIndex >= steps.length - 1 && isPlaying) stopPlay(); }, [stepIndex, steps.length, isPlaying]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isRunning) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      if (e.key === " ") { e.preventDefault(); isPlaying ? stopPlay() : startPlay(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRunning, isPlaying, goNext, goPrev]);

  // ── Derived classes ───────────────────────────────────────────────────────────
  const headerClass = isDark
    ? "border-gray-800 bg-gray-900/80 text-white"
    : "border-gray-200 bg-white/90 text-gray-900 shadow-sm";
  const titleClass = isDark ? "text-gray-400" : "text-gray-500";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-sans transition-colors duration-300">
      {/* ── Header ── */}
      <header className={`border-b backdrop-blur-sm sticky top-0 z-10 transition-colors duration-300 ${headerClass}`}>
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold leading-tight">Branch &amp; Bound Visualizer</h1>
            <p className={`text-xs mt-0.5 ${titleClass}`}>Airline Crew Assignment · Step-by-Step</p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Theme toggle */}
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark((v) => !v)} />

            {/* Full Tree toggle */}
            <ToggleSwitch on={showFullTree} onToggle={() => setShowFullTree((v) => !v)} label="Full Tree" isDark={isDark} />

            {/* Verbose mode toggle */}
            <ToggleSwitch on={verboseMode} onToggle={() => setVerboseMode((v) => !v)} label="Verbose Mode" isDark={isDark} />

            <span className={`text-xs hidden sm:block ${titleClass}`}>← → keys · Space to play/pause</span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        {/* ── Matrix Input ── */}
        <section>
          <MatrixInput
            n={n} matrix={matrix}
            onNChange={handleNChange}
            onMatrixChange={handleMatrixChange}
            onLoadDefault={handleLoadDefault}
            onVisualize={handleVisualize}
            isRunning={isRunning}
          />
        </section>

        {/* ── Visualization panels ── */}
        {isRunning && currentStep && (
          <>
            <section>
              <ControlBar
                stepIndex={stepIndex} totalSteps={steps.length}
                isPlaying={isPlaying}
                onPrev={goPrev} onNext={goNext} onPlay={startPlay} onPause={stopPlay} onReset={handleReset}
                speed={speed} onSpeedChange={setSpeed}
              />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1 space-y-4">
                <StepExplainer step={currentStep} verbose={verboseMode} />
                <BoundPanel breakdown={currentStep.lcBreakdown} currentUC={currentStep.currentUC} />
              </div>
              <div className="xl:col-span-2" style={{ minHeight: 420 }}>
                <TreeVisualization step={currentStep} showFullTree={showFullTree} isDark={isDark} />
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LiveQueue step={currentStep} />
              {currentStep.finalAnswer ? (
                <FinalAnswer assignments={currentStep.finalAnswer} matrix={matrix} />
              ) : (
                <div className={`rounded-2xl p-5 flex items-center justify-center border ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
                  <p className={`text-sm italic text-center ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    Optimal solution will appear here once the algorithm completes.
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {/* ── Welcome ── */}
        {!isRunning && (
          <div className="text-center py-16 space-y-4">
            <div className="text-5xl">🌳</div>
            <h2 className={`text-xl font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>Ready to Visualize</h2>
            <p className={`text-sm max-w-lg mx-auto ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Enter your cost matrix above (or load the default 4×4 example), then click{" "}
              <span className="text-blue-600 dark:text-blue-400 font-medium">▶ Visualize Branch &amp; Bound</span>{" "}
              to begin the step-by-step walkthrough.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
              {[
                { icon: "📐", title: "Lower Bound (LC)", desc: "Minimum possible cost from this node — current path + min remaining per crew" },
                { icon: "✂️", title: "Pruning", desc: "When LC ≥ UC, this branch cannot beat the best solution. Discard it." },
                { icon: "🏆", title: "Upper Bound (UC)", desc: "Best complete assignment found so far. Updated whenever a better solution is reached." },
              ].map((card) => (
                <div key={card.title} className={`border rounded-xl p-4 text-left space-y-2 ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
                  <div className="text-2xl">{card.icon}</div>
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{card.title}</p>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className={`border-t mt-12 py-4 text-center text-xs ${isDark ? "border-gray-800 text-gray-600" : "border-gray-200 text-gray-400"}`}>
        Branch &amp; Bound Visualizer · Airline Crew Assignment · Pure Frontend
      </footer>
    </div>
  );
}
