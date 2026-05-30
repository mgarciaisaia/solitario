import { useEffect, useMemo, useState } from "react";
import {
  applyMove,
  describeMove,
  formatMoves,
  isSafe,
  parseMoves,
  randomSeed,
  replay,
  type Move,
} from "./game";
import { Board } from "./components/Board";

type HistoryEntry = { move: Move; auto: boolean };
type History = { seed: number; entries: HistoryEntry[] };

type SafeMode = "off" | "highlight" | "auto";

const SAFE_MODES: { value: SafeMode; label: string }[] = [
  { value: "off", label: "No" },
  { value: "highlight", label: "Resaltar" },
  { value: "auto", label: "Auto" },
];

function encodeHistory(h: History): string {
  const seed = h.seed.toString(16).padStart(8, "0");
  if (h.entries.length === 0) return `seed=${seed}`;
  return `seed=${seed}&moves=${formatMoves(h.entries.map((e) => e.move))}`;
}

function decodeHistory(hash: string): History | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const seedStr = params.get("seed");
  if (!seedStr) return null;
  const seed = parseInt(seedStr, 16);
  if (!Number.isFinite(seed)) return null;
  const movesStr = params.get("moves") ?? "";
  return {
    seed,
    entries: parseMoves(movesStr).map((move) => ({ move, auto: false })),
  };
}

function findSafeAutoMove(state: ReturnType<typeof replay>): Move | null {
  const wasteTop = state.waste[state.waste.length - 1];
  if (wasteTop && isSafe(state.foundations, wasteTop)) {
    return {
      kind: "move",
      src: { kind: "waste" },
      tgt: { kind: "foundations" },
    };
  }
  for (let col = 0; col < state.columns.length; col++) {
    const cards = state.columns[col];
    const top = cards[cards.length - 1];
    if (top && top.faceUp && isSafe(state.foundations, top)) {
      return {
        kind: "move",
        src: { kind: "column", col },
        tgt: { kind: "foundations" },
      };
    }
  }
  return null;
}

export default function App() {
  const [history, setHistory] = useState<History>(() => {
    const fromHash = decodeHistory(window.location.hash);
    return fromHash ?? { seed: randomSeed(), entries: [] };
  });
  const [safeMode, setSafeMode] = useState<SafeMode>("off");
  const [highlightNext, setHighlightNext] = useState(false);

  useEffect(() => {
    const hash = "#" + encodeHistory(history);
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }, [history]);

  const state = useMemo(
    () => replay(history.seed, history.entries.map((e) => e.move)),
    [history.seed, history.entries],
  );

  useEffect(() => {
    if (safeMode !== "auto" || state.won) return;
    const safeMove = findSafeAutoMove(state);
    if (!safeMove) return;
    const timer = window.setTimeout(() => {
      setHistory((h) => ({
        ...h,
        entries: [...h.entries, { move: safeMove, auto: true }],
      }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [state, safeMode]);

  function onMove(m: Move) {
    if (!applyMove(state, m)) return;
    setHistory((h) => ({
      ...h,
      entries: [...h.entries, { move: m, auto: false }],
    }));
  }
  function onUndo() {
    setHistory((h) => {
      const entries = h.entries.slice();
      while (entries.length > 0 && entries[entries.length - 1].auto) {
        entries.pop();
      }
      if (entries.length > 0) entries.pop();
      return { ...h, entries };
    });
  }
  function onRestart() {
    if (!window.confirm("¿Reiniciar la partida actual?")) return;
    setHistory((h) => ({ ...h, entries: [] }));
  }
  function onNewGame() {
    if (history.entries.length > 0 && !window.confirm("¿Empezar una partida nueva?")) return;
    setHistory({ seed: randomSeed(), entries: [] });
  }

  const lastMove = history.entries[history.entries.length - 1]?.move;

  return (
    <main className="h-screen overflow-hidden bg-green-800 text-white flex flex-col p-2 sm:p-4">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3 max-w-4xl mx-auto w-full">
        <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-semibold leading-tight">
              Solitario
            </h1>
            <p className="text-xs text-green-200/80 italic">
              Como lo jugaba mi abuela
            </p>
          </div>
          <span className="text-xs text-green-200/70 font-mono">
            #{history.seed.toString(16).padStart(8, "0")} ·{" "}
            {history.entries.length} movs
            {lastMove && ` · ${describeMove(lastMove)}`}
          </span>
        </div>
        <div className="flex gap-2 sm:gap-3 items-center text-sm">
          <div className="flex items-center gap-1 select-none">
            <span className="hidden sm:inline">Seguras:</span>
            <span className="sm:hidden">Seg:</span>
            <div className="inline-flex rounded border border-green-500 overflow-hidden">
              {SAFE_MODES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSafeMode(value)}
                  className={`px-2 py-1 border-l border-green-500 first:border-l-0 ${
                    safeMode === value
                      ? "bg-green-500 text-white"
                      : "bg-green-700 hover:bg-green-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-1 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={highlightNext}
              onChange={(e) => setHighlightNext(e.target.checked)}
            />
            <span className="hidden sm:inline">Próximas</span>
            <span className="sm:hidden">Próx</span>
          </label>
          <button
            onClick={onUndo}
            disabled={history.entries.length === 0}
            className="px-2 sm:px-3 py-1 rounded bg-green-700 hover:bg-green-600 border border-green-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Deshacer
          </button>
          <button
            onClick={onRestart}
            disabled={history.entries.length === 0}
            className="px-2 sm:px-3 py-1 rounded bg-green-700 hover:bg-green-600 border border-green-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reiniciar
          </button>
          <button
            onClick={onNewGame}
            className="px-2 sm:px-3 py-1 rounded bg-green-700 hover:bg-green-600 border border-green-500"
          >
            Nuevo
          </button>
        </div>
      </div>
      <Board
        state={state}
        onMove={onMove}
        highlightSafe={safeMode === "highlight"}
        highlightNext={highlightNext}
      />
      {state.won && (
        <div className="text-center mt-6 text-3xl font-bold">¡Ganaste!</div>
      )}
    </main>
  );
}
