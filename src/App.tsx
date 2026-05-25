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
  function onNewGame() {
    setHistory({ seed: randomSeed(), moves: [] });
  }

  const lastMove = history.moves[history.moves.length - 1];

  return (
    <main className="min-h-screen bg-green-800 text-white p-4">
      <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold">Solitario</h1>
          <span className="text-xs text-green-200/70 font-mono">
            #{history.seed.toString(16).padStart(8, "0")} ·{" "}
            {history.moves.length} movs
            {lastMove && ` · ${describeMove(lastMove)}`}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <label className="flex items-center gap-1 text-sm select-none cursor-pointer">
            <input
              type="checkbox"
              checked={highlightSafe}
              onChange={(e) => setHighlightSafe(e.target.checked)}
            />
            Resaltar seguras
          </label>
          <button
            onClick={onUndo}
            disabled={history.moves.length === 0}
            className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 border border-green-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Deshacer
          </button>
          <button
            onClick={onNewGame}
            className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 border border-green-500"
          >
            Nuevo juego
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
