import { describeMove, type Move } from "../game";

type Entry = { move: Move; auto: boolean };

const LABEL_RANGE = 3;

export function History({
  entries,
  cursor,
  onCursorChange,
}: {
  entries: Entry[];
  cursor: number;
  onCursorChange: (cursor: number) => void;
}) {
  const total = entries.length;
  if (total === 0) return null;

  const startIdx = Math.max(0, cursor - LABEL_RANGE);
  const endIdx = Math.min(total, cursor + LABEL_RANGE);
  const visible = entries.slice(startIdx, endIdx);

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col items-center gap-1 mt-2 text-sm">
      <div className="flex gap-1 text-xs h-6 items-center min-h-6">
        {startIdx > 0 && <span className="opacity-50">…</span>}
        {visible.map((entry, i) => {
          const idx = startIdx + i;
          const isCurrent = idx === cursor - 1;
          return (
            <button
              key={idx}
              onClick={() => onCursorChange(idx + 1)}
              className={`px-1.5 py-0.5 rounded ${
                isCurrent
                  ? "bg-green-500 text-white font-bold"
                  : "bg-green-700/70 hover:bg-green-600"
              } ${entry.auto ? "italic" : ""}`}
            >
              {describeMove(entry.move)}
            </button>
          );
        })}
        {endIdx < total && <span className="opacity-50">…</span>}
      </div>
      <div className="flex items-center gap-2 w-full max-w-md">
        <input
          type="range"
          min={0}
          max={total}
          value={cursor}
          onChange={(e) => onCursorChange(Number(e.target.value))}
          className="flex-1 accent-green-400"
        />
        <span className="text-xs font-mono w-14 text-right">
          {cursor}/{total}
        </span>
      </div>
    </div>
  );
}
