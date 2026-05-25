export type Suit = "oros" | "copas" | "espadas" | "bastos";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export type Card = {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
};

export const SUITS: readonly Suit[] = [
  "oros",
  "copas",
  "espadas",
  "bastos",
] as const;

export const RANKS: readonly Rank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const;

export type GameState = {
  stock: Card[];
  waste: Card[];
  foundations: Record<Suit, Card[]>;
  columns: Card[][];
  won: boolean;
};

export type MoveSource =
  | { kind: "waste" }
  | { kind: "column"; col: number }
  | { kind: "foundation"; suit: Suit };

export type MoveTarget =
  | { kind: "column"; col: number }
  | { kind: "foundation"; suit: Suit };

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${suit}-${rank}`, suit, rank, faceUp: false });
    }
  }
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newGame(): GameState {
  const deck = shuffle(makeDeck());
  const columns: Card[][] = [[], [], [], [], []];
  for (let i = 0; i < 5; i++) {
    const faceDownCount = 4 - i;
    for (let k = 0; k < faceDownCount; k++) {
      const c = deck.pop()!;
      c.faceUp = false;
      columns[i].push(c);
    }
    const top = deck.pop()!;
    top.faceUp = true;
    columns[i].push(top);
  }
  return {
    stock: deck,
    waste: [],
    foundations: { oros: [], copas: [], espadas: [], bastos: [] },
    columns,
    won: false,
  };
}

export function rankIndex(r: Rank): number {
  return RANKS.indexOf(r);
}

export function canPlaceOnColumn(
  moving: Card,
  top: Card | undefined,
): boolean {
  if (!top) return true;
  if (!top.faceUp) return false;
  return (
    moving.suit !== top.suit &&
    rankIndex(moving.rank) === rankIndex(top.rank) - 1
  );
}

export function canPlaceOnFoundation(moving: Card, pile: Card[]): boolean {
  if (pile.length === 0) return moving.rank === 1;
  const top = pile[pile.length - 1];
  return (
    top.suit === moving.suit &&
    rankIndex(moving.rank) === rankIndex(top.rank) + 1
  );
}

function getSourceCard(state: GameState, src: MoveSource): Card | undefined {
  switch (src.kind) {
    case "waste":
      return state.waste[state.waste.length - 1];
    case "column": {
      const col = state.columns[src.col];
      const top = col[col.length - 1];
      return top?.faceUp ? top : undefined;
    }
    case "foundation": {
      const pile = state.foundations[src.suit];
      return pile[pile.length - 1];
    }
  }
}

function cloneState(s: GameState): GameState {
  return {
    stock: s.stock.map((c) => ({ ...c })),
    waste: s.waste.map((c) => ({ ...c })),
    foundations: {
      oros: s.foundations.oros.map((c) => ({ ...c })),
      copas: s.foundations.copas.map((c) => ({ ...c })),
      espadas: s.foundations.espadas.map((c) => ({ ...c })),
      bastos: s.foundations.bastos.map((c) => ({ ...c })),
    },
    columns: s.columns.map((col) => col.map((c) => ({ ...c }))),
    won: s.won,
  };
}

function removeSourceCard(state: GameState, src: MoveSource): void {
  switch (src.kind) {
    case "waste":
      state.waste.pop();
      return;
    case "column": {
      state.columns[src.col].pop();
      const col = state.columns[src.col];
      const newTop = col[col.length - 1];
      if (newTop && !newTop.faceUp) newTop.faceUp = true;
      return;
    }
    case "foundation":
      state.foundations[src.suit].pop();
      return;
  }
}

function checkWin(s: GameState): boolean {
  return SUITS.every((suit) => s.foundations[suit].length === RANKS.length);
}

export function tryMove(
  state: GameState,
  src: MoveSource,
  tgt: MoveTarget,
): GameState | null {
  const card = getSourceCard(state, src);
  if (!card) return null;
  if (src.kind === "column" && tgt.kind === "column" && src.col === tgt.col)
    return null;
  if (src.kind === "foundation") return null;

  if (tgt.kind === "column") {
    const colTop =
      state.columns[tgt.col][state.columns[tgt.col].length - 1];
    if (!canPlaceOnColumn(card, colTop)) return null;
  } else {
    if (!canPlaceOnFoundation(card, state.foundations[tgt.suit])) return null;
  }

  const next = cloneState(state);
  const carried = getSourceCard(next, src)!;
  removeSourceCard(next, src);
  if (tgt.kind === "column") {
    next.columns[tgt.col].push(carried);
  } else {
    next.foundations[tgt.suit].push(carried);
  }
  next.won = checkWin(next);
  return next;
}

export function drawFromStock(state: GameState): GameState {
  if (state.stock.length === 0) return state;
  const next = cloneState(state);
  const c = next.stock.pop()!;
  c.faceUp = true;
  next.waste.push(c);
  return next;
}
