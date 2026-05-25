import { describe, expect, test } from "vitest";
import {
  isSafe,
  RANKS,
  SUITS,
  type Card,
  type Rank,
  type Suit,
} from "./game";

function card(suit: Suit, rank: Rank): Card {
  return { id: `${suit}-${rank}`, suit, rank, faceUp: true };
}

// A foundation that has been built up As→`upTo` (or empty when `upTo` is null).
function pile(suit: Suit, upTo: Rank | null): Card[] {
  if (upTo === null) return [];
  const out: Card[] = [];
  for (const r of RANKS) {
    out.push(card(suit, r));
    if (r === upTo) break;
  }
  return out;
}

// Build all four foundations. Missing suits default to empty.
function fnd(
  spec: Partial<Record<Suit, Rank | null>>,
): Record<Suit, Card[]> {
  const out: Record<Suit, Card[]> = {
    oros: [],
    copas: [],
    espadas: [],
    bastos: [],
  };
  for (const s of SUITS) out[s] = pile(s, spec[s] ?? null);
  return out;
}

describe("isSafe", () => {
  describe("As (rank 1)", () => {
    test("safe when its own foundation is empty (it's next, nothing else matters)", () => {
      expect(isSafe(fnd({}), card("oros", 1))).toBe(true);
    });

    test("not safe once that As is already on the foundation", () => {
      expect(isSafe(fnd({ oros: 1 }), card("oros", 1))).toBe(false);
    });
  });

  describe("rank 2", () => {
    test("safe as soon as its own As is on the foundation", () => {
      // No requirement on other suits — the only card that could land on a tableau 2
      // is an As, and Ases always go straight to their foundation.
      expect(isSafe(fnd({ oros: 1 }), card("oros", 2))).toBe(true);
    });

    test("not safe if the 2 itself can't go on the foundation yet", () => {
      expect(isSafe(fnd({}), card("oros", 2))).toBe(false);
    });
  });

  describe("rank 3 (needs Ases of every other suit on foundation)", () => {
    test("safe when own foundation has As+2 and every other suit has at least As", () => {
      expect(
        isSafe(
          fnd({ oros: 2, copas: 1, espadas: 1, bastos: 1 }),
          card("oros", 3),
        ),
      ).toBe(true);
    });

    test("not safe if one other suit's As is still in play", () => {
      expect(
        isSafe(
          fnd({ oros: 2, copas: null, espadas: 1, bastos: 1 }),
          card("oros", 3),
        ),
      ).toBe(false);
    });
  });

  describe("rank 4 (needs As+2 of every other suit on foundation)", () => {
    test("safe when own has up to 3 and others have at least up to 2", () => {
      expect(
        isSafe(
          fnd({ oros: 3, copas: 2, espadas: 2, bastos: 2 }),
          card("oros", 4),
        ),
      ).toBe(true);
    });

    test("not safe if one other suit is still missing its 2", () => {
      expect(
        isSafe(
          fnd({ oros: 3, copas: 1, espadas: 2, bastos: 2 }),
          card("oros", 4),
        ),
      ).toBe(false);
    });
  });

  describe("rank 7 (needs As..5 of every other suit on foundation)", () => {
    test("safe when others reach 5 (boundary case)", () => {
      expect(
        isSafe(
          fnd({ oros: 6, copas: 5, espadas: 5, bastos: 5 }),
          card("oros", 7),
        ),
      ).toBe(true);
    });

    test("not safe if any other suit only reaches 4", () => {
      expect(
        isSafe(
          fnd({ oros: 6, copas: 5, espadas: 4, bastos: 5 }),
          card("oros", 7),
        ),
      ).toBe(false);
    });
  });

  describe("Sota / rank 10 (needs As..6 of every other suit — the 7-to-10 gap is just 'next')", () => {
    test("safe when others reach 6", () => {
      expect(
        isSafe(
          fnd({ oros: 7, copas: 6, espadas: 6, bastos: 6 }),
          card("oros", 10),
        ),
      ).toBe(true);
    });

    test("not safe if any other suit only reaches 5", () => {
      expect(
        isSafe(
          fnd({ oros: 7, copas: 5, espadas: 6, bastos: 6 }),
          card("oros", 10),
        ),
      ).toBe(false);
    });
  });

  describe("Caballo / rank 11 (needs As..7 of every other suit)", () => {
    test("safe when others reach 7", () => {
      expect(
        isSafe(
          fnd({ oros: 10, copas: 7, espadas: 7, bastos: 7 }),
          card("oros", 11),
        ),
      ).toBe(true);
    });

    test("not safe if any other suit only reaches 6", () => {
      expect(
        isSafe(
          fnd({ oros: 10, copas: 6, espadas: 7, bastos: 7 }),
          card("oros", 11),
        ),
      ).toBe(false);
    });
  });

  describe("Rey / rank 12 (needs As..Sota of every other suit)", () => {
    test("safe when others reach Sota (10)", () => {
      expect(
        isSafe(
          fnd({ oros: 11, copas: 10, espadas: 10, bastos: 10 }),
          card("oros", 12),
        ),
      ).toBe(true);
    });

    test("not safe if any other suit is one step behind (only reaches 7)", () => {
      expect(
        isSafe(
          fnd({ oros: 11, copas: 7, espadas: 10, bastos: 10 }),
          card("oros", 12),
        ),
      ).toBe(false);
    });
  });

  describe("card can't be sent to foundation yet", () => {
    test("not safe if previous rank of same suit is missing from foundation", () => {
      expect(
        isSafe(
          fnd({ oros: null, copas: 1, espadas: 1, bastos: 1 }),
          card("oros", 3),
        ),
      ).toBe(false);
    });
  });
});
