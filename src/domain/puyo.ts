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
 * Branded type for Puyo
 */
export type Puyo = Branded<{
  readonly color: PuyoColor;
}, "Puyo">;

/**
 * Error types for Puyo operations
 */
export type PuyoError = {
  type: "InvalidPuyoColor";
  message: string;
};

/**
 * Creates a Puyo with the specified color
 */
export function createPuyo(color: PuyoColor): Puyo {
  return Object.freeze({
    color,
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