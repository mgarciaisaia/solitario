import type { Card, Rank, Suit } from "../game";

const SUIT_COLOR: Record<Suit, string> = {
  oros: "text-amber-500",
  copas: "text-red-600",
  espadas: "text-sky-700",
  bastos: "text-emerald-700",
};

const SUIT_LABEL: Record<Suit, string> = {
  oros: "O",
  copas: "C",
  espadas: "E",
  bastos: "B",
};

const RANK_LABEL: Record<Rank, string> = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  10: "10",
  11: "11",
  12: "12",
};

export const CARD_W = 70;
export const CARD_H = 100;

export function CardView({ card }: { card: Card }) {
  if (!card.faceUp) {
    return (
      <div
        style={{ width: CARD_W, height: CARD_H }}
        className="rounded-md bg-blue-900 border-2 border-blue-700 shadow-md"
      />
    );
  }
  const color = SUIT_COLOR[card.suit];
  return (
    <div
      style={{ width: CARD_W, height: CARD_H }}
      className={`rounded-md bg-white border border-gray-300 shadow-md flex flex-col p-1 select-none ${color}`}
    >
      <div className="text-sm font-bold leading-none">
        {RANK_LABEL[card.rank]}
      </div>
      <div className="flex-1 flex items-center justify-center text-3xl font-bold">
        {SUIT_LABEL[card.suit]}
      </div>
      <div className="text-sm font-bold leading-none self-end rotate-180">
        {RANK_LABEL[card.rank]}
      </div>
    </div>
  );
}

export function EmptySlot({ label }: { label?: string }) {
  return (
    <div
      style={{ width: CARD_W, height: CARD_H }}
      className="rounded-md border-2 border-dashed border-green-600/60 flex items-center justify-center text-green-200/60 text-xs uppercase tracking-wide"
    >
      {label ?? ""}
    </div>
  );
}
