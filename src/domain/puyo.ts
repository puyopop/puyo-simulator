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