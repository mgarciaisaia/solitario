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
  | { kind: "foundation"; suit: Suit }
  | { kind: "foundations" };

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${suit}-${rank}`, suit, rank, faceUp: false });
    }
  }
  return deck;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0x100000000);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newGame(seed: number): GameState {
  const rng = mulberry32(seed);
  const deck = shuffle(makeDeck(), rng);
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

  const resolved: MoveTarget =
    tgt.kind === "foundations"
      ? { kind: "foundation", suit: card.suit }
      : tgt;

  if (resolved.kind === "column") {
    const colTop =
      state.columns[resolved.col][state.columns[resolved.col].length - 1];
    if (!canPlaceOnColumn(card, colTop)) return null;
  } else {
    if (!canPlaceOnFoundation(card, state.foundations[resolved.suit]))
      return null;
  }

  const next = cloneState(state);
  const carried = getSourceCard(next, src)!;
  removeSourceCard(next, src);
  if (resolved.kind === "column") {
    next.columns[resolved.col].push(carried);
  } else {
    next.foundations[resolved.suit].push(carried);
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

export type Move =
  | { kind: "draw" }
  | { kind: "move"; src: MoveSource; tgt: MoveTarget };

export function applyMove(state: GameState, m: Move): GameState | null {
  if (m.kind === "draw") {
    if (state.stock.length === 0) return null;
    return drawFromStock(state);
  }
  return tryMove(state, m.src, m.tgt);
}

export function replay(seed: number, moves: readonly Move[]): GameState {
  let s = newGame(seed);
  for (const m of moves) {
    const next = applyMove(s, m);
    if (next) s = next;
  }
  return s;
}

function suitChar(s: Suit): string {
  return s[0];
}

function formatSource(s: MoveSource): string {
  switch (s.kind) {
    case "waste":
      return "W";
    case "column":
      return `c${s.col}`;
    case "foundation":
      return `f${suitChar(s.suit)}`;
  }
}

function formatTarget(t: MoveTarget): string {
  switch (t.kind) {
    case "column":
      return `c${t.col}`;
    case "foundation":
      return `f${suitChar(t.suit)}`;
    case "foundations":
      return "f";
  }
}

export function formatMove(m: Move): string {
  if (m.kind === "draw") return "D";
  return formatSource(m.src) + formatTarget(m.tgt);
}

function parseSuit(c: string | undefined): Suit | null {
  switch (c) {
    case "o":
      return "oros";
    case "c":
      return "copas";
    case "e":
      return "espadas";
    case "b":
      return "bastos";
    default:
      return null;
  }
}

function parseColIndex(c: string | undefined): number | null {
  if (!c) return null;
  const n = c.charCodeAt(0) - "0".charCodeAt(0);
  return n >= 0 && n <= 4 ? n : null;
}

function parseSource(s: string, i: number): [MoveSource, number] | null {
  if (s[i] === "W") return [{ kind: "waste" }, i + 1];
  if (s[i] === "c") {
    const col = parseColIndex(s[i + 1]);
    if (col === null) return null;
    return [{ kind: "column", col }, i + 2];
  }
  return null;
}

function parseTarget(s: string, i: number): [MoveTarget, number] | null {
  if (s[i] === "c") {
    const col = parseColIndex(s[i + 1]);
    if (col === null) return null;
    return [{ kind: "column", col }, i + 2];
  }
  if (s[i] === "f") {
    const suit = parseSuit(s[i + 1]);
    if (suit) return [{ kind: "foundation", suit }, i + 2];
    return [{ kind: "foundations" }, i + 1];
  }
  return null;
}

export function parseMove(s: string): Move | null {
  if (s === "D") return { kind: "draw" };
  const srcRes = parseSource(s, 0);
  if (!srcRes) return null;
  const [src, i] = srcRes;
  const tgtRes = parseTarget(s, i);
  if (!tgtRes) return null;
  const [tgt, j] = tgtRes;
  if (j !== s.length) return null;
  return { kind: "move", src, tgt };
}
