import { motion } from "framer-motion";
import type { Card, Rank, Suit } from "../game";

const CARD_TRANSITION = { type: "spring", stiffness: 500, damping: 38 } as const;

const SUIT_COLOR: Record<Suit, string> = {
  oros: "text-amber-500",
  copas: "text-red-600",
  espadas: "text-sky-700",
  bastos: "text-emerald-700",
};

export const SUIT_LABEL: Record<Suit, string> = {
  oros: "🌞",
  copas: "🍷",
  espadas: "⚔️",
  bastos: "🪵",
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

export function CardView({
  card,
  dragging = false,
}: {
  card: Card;
  dragging?: boolean;
}) {
  const transition = dragging ? { duration: 0 } : CARD_TRANSITION;
  if (!card.faceUp) {
    return (
      <motion.div
        layoutId={card.id}
        transition={transition}
        style={{ width: CARD_W, height: CARD_H }}
        className="rounded-md bg-blue-900 border-2 border-blue-700 shadow-md"
      />
    );
  }
  const color = SUIT_COLOR[card.suit];
  return (
    <motion.div
      layoutId={card.id}
      transition={transition}
      style={{ width: CARD_W, height: CARD_H }}
      className={`rounded-md bg-white border border-gray-300 shadow-md flex flex-col p-1 select-none ${color}`}
    >
      <div className="text-sm font-bold leading-none flex items-center gap-0.5">
        <span>{RANK_LABEL[card.rank]}</span>
        <span className="text-xs">{SUIT_LABEL[card.suit]}</span>
      </div>
      <div className="flex-1 flex items-center justify-center text-3xl font-bold">
        {SUIT_LABEL[card.suit]}
      </div>
      <div className="text-sm font-bold leading-none self-end rotate-180 flex items-center gap-0.5">
        <span>{RANK_LABEL[card.rank]}</span>
        <span className="text-xs">{SUIT_LABEL[card.suit]}</span>
      </div>
    </motion.div>
  );
}

export function EmptySlot({
  label,
  icon,
}: {
  label?: string;
  icon?: string;
}) {
  return (
    <div
      style={{ width: CARD_W, height: CARD_H }}
      className="rounded-md border-2 border-dashed border-green-600/60 flex items-center justify-center"
    >
      {icon ? (
        <span
          className="text-3xl opacity-30"
          style={{ filter: "grayscale(1)" }}
        >
          {icon}
        </span>
      ) : (
        <span className="text-green-200/60 text-xs uppercase tracking-wide">
          {label ?? ""}
        </span>
      )}
    </div>
  );
}
