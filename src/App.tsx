import { useState } from "react";
import { newGame } from "./game";
import { Board } from "./components/Board";

export default function App() {
  const [state, setState] = useState(newGame);
  return (
    <main className="min-h-screen bg-green-800 text-white p-4">
      <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold">Solitario</h1>
        <button
          onClick={() => setState(newGame())}
          className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 border border-green-500"
        >
          Nuevo juego
        </button>
      </div>
      <Board state={state} setState={setState} />
      {state.won && (
        <div className="text-center mt-6 text-3xl font-bold">¡Ganaste!</div>
      )}
    </main>
  );
}
