import { useEffect, useMemo, useState } from "react";
import {
  applyMove,
  describeMove,
  formatMoves,
  parseMoves,
  randomSeed,
  replay,
  type Move,
} from "./game";
import { Board } from "./components/Board";

type History = { seed: number; moves: Move[] };

function encodeHistory(h: History): string {
  const seed = h.seed.toString(16).padStart(8, "0");
  if (h.moves.length === 0) return `seed=${seed}`;
  return `seed=${seed}&moves=${formatMoves(h.moves)}`;
}

function decodeHistory(hash: string): History | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const seedStr = params.get("seed");
  if (!seedStr) return null;
  const seed = parseInt(seedStr, 16);
  if (!Number.isFinite(seed)) return null;
  const movesStr = params.get("moves") ?? "";
  return { seed, moves: parseMoves(movesStr) };
}

export default function App() {
  const [history, setHistory] = useState<History>(() => {
    const fromHash = decodeHistory(window.location.hash);
    return fromHash ?? { seed: randomSeed(), moves: [] };
  });
  const [highlightSafe, setHighlightSafe] = useState(false);

  useEffect(() => {
    const hash = "#" + encodeHistory(history);
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }, [history]);

  const state = useMemo(
    () => replay(history.seed, history.moves),
    [history.seed, history.moves],
  );

  function onMove(m: Move) {
    if (!applyMove(state, m)) return;
    setHistory((h) => ({ ...h, moves: [...h.moves, m] }));
  }
  function onUndo() {
    setHistory((h) => ({ ...h, moves: h.moves.slice(0, -1) }));
  }
  function onRestart() {
    if (!window.confirm("¿Reiniciar la partida actual?")) return;
    setHistory((h) => ({ ...h, moves: [] }));
  }
  function onNewGame() {
    if (history.moves.length > 0 && !window.confirm("¿Empezar una partida nueva?")) return;
    setHistory({ seed: randomSeed(), moves: [] });
  }

  const lastMove = history.moves[history.moves.length - 1];

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
          <span className="hidden sm:inline text-xs text-green-200/70 font-mono">
            #{history.seed.toString(16).padStart(8, "0")} ·{" "}
            {history.moves.length} movs
            {lastMove && ` · ${describeMove(lastMove)}`}
          </span>
        </div>
        <div className="flex gap-2 sm:gap-3 items-center text-sm">
          <label className="flex items-center gap-1 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={highlightSafe}
              onChange={(e) => setHighlightSafe(e.target.checked)}
            />
            <span className="hidden sm:inline">Resaltar seguras</span>
            <span className="sm:hidden">Seguras</span>
          </label>
          <button
            onClick={onUndo}
            disabled={history.moves.length === 0}
            className="px-2 sm:px-3 py-1 rounded bg-green-700 hover:bg-green-600 border border-green-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Deshacer
          </button>
          <button
            onClick={onRestart}
            disabled={history.moves.length === 0}
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
      <Board state={state} onMove={onMove} highlightSafe={highlightSafe} />
      {state.won && (
        <div className="text-center mt-6 text-3xl font-bold">¡Ganaste!</div>
      )}
    </main>
  );
}
