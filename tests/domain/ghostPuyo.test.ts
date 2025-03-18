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
  isCraneRow,
  GHOST_ROW,
  CRANE_ROW,
  NORMAL_FIELD_START
} from "../../src/domain/board.ts";
import {
  PuyoColor,
  createPuyo,
  createEmptyPuyo,
  isGhostPuyo,
  isCranePuyo
} from "../../src/domain/puyo.ts";
import {
  checkAndMarkChainsForDeletion
} from "../../src/domain/game.ts";

describe("Ghost and Crane Puyos", () => {
  it("Ghost row is defined correctly", () => {
    expect(GHOST_ROW, "ghost row index").toBe(1);
    expect(isGhostRow(GHOST_ROW), "is ghost row").toBe(true);
    expect(isGhostRow(GHOST_ROW - 1), "row below ghost row").toBe(false);
    expect(isGhostRow(GHOST_ROW + 1), "row above ghost row").toBe(false);
  });

  it("Crane row is defined correctly", () => {
    expect(CRANE_ROW, "crane row index").toBe(0);
    expect(isCraneRow(CRANE_ROW), "is crane row").toBe(true);
    expect(isCraneRow(CRANE_ROW + 1), "row below crane row").toBe(false);
    expect(isCraneRow(CRANE_ROW - 1), "row above crane row").toBe(false);
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

  it("Puyos in crane row are identified correctly", () => {
    const board = createBoard();
    const redPuyo = createPuyo(PuyoColor.RED);
    
    // Place a puyo in the crane row
    const result = setPuyoAt(board, 2, CRANE_ROW, redPuyo);
    expect(result.ok, "set puyo result").toBe(true);
    if (!result.ok) return;
    
    const updatedBoard = result.value;
    const puyo = getPuyoAt(updatedBoard, 2, CRANE_ROW);
    
    expect(isCranePuyo(puyo, 2, CRANE_ROW), "is crane puyo").toBe(true);
    expect(isCranePuyo(puyo, 2, CRANE_ROW + 1), "puyo in ghost row").toBe(false);
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

  it("Crane puyos don't fall when puyos below are cleared", () => {
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
    
    // Place a blue puyo in the crane row
    const bluePuyo = createPuyo(PuyoColor.BLUE);
    const craneResult = setPuyoAt(updatedBoard, 0, CRANE_ROW, bluePuyo);
    expect(craneResult.ok).toBe(true);
    if (!craneResult.ok) return;
    updatedBoard = craneResult.value;
    
    // Check that the blue puyo is in the crane row
    expect(getPuyoAt(updatedBoard, 0, CRANE_ROW).color).toBe(PuyoColor.BLUE);
    
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
    
    // The crane puyo should NOT have fallen down
    expect(getPuyoAt(boardAfterGravity, 0, CRANE_ROW).color).toBe(PuyoColor.BLUE);
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

  it("Crane puyos are not included in chain detection", () => {
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
    
    // Place a red puyo in the crane row to make a potential chain of 4
    const craneResult = setPuyoAt(updatedBoard, 0, CRANE_ROW, redPuyo);
    expect(craneResult.ok).toBe(true);
    if (!craneResult.ok) return;
    updatedBoard = craneResult.value;
    
    // Check for chains
    const { chainsFound } = checkAndMarkChainsForDeletion(updatedBoard, 0);
    
    // No chains should be found because the crane puyo doesn't count
    expect(chainsFound, "chains found").toBe(false);
  });
});