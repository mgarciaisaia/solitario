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
import { History as HistoryStrip } from "./components/History";

type HistoryEntry = { move: Move; auto: boolean };
type History = { seed: number; entries: HistoryEntry[]; cursor: number };

type SafeMode = "off" | "highlight" | "auto";

const SAFE_MODES: { value: SafeMode; label: string }[] = [
  { value: "off", label: "No" },
  { value: "highlight", label: "Resaltar" },
  { value: "auto", label: "Auto" },
];

function encodeHistory(h: History): string {
  const seed = h.seed.toString(16).padStart(8, "0");
  let result = `seed=${seed}`;
  if (h.entries.length > 0) {
    result += `&moves=${formatMoves(h.entries.map((e) => e.move))}`;
  }
  if (h.cursor !== h.entries.length) {
    result += `&cursor=${h.cursor}`;
  }
  return result;
}

function decodeHistory(hash: string): History | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const seedStr = params.get("seed");
  if (!seedStr) return null;
  const seed = parseInt(seedStr, 16);
  if (!Number.isFinite(seed)) return null;
  const movesStr = params.get("moves") ?? "";
  const entries = parseMoves(movesStr).map((move) => ({ move, auto: false }));
  const cursorStr = params.get("cursor");
  let cursor = entries.length;
  if (cursorStr !== null) {
    const c = parseInt(cursorStr, 10);
    if (Number.isFinite(c) && c >= 0 && c <= entries.length) cursor = c;
  }
  return { seed, entries, cursor };
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
    return fromHash ?? { seed: randomSeed(), entries: [], cursor: 0 };
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
    () =>
      replay(
        history.seed,
        history.entries.slice(0, history.cursor).map((e) => e.move),
      ),
    [history.seed, history.entries, history.cursor],
  );

  useEffect(() => {
    if (safeMode !== "auto" || state.won) return;
    if (history.cursor !== history.entries.length) return;
    const safeMove = findSafeAutoMove(state);
    if (!safeMove) return;
    const timer = window.setTimeout(() => {
      setHistory((h) => ({
        ...h,
        entries: [...h.entries, { move: safeMove, auto: true }],
        cursor: h.entries.length + 1,
      }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [state, safeMode, history.cursor, history.entries.length]);

  function onMove(m: Move) {
    if (!applyMove(state, m)) return;
    setHistory((h) => {
      const truncated = h.entries.slice(0, h.cursor);
      truncated.push({ move: m, auto: false });
      return { ...h, entries: truncated, cursor: truncated.length };
    });
  }
  function onUndo() {
    setHistory((h) => {
      let c = h.cursor;
      while (c > 0 && h.entries[c - 1].auto) c--;
      if (c > 0) c--;
      return { ...h, cursor: c };
    });
  }
  function onCursorChange(c: number) {
    setHistory((h) => ({
      ...h,
      cursor: Math.max(0, Math.min(h.entries.length, c)),
    }));
  }
  function onRestart() {
    if (!window.confirm("¿Reiniciar la partida actual?")) return;
    setHistory((h) => ({ ...h, entries: [], cursor: 0 }));
  }
  function onNewGame() {
    if (history.entries.length > 0 && !window.confirm("¿Empezar una partida nueva?")) return;
    setHistory({ seed: randomSeed(), entries: [], cursor: 0 });
  }

  const lastMove =
    history.cursor > 0 ? history.entries[history.cursor - 1].move : undefined;

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
            {history.cursor}/{history.entries.length} movs
            {lastMove && ` · ${describeMove(lastMove)}`}
          </span>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm">
          <div className="flex gap-2 sm:gap-3 items-center">
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
          </div>
          <div className="flex gap-2 sm:gap-3 items-center">
            <button
              onClick={onUndo}
              disabled={history.cursor === 0}
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
      </div>
      <Board
        state={state}
        onMove={onMove}
        highlightSafe={safeMode === "highlight"}
        highlightNext={highlightNext}
      />
      <HistoryStrip
        entries={history.entries}
        cursor={history.cursor}
        onCursorChange={onCursorChange}
      />
      {state.won && history.cursor === history.entries.length && (
        <div className="text-center mt-6 text-3xl font-bold">¡Ganaste!</div>
      )}
    </main>
  );
}
