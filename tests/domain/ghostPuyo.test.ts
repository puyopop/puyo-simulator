import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import {
  createBoard,
  getPuyoAt,
  setPuyoAt,
  applyGravity,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  HIDDEN_ROWS,
  isGhostRow,
  isOffscreenRow,
  GHOST_ROW,
  OFFSCREEN_ROW,
  NORMAL_FIELD_START
} from "../../src/domain/board.ts";
import {
  PuyoColor,
  createPuyo,
  createEmptyPuyo,
  isGhostPuyo,
  isOffscreenPuyo
} from "../../src/domain/puyo.ts";
import {
  checkAndMarkChainsForDeletion
} from "../../src/domain/game.ts";

describe("Ghost and Offscreen Puyos", () => {
  it("Ghost row is defined correctly", () => {
    expect(GHOST_ROW, "ghost row index").toBe(1);
    expect(isGhostRow(GHOST_ROW), "is ghost row").toBe(true);
    expect(isGhostRow(GHOST_ROW - 1), "row below ghost row").toBe(false);
    expect(isGhostRow(GHOST_ROW + 1), "row above ghost row").toBe(false);
  });

  it("Offscreen row is defined correctly", () => {
    expect(OFFSCREEN_ROW, "offscreen row index").toBe(0);
    expect(isOffscreenRow(OFFSCREEN_ROW), "is offscreen row").toBe(true);
    expect(isOffscreenRow(OFFSCREEN_ROW + 1), "row below offscreen row").toBe(false);
    expect(isOffscreenRow(OFFSCREEN_ROW - 1), "row above offscreen row").toBe(false);
  });

  it("Puyos in ghost row are identified correctly", () => {
    const board = createBoard();
    const redPuyo = createPuyo(PuyoColor.RED);
    
    // Place a puyo in the ghost row
    const result = setPuyoAt(board, 2, GHOST_ROW, redPuyo);
    expect(result.ok, "set puyo result").toBe(true);
    if (!result.ok) return;
    
    const updatedBoard = result.value;
    const puyo = getPuyoAt(updatedBoard, 2, GHOST_ROW);
    
    expect(isGhostPuyo(puyo, 2, GHOST_ROW), "is ghost puyo").toBe(true);
    expect(isGhostPuyo(puyo, 2, GHOST_ROW + 1), "puyo in normal row").toBe(false);
  });

  it("Puyos in offscreen row are identified correctly", () => {
    const board = createBoard();
    const redPuyo = createPuyo(PuyoColor.RED);
    
    // Place a puyo in the offscreen row
    const result = setPuyoAt(board, 2, OFFSCREEN_ROW, redPuyo);
    expect(result.ok, "set puyo result").toBe(true);
    if (!result.ok) return;
    
    const updatedBoard = result.value;
    const puyo = getPuyoAt(updatedBoard, 2, OFFSCREEN_ROW);
    
    expect(isOffscreenPuyo(puyo, 2, OFFSCREEN_ROW), "is offscreen puyo").toBe(true);
    expect(isOffscreenPuyo(puyo, 2, OFFSCREEN_ROW + 1), "puyo in ghost row").toBe(false);
  });

  it("Ghost puyos fall when puyos below are cleared", () => {
    const board = createBoard();
    let updatedBoard = board;
    
    // Set up a chain of 4 red puyos at the bottom
    const redPuyo = createPuyo(PuyoColor.RED);
    const bottomRowY = board.grid.length - 1; // Last row of the board
    for (let x = 0; x < 4; x++) {
      const result = setPuyoAt(updatedBoard, x, bottomRowY, redPuyo);
      expect(result.ok).toBe(true);
      if (result.ok) updatedBoard = result.value;
    }
    
    // Place a blue puyo in the ghost row
    const bluePuyo = createPuyo(PuyoColor.BLUE);
    const ghostResult = setPuyoAt(updatedBoard, 0, GHOST_ROW, bluePuyo);
    expect(ghostResult.ok).toBe(true);
    if (!ghostResult.ok) return;
    updatedBoard = ghostResult.value;
    
    // Check that the blue puyo is in the ghost row
    expect(getPuyoAt(updatedBoard, 0, GHOST_ROW).color).toBe(PuyoColor.BLUE);
    console.log("Initial ghost row puyo color:", getPuyoAt(updatedBoard, 0, GHOST_ROW).color);
    
    // Mark the chain for deletion
    const { board: markedBoard, chainsFound } = checkAndMarkChainsForDeletion(updatedBoard, 0);
    expect(chainsFound, "chains found").toBe(true);
    
    // Check if the blue puyo is still in the ghost row after marking
    console.log("Ghost row puyo color after marking:", getPuyoAt(markedBoard, 0, GHOST_ROW).color);
    
    // Remove the marked puyos (simulating the game logic)
    let boardAfterRemoval = markedBoard;
    for (let x = 0; x < 4; x++) {
      const result = setPuyoAt(boardAfterRemoval, x, bottomRowY, createEmptyPuyo());
      expect(result.ok).toBe(true);
      if (result.ok) boardAfterRemoval = result.value;
    }
    
    // Check if the blue puyo is still in the ghost row after removal
    console.log("Ghost row puyo color after removal:", getPuyoAt(boardAfterRemoval, 0, GHOST_ROW).color);
    
    // Apply gravity
    const { board: boardAfterGravity, moved } = applyGravity(boardAfterRemoval);
    
    // Debug: Log the board state
    console.log("Ghost row puyo color after gravity:", getPuyoAt(boardAfterGravity, 0, GHOST_ROW).color);
    console.log("Bottom row puyo color after gravity:", getPuyoAt(boardAfterGravity, 0, bottomRowY).color);
    console.log("Gravity moved something:", moved);
    
    // Check all positions in the column to find where the blue puyo went
    for (let y = 0; y < board.grid.length; y++) {
      console.log(`Row ${y} puyo color:`, getPuyoAt(boardAfterGravity, 0, y).color);
    }
    
    // The blue puyo should no longer be in the ghost row
    expect(getPuyoAt(boardAfterGravity, 0, GHOST_ROW).color).toBe(PuyoColor.NONE);
  });

  it("Offscreen puyos don't fall when puyos below are cleared", () => {
    const board = createBoard();
    let updatedBoard = board;
    
    // Set up a chain of 4 red puyos at the bottom
    const redPuyo = createPuyo(PuyoColor.RED);
    const bottomRowY = board.grid.length - 1; // Last row of the board
    for (let x = 0; x < 4; x++) {
      const result = setPuyoAt(updatedBoard, x, bottomRowY, redPuyo);
      expect(result.ok).toBe(true);
      if (result.ok) updatedBoard = result.value;
    }
    
    // Place a blue puyo in the offscreen row
    const bluePuyo = createPuyo(PuyoColor.BLUE);
    const offscreenResult = setPuyoAt(updatedBoard, 0, OFFSCREEN_ROW, bluePuyo);
    expect(offscreenResult.ok).toBe(true);
    if (!offscreenResult.ok) return;
    updatedBoard = offscreenResult.value;
    
    // Check that the blue puyo is in the offscreen row
    expect(getPuyoAt(updatedBoard, 0, OFFSCREEN_ROW).color).toBe(PuyoColor.BLUE);
    
    // Mark the chain for deletion
    const { board: markedBoard, chainsFound } = checkAndMarkChainsForDeletion(updatedBoard, 0);
    expect(chainsFound, "chains found").toBe(true);
    
    // Remove the marked puyos (simulating the game logic)
    let boardAfterRemoval = markedBoard;
    for (let x = 0; x < 4; x++) {
      const result = setPuyoAt(boardAfterRemoval, x, bottomRowY, createEmptyPuyo());
      expect(result.ok).toBe(true);
      if (result.ok) boardAfterRemoval = result.value;
    }
    
    // Apply gravity
    const { board: boardAfterGravity } = applyGravity(boardAfterRemoval);
    
    // The offscreen puyo should NOT have fallen down
    expect(getPuyoAt(boardAfterGravity, 0, OFFSCREEN_ROW).color).toBe(PuyoColor.BLUE);
  });

  it("Ghost puyos are not included in chain detection", () => {
    const board = createBoard();
    let updatedBoard = board;
    
    // Set up 3 red puyos in a column
    const redPuyo = createPuyo(PuyoColor.RED);
    const bottomRowY = board.grid.length - 1;
    for (let i = 0; i < 3; i++) {
      const result = setPuyoAt(updatedBoard, 0, bottomRowY - i, redPuyo);
      expect(result.ok).toBe(true);
      if (result.ok) updatedBoard = result.value;
    }
    
    // Place a red puyo in the ghost row to make a potential chain of 4
    const ghostResult = setPuyoAt(updatedBoard, 0, GHOST_ROW, redPuyo);
    expect(ghostResult.ok).toBe(true);
    if (!ghostResult.ok) return;
    updatedBoard = ghostResult.value;
    
    // Check for chains
    const { chainsFound } = checkAndMarkChainsForDeletion(updatedBoard, 0);
    
    // No chains should be found because the ghost puyo doesn't count
    expect(chainsFound, "chains found").toBe(false);
  });

  it("Offscreen puyos are not included in chain detection", () => {
    const board = createBoard();
    let updatedBoard = board;
    
    // Set up 3 red puyos in a column
    const redPuyo = createPuyo(PuyoColor.RED);
    const bottomRowY = board.grid.length - 1;
    for (let i = 0; i < 3; i++) {
      const result = setPuyoAt(updatedBoard, 0, bottomRowY - i, redPuyo);
      expect(result.ok).toBe(true);
      if (result.ok) updatedBoard = result.value;
    }
    
    // Place a red puyo in the offscreen row to make a potential chain of 4
    const offscreenResult = setPuyoAt(updatedBoard, 0, OFFSCREEN_ROW, redPuyo);
    expect(offscreenResult.ok).toBe(true);
    if (!offscreenResult.ok) return;
    updatedBoard = offscreenResult.value;
    
    // Check for chains
    const { chainsFound } = checkAndMarkChainsForDeletion(updatedBoard, 0);
    
    // No chains should be found because the offscreen puyo doesn't count
    expect(chainsFound, "chains found").toBe(false);
  });
});