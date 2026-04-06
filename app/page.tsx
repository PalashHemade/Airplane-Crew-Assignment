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

export default function Home() {
  // ── Matrix state ────────────────────────────────────────────────────────────
  const [n, setN] = useState(4);
  const [matrix, setMatrix] = useState<number[][]>(deepCopy(DEFAULT_MATRIX));

  // ── Visualization state ─────────────────────────────────────────────────────
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false); // has visualization started
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000); // ms per step
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── UI toggles ──────────────────────────────────────────────────────────────
  const [showFullTree, setShowFullTree] = useState(false);
  const [verboseMode, setVerboseMode] = useState(true);

  // ── Derived current step ─────────────────────────────────────────────────────
  const currentStep: Step | null = steps[stepIndex] ?? null;

  // ── Matrix handlers ────────────────────────────────────────────────────────
  function handleNChange(newN: number) {
    setN(newN);
    const blank = makeEmptyMatrix(newN);
    // Copy existing values where possible
    for (let r = 0; r < Math.min(newN, matrix.length); r++) {
      for (let c = 0; c < Math.min(newN, matrix[r].length); c++) {
        blank[r][c] = matrix[r][c];
      }
    }
    setMatrix(blank);
    handleReset();
  }

  function handleMatrixChange(r: number, c: number, val: number) {
    setMatrix((prev) => {
      const next = deepCopy(prev);
      next[r][c] = val;
      return next;
    });
  }

  function handleLoadDefault() {
    setN(4);
    setMatrix(deepCopy(DEFAULT_MATRIX));
    handleReset();
  }

  // ── Visualization control ──────────────────────────────────────────────────
  function handleVisualize() {
    stopPlay();
    const computed = runBranchAndBound(matrix);
    setSteps(computed);
    setStepIndex(0);
    setIsRunning(true);
  }

  function handleReset() {
    stopPlay();
    setSteps([]);
    setStepIndex(0);
    setIsRunning(false);
  }

  // ── Step navigation ────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  // ── Auto-play ─────────────────────────────────────────────────────────────
  function startPlay() {
    if (stepIndex >= steps.length - 1) return;
    setIsPlaying(true);
  }

  function stopPlay() {
    setIsPlaying(false);
    if (playTimer.current) {
      clearInterval(playTimer.current);
      playTimer.current = null;
    }
  }

  useEffect(() => {
    if (isPlaying) {
      playTimer.current = setInterval(() => {
        setStepIndex((i) => {
          if (i >= steps.length - 1) {
            setIsPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, speed);
    }
    return () => {
      if (playTimer.current) clearInterval(playTimer.current);
    };
  }, [isPlaying, speed, steps.length]);

  // Stop play when end is reached
  useEffect(() => {
    if (stepIndex >= steps.length - 1 && isPlaying) {
      stopPlay();
    }
  }, [stepIndex, steps.length, isPlaying]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isRunning) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      if (e.key === " ") {
        e.preventDefault();
        isPlaying ? stopPlay() : startPlay();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRunning, isPlaying, goNext, goPrev]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* ── Top bar ── */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              Branch &amp; Bound Visualizer
            </h1>
            <p className="text-xs text-gray-400">
              Airline Crew Assignment Problem · Step-by-Step
            </p>
          </div>
          {/* Toggles */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setShowFullTree((v) => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                  showFullTree ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    showFullTree ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="text-xs text-gray-300">Full Tree</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setVerboseMode((v) => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                  verboseMode ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    verboseMode ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="text-xs text-gray-300">Verbose Mode</span>
            </label>
            <span className="text-xs text-gray-500 hidden sm:block">
              ← → keys to navigate · Space to play/pause
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        {/* ── Row 1: Matrix Input ── */}
        <section>
          <MatrixInput
            n={n}
            matrix={matrix}
            onNChange={handleNChange}
            onMatrixChange={handleMatrixChange}
            onLoadDefault={handleLoadDefault}
            onVisualize={handleVisualize}
            isRunning={isRunning}
          />
        </section>

        {/* ── Visualization panels (only shown after start) ── */}
        {isRunning && currentStep && (
          <>
            {/* ── Row 2: Controls ── */}
            <section>
              <ControlBar
                stepIndex={stepIndex}
                totalSteps={steps.length}
                isPlaying={isPlaying}
                onPrev={goPrev}
                onNext={goNext}
                onPlay={startPlay}
                onPause={stopPlay}
                onReset={handleReset}
                speed={speed}
                onSpeedChange={setSpeed}
              />
            </section>

            {/* ── Row 3: Main content ── */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left column: explainer + bound panel */}
              <div className="xl:col-span-1 space-y-4">
                <StepExplainer step={currentStep} verbose={verboseMode} />
                <BoundPanel
                  breakdown={currentStep.lcBreakdown}
                  currentUC={currentStep.currentUC}
                />
              </div>

              {/* Right column: tree (takes 2/3 of width) */}
              <div className="xl:col-span-2" style={{ minHeight: 420 }}>
                <TreeVisualization
                  step={currentStep}
                  showFullTree={showFullTree}
                />
              </div>
            </section>

            {/* ── Row 4: Live queue + final answer ── */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LiveQueue step={currentStep} />

              {currentStep.finalAnswer ? (
                <FinalAnswer
                  assignments={currentStep.finalAnswer}
                  matrix={matrix}
                />
              ) : (
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 flex items-center justify-center">
                  <p className="text-sm text-gray-500 italic text-center">
                    Optimal solution will appear here once the algorithm
                    completes.
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {/* ── Welcome placeholder ── */}
        {!isRunning && (
          <div className="text-center py-16 space-y-4">
            <div className="text-5xl">🌳</div>
            <h2 className="text-xl font-semibold text-gray-200">
              Ready to Visualize
            </h2>
            <p className="text-gray-400 text-sm max-w-lg mx-auto">
              Enter your cost matrix above (or load the default 4×4 example),
              then click{" "}
              <span className="text-blue-400 font-medium">
                ▶ Visualize Branch &amp; Bound
              </span>{" "}
              to begin the step-by-step walkthrough.
            </p>

            {/* Algorithm concept cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
              {[
                {
                  icon: "📐",
                  title: "Lower Bound (LC)",
                  desc: "Minimum possible cost from this node — current path + min remaining per crew",
                },
                {
                  icon: "✂️",
                  title: "Pruning",
                  desc: "When LC ≥ UC, this branch cannot beat the best solution. Discard it.",
                },
                {
                  icon: "🏆",
                  title: "Upper Bound (UC)",
                  desc: "Best complete assignment found so far. Updated whenever a better solution is reached.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-left space-y-2"
                >
                  <div className="text-2xl">{card.icon}</div>
                  <p className="text-sm font-semibold text-white">
                    {card.title}
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 mt-12 py-4 text-center text-xs text-gray-600">
        Branch &amp; Bound Visualizer · Airline Crew Assignment · Pure Frontend
      </footer>
    </div>
  );
}
