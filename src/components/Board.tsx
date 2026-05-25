import { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SUITS,
  drawFromStock,
  tryMove,
  type Card,
  type GameState,
  type MoveSource,
  type MoveTarget,
  type Suit,
} from "../game";
import { CARD_H, CARD_W, CardView, EmptySlot, SUIT_LABEL } from "./Card";

const STACK_OFFSET = 26;

type Props = {
  state: GameState;
  setState: (s: GameState) => void;
};

function DraggableCard({
  card,
  source,
}: {
  card: Card;
  source: MoveSource;
}) {
  const id = useMemo(() => JSON.stringify(source), [source]);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, data: source });
  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
    touchAction: "none",
    zIndex: isDragging ? 50 : undefined,
    position: "relative",
  };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <CardView card={card} />
    </div>
  );
}

function DropTarget({
  id,
  target,
  children,
}: {
  id: string;
  target: MoveTarget;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: target });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-md transition-shadow ${isOver ? "ring-2 ring-yellow-300" : ""}`}
    >
      {children}
    </div>
  );
}

function Column({ cards, col }: { cards: Card[]; col: number }) {
  const lastIdx = cards.length - 1;
  const minHeight = CARD_H + Math.max(0, cards.length - 1) * STACK_OFFSET;
  return (
    <DropTarget id={`col-${col}`} target={{ kind: "column", col }}>
      {cards.length === 0 ? (
        <EmptySlot />
      ) : (
        <div className="relative" style={{ minHeight, width: CARD_W }}>
          {cards.map((card, i) => {
            const top = i * STACK_OFFSET;
            const isTop = i === lastIdx;
            return (
              <div
                key={card.id}
                className="absolute left-0"
                style={{ top }}
              >
                {isTop && card.faceUp ? (
                  <DraggableCard
                    card={card}
                    source={{ kind: "column", col }}
                  />
                ) : (
                  <CardView card={card} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </DropTarget>
  );
}

function Foundation({ suit, pile }: { suit: Suit; pile: Card[] }) {
  const top = pile[pile.length - 1];
  return (
    <DropTarget id={`found-${suit}`} target={{ kind: "foundation", suit }}>
      {top ? (
        <CardView card={top} />
      ) : (
        <EmptySlot icon={SUIT_LABEL[suit]} />
      )}
    </DropTarget>
  );
}

function Waste({ waste }: { waste: Card[] }) {
  const top = waste[waste.length - 1];
  if (!top) return <EmptySlot label="—" />;
  return <DraggableCard card={top} source={{ kind: "waste" }} />;
}

function Stock({
  stock,
  onDraw,
}: {
  stock: Card[];
  onDraw: () => void;
}) {
  if (stock.length === 0) {
    return (
      <div onClick={onDraw}>
        <EmptySlot label="∅" />
      </div>
    );
  }
  return (
    <div onClick={onDraw} className="cursor-pointer relative">
      <CardView card={{ ...stock[stock.length - 1], faceUp: false }} />
      <div className="absolute bottom-1 right-1 text-xs text-white/80 bg-black/40 rounded px-1">
        {stock.length}
      </div>
    </div>
  );
}

export function Board({ state, setState }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const src = event.active.data.current as MoveSource | undefined;
    const tgt = event.over?.data.current as MoveTarget | undefined;
    if (!src || !tgt) return;
    const next = tryMove(state, src, tgt);
    if (next) setState(next);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between mb-8">
          <div className="flex gap-3">
            <Stock
              stock={state.stock}
              onDraw={() => setState(drawFromStock(state))}
            />
            <Waste waste={state.waste} />
          </div>
          <div className="flex gap-3">
            {SUITS.map((suit) => (
              <Foundation
                key={suit}
                suit={suit}
                pile={state.foundations[suit]}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-6 justify-center">
          {state.columns.map((cards, col) => (
            <Column key={col} cards={cards} col={col} />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
