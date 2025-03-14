import { Puyo, PuyoColor, createEmptyPuyo, isEmpty } from "./puyo.ts";
import { Position, Result, ok, err } from "./types.ts";

/**
 * Standard dimensions for a Puyo Puyo board
 */
export const BOARD_WIDTH = 6;
export const BOARD_HEIGHT = 12;
export const HIDDEN_ROWS = 2; // Rows above the visible board

/**
 * Re-export Position type
 */
export type { Position };

/**
 * Represents the game board for Puyo Puyo
 */
export type Board = Readonly<{
  grid: ReadonlyArray<ReadonlyArray<Puyo>>;
}>;

/**
 * Error types for Board operations
 */
export type BoardError = {
  type: "OutOfBounds" | "InvalidOperation";
  message: string;
};

/**
 * Creates a new empty board
 */
export function createBoard(): Board {
  const grid = Array(BOARD_HEIGHT + HIDDEN_ROWS)
    .fill(null)
    .map(() => 
      Array(BOARD_WIDTH)
        .fill(null)
        .map(() => createEmptyPuyo())
    );
  
  return Object.freeze({
    grid: Object.freeze(grid.map(row => Object.freeze(row)))
  });
}

/**
 * Checks if a position is out of bounds
 */
export function isOutOfBounds(board: Board, x: number, y: number): boolean {
  return x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT + HIDDEN_ROWS;
}

/**
 * Gets the Puyo at the specified position
 */
export function getPuyoAt(board: Board, x: number, y: number): Puyo {
  if (isOutOfBounds(board, x, y)) {
    return createEmptyPuyo();
  }
  return board.grid[y][x];
}

/**
 * Sets a Puyo at the specified position
 * Returns a new board with the updated Puyo
 */
export function setPuyoAt(board: Board, x: number, y: number, puyo: Puyo): Result<Board, BoardError> {
  if (isOutOfBounds(board, x, y)) {
    return err({
      type: "OutOfBounds",
      message: `Position (${x}, ${y}) is out of bounds`
    });
  }
  
  // Create a new grid with the updated Puyo
  const newGrid = board.grid.map((row, rowIndex) => {
    if (rowIndex === y) {
      return Object.freeze(row.map((cell, colIndex) => 
        colIndex === x ? puyo : cell
      ));
    }
    return row;
  });
  
  return ok(Object.freeze({
    grid: Object.freeze(newGrid)
  }));
}

/**
 * Checks if a position is empty (has no Puyo)
 */
export function isEmptyAt(board: Board, x: number, y: number): boolean {
  return isEmpty(getPuyoAt(board, x, y));
}

/**
 * Checks if a column is full
 */
export function isColumnFull(board: Board, x: number): boolean {
  return !isEmptyAt(board, x, HIDDEN_ROWS - 1);
}

/**
 * Applies gravity to make Puyos fall down
 * Returns a new board with Puyos moved down
 */
export function applyGravity(board: Board): { board: Board; moved: boolean } {
  let moved = false;
  let currentBoard = board;
  
  // Start from the bottom row and move up
  for (let x = 0; x < BOARD_WIDTH; x++) {
    for (let y = BOARD_HEIGHT + HIDDEN_ROWS - 2; y >= 0; y--) {
      const puyo = getPuyoAt(currentBoard, x, y);
      
      if (!isEmpty(puyo) && isEmptyAt(currentBoard, x, y + 1)) {
        // Move the Puyo down
        const result1 = setPuyoAt(currentBoard, x, y + 1, puyo);
        if (result1.ok) {
          const result2 = setPuyoAt(result1.value, x, y, createEmptyPuyo());
          if (result2.ok) {
            currentBoard = result2.value;
            moved = true;
          }
        }
      }
    }
  }
  
  return { board: currentBoard, moved };
}

/**
 * Creates a deep copy of the board
 */
export function cloneBoard(board: Board): Board {
  return createBoard();
}