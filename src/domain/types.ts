/**
 * Branded type utility for type safety
 */
export type Branded<T, B> = T & { _brand: B };

/**
 * Result type for handling success/failure
 */
export type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Helper functions for Result type
 */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * Position on the board
 */
export type Position = Readonly<{
  x: number;
  y: number;
}>;

/**
 * Creates a Position value object
 */
export const createPosition = (x: number, y: number): Position => 
  Object.freeze({ x, y });

/**
 * Standard dimensions for a Puyo Puyo board
 */
export const BOARD_WIDTH = 6;
export const BOARD_HEIGHT = 12;
export const HIDDEN_ROWS = 2; // Rows above the visible board