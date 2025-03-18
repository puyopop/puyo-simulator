import { Branded, Result, ok, err } from "./types.ts";

/**
 * Represents the different colors of Puyo pieces
 */
export enum PuyoColor {
  RED = "red",
  GREEN = "green",
  BLUE = "blue",
  YELLOW = "yellow",
  PURPLE = "purple",
  NONE = "none"
}

/**
 * Represents the state of a Puyo
 */
export enum PuyoState {
  NORMAL = "normal",
  MARKED_FOR_DELETION = "marked_for_deletion"
}

/**
 * Branded type for Puyo
 */
export type Puyo = Branded<{
  readonly color: PuyoColor;
  readonly state: PuyoState;
}, "Puyo">;

/**
 * Error types for Puyo operations
 */
export type PuyoError = {
  type: "InvalidPuyoColor";
  message: string;
};

/**
 * Creates a Puyo with the specified color and state
 */
export function createPuyo(color: PuyoColor, state: PuyoState = PuyoState.NORMAL): Puyo {
  return Object.freeze({
    color,
    state,
    _brand: "Puyo" as const
  });
}

/**
 * Creates an empty Puyo (no color)
 */
export function createEmptyPuyo(): Puyo {
  return createPuyo(PuyoColor.NONE);
}

/**
 * Creates a Puyo marked for deletion
 */
export function markPuyoForDeletion(puyo: Puyo): Puyo {
  return createPuyo(puyo.color, PuyoState.MARKED_FOR_DELETION);
}

/**
 * Checks if a Puyo is empty (has no color)
 */
export function isEmpty(puyo: Puyo): boolean {
  return puyo.color === PuyoColor.NONE;
}

/**
 * Checks if a Puyo can connect with another Puyo
 */
export function canConnectWith(puyo: Puyo, other: Puyo): boolean {
  return puyo.color !== PuyoColor.NONE && puyo.color === other.color;
}

/**
 * Checks if a Puyo is in the ghost row
 */
export function isGhostPuyo(puyo: Puyo, x: number, y: number): boolean {
  // Ghost row is now at y=1
  return y === 1;
}

/**
 * Checks if a Puyo is in the crane row
 */
export function isCranePuyo(puyo: Puyo, x: number, y: number): boolean {
  // Crane row (クレーン行) is at y=0
  return y === 0;
}

/**
 * Creates a random Puyo with one of the available colors
 */
export function createRandomPuyo(): Puyo {
  const colors = [
    PuyoColor.RED,
    PuyoColor.GREEN,
    PuyoColor.BLUE,
    PuyoColor.YELLOW,
    PuyoColor.PURPLE
  ];
  
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  return createPuyo(randomColor);
}