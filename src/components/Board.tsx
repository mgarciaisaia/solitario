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
  isSafe,
  type Card,
  type GameState,
  type Move,
  type MoveSource,
  type MoveTarget,
  type Suit,
} from "../game";
import { CARD_H, CARD_W, CardView, EmptySlot, SUIT_LABEL } from "./Card";

const STACK_OFFSET = 26;

type Props = {
  state: GameState;
  onMove: (move: Move) => void;
  highlightSafe: boolean;
};

function DraggableCard({
  card,
  source,
  onDoubleClick,
  highlight,
}: {
  card: Card;
  source: MoveSource;
  onDoubleClick?: () => void;
  highlight?: boolean;
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
    <div
      ref={setNodeRef}
      style={style}
      className={
        highlight ? "rounded-md ring-2 ring-yellow-300 shadow-yellow-300/40" : ""
      }
      {...listeners}
      {...attributes}
      onDoubleClick={onDoubleClick}
    >
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

function Column({
  cards,
  col,
  onMove,
  foundations,
  highlightSafe,
}: {
  cards: Card[];
  col: number;
  onMove: (move: Move) => void;
  foundations: Record<Suit, Card[]>;
  highlightSafe: boolean;
}) {
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
                    highlight={highlightSafe && isSafe(foundations, card)}
                    onDoubleClick={() =>
                      onMove({
                        kind: "move",
                        src: { kind: "column", col },
                        tgt: { kind: "foundations" },
                      })
                    }
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

function FoundationPile({ suit, pile }: { suit: Suit; pile: Card[] }) {
  const top = pile[pile.length - 1];
  return top ? <CardView card={top} /> : <EmptySlot icon={SUIT_LABEL[suit]} />;
}

function Foundations({
  foundations,
}: {
  foundations: Record<Suit, Card[]>;
}) {
  return (
    <DropTarget id="foundations" target={{ kind: "foundations" }}>
      <div className="flex gap-3 p-1 rounded-md">
        {SUITS.map((suit) => (
          <FoundationPile key={suit} suit={suit} pile={foundations[suit]} />
        ))}
      </div>
    </DropTarget>
  );
}

function Waste({
  waste,
  onMove,
  foundations,
  highlightSafe,
}: {
  waste: Card[];
  onMove: (move: Move) => void;
  foundations: Record<Suit, Card[]>;
  highlightSafe: boolean;
}) {
  const top = waste[waste.length - 1];
  if (!top) return <EmptySlot label="—" />;
  return (
    <DraggableCard
      card={top}
      source={{ kind: "waste" }}
      highlight={highlightSafe && isSafe(foundations, top)}
      onDoubleClick={() =>
        onMove({
          kind: "move",
          src: { kind: "waste" },
          tgt: { kind: "foundations" },
        })
      }
    />
  );
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

export function Board({ state, onMove, highlightSafe }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const src = event.active.data.current as MoveSource | undefined;
    const tgt = event.over?.data.current as MoveTarget | undefined;
    if (!src || !tgt) return;
    onMove({ kind: "move", src, tgt });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div className="flex gap-3">
            <Stock
              stock={state.stock}
              onDraw={() => onMove({ kind: "draw" })}
            />
            <Waste
              waste={state.waste}
              onMove={onMove}
              foundations={state.foundations}
              highlightSafe={highlightSafe}
            />
          </div>
          <Foundations foundations={state.foundations} />
        </div>
        <div className="flex gap-6 justify-center">
          {state.columns.map((cards, col) => (
            <Column
              key={col}
              cards={cards}
              col={col}
              onMove={onMove}
              foundations={state.foundations}
              highlightSafe={highlightSafe}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
