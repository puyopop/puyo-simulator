import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { 
  createBoard, 
  getPuyoAt, 
  setPuyoAt, 
  isEmptyAt, 
  isOutOfBounds,
  applyGravity,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  HIDDEN_ROWS
} from "../../src/domain/board.ts";
import { PuyoColor, createPuyo, createEmptyPuyo } from "../../src/domain/puyo.ts";

describe("Board", () => {
  it("createBoard creates an empty board", () => {
    const board = createBoard();
    
    // Check dimensions
    expect(board.grid.length, "board height").toBe(BOARD_HEIGHT + HIDDEN_ROWS);
    expect(board.grid[0].length, "board width").toBe(BOARD_WIDTH);
    
    // Check that all cells are empty
    for (let y = 0; y < BOARD_HEIGHT + HIDDEN_ROWS; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        expect(isEmptyAt(board, x, y), `cell at (${x}, ${y})`).toBe(true);
      }
    }
  });
  
  it("getPuyoAt returns the correct Puyo", () => {
    const board = createBoard();
    const redPuyo = createPuyo(PuyoColor.RED);
    
    // Set a Puyo at a specific position
    const result = setPuyoAt(board, 2, 3, redPuyo);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const updatedBoard = result.value;
    
    // Check that we can get it back
    const retrievedPuyo = getPuyoAt(updatedBoard, 2, 3);
    expect(retrievedPuyo.color, "retrieved puyo color").toBe(PuyoColor.RED);
    
    // Check that out of bounds returns empty Puyo
    const outOfBoundsPuyo = getPuyoAt(updatedBoard, -1, -1);
    expect(outOfBoundsPuyo.color, "out of bounds puyo").toBe(PuyoColor.NONE);
  });
  
  it("setPuyoAt updates the board immutably", () => {
    const board = createBoard();
    const redPuyo = createPuyo(PuyoColor.RED);
    
    // Set a Puyo
    const result = setPuyoAt(board, 2, 3, redPuyo);
    expect(result.ok, "set puyo result").toBe(true);
    if (!result.ok) return;
    
    const updatedBoard = result.value;
    
    // Original board should be unchanged
    expect(isEmptyAt(board, 2, 3), "original board cell").toBe(true);
    
    // Updated board should have the Puyo
    expect(isEmptyAt(updatedBoard, 2, 3), "updated board cell").toBe(false);
    expect(getPuyoAt(updatedBoard, 2, 3).color, "updated puyo color").toBe(PuyoColor.RED);
    
    // Out of bounds should return error
    const outOfBoundsResult = setPuyoAt(board, -1, -1, redPuyo);
    expect(outOfBoundsResult.ok, "out of bounds result").toBe(false);
    if (outOfBoundsResult.ok) return;
    expect(outOfBoundsResult.error.type, "error type").toBe("OutOfBounds");
  });
  
  it("applyGravity makes Puyos fall down", () => {
    const board = createBoard();
    const redPuyo = createPuyo(PuyoColor.RED);
    
    // Set a Puyo in the air
    const result = setPuyoAt(board, 2, 5, redPuyo);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const boardWithPuyo = result.value;
    
    // Apply gravity
    const { board: afterGravity, moved } = applyGravity(boardWithPuyo);
    
    // Puyo should have moved down
    expect(moved, "gravity moved something").toBe(true);
    expect(isEmptyAt(afterGravity, 2, 5), "original position now empty").toBe(true);
    expect(isEmptyAt(afterGravity, 2, 6), "new position has puyo").toBe(false);
    expect(getPuyoAt(afterGravity, 2, 6).color, "fallen puyo color").toBe(PuyoColor.RED);
    
    // Apply gravity again until settled
    let currentBoard = afterGravity;
    let stillMoving = true;
    
    while (stillMoving) {
      const gravityResult = applyGravity(currentBoard);
      currentBoard = gravityResult.board;
      stillMoving = gravityResult.moved;
    }
    
    // Puyo should be at the bottom
    const bottomRow = BOARD_HEIGHT + HIDDEN_ROWS - 1;
    expect(isEmptyAt(currentBoard, 2, bottomRow), "bottom position has puyo").toBe(false);
    expect(getPuyoAt(currentBoard, 2, bottomRow).color, "settled puyo color").toBe(PuyoColor.RED);
  });
});