import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import {
  createPuyoPair,
  rotateClockwise,
  rotateCounterClockwise,
  RotationState
} from "../../src/domain/puyoPair.ts";
import { createBoard, setPuyoAt } from "../../src/domain/board.ts";
import { PuyoColor, createPuyo } from "../../src/domain/puyo.ts";

describe("Wall Kick", () => {
  it("clockwise rotation to RIGHT state against right wall", () => {
    const board = createBoard();
    // Create a pair at the right edge of the board
    const pair = createPuyoPair(
      createPuyo(PuyoColor.RED),
      createPuyo(PuyoColor.BLUE),
      5, 5, RotationState.UP
    );
    
    // Rotate clockwise (second puyo would go out of bounds to the right)
    const result = rotateClockwise(pair, board);
    
    expect(result.ok, "rotation should succeed with wall kick").toBe(true);
    
    if (result.ok) {
      const rotatedPair = result.value;
      expect(rotatedPair.rotation, "rotation state").toBe(RotationState.RIGHT);
      // The pair should be shifted left by 1 (only LEFT direction is tried for RIGHT rotation)
      expect(rotatedPair.position.x, "x position after wall kick").toBe(4);
      expect(rotatedPair.position.y, "y position").toBe(5);
    }
  });

  it("clockwise rotation to LEFT state against left wall", () => {
    const board = createBoard();
    // Create a pair at the left edge of the board
    const pair = createPuyoPair(
      createPuyo(PuyoColor.RED),
      createPuyo(PuyoColor.BLUE),
      0, 5, RotationState.DOWN
    );
    
    // Rotate clockwise (second puyo would go out of bounds to the left)
    const result = rotateClockwise(pair, board);
    
    expect(result.ok, "rotation should succeed with wall kick").toBe(true);
    
    if (result.ok) {
      const rotatedPair = result.value;
      expect(rotatedPair.rotation, "rotation state").toBe(RotationState.LEFT);
      // The pair should be shifted right by 1 (only RIGHT direction is tried for LEFT rotation)
      expect(rotatedPair.position.x, "x position after wall kick").toBe(1);
      expect(rotatedPair.position.y, "y position").toBe(5);
    }
  });

  it("clockwise rotation to DOWN state against floor", () => {
    const board = createBoard();
    // Create a pair at the bottom of the board
    const pair = createPuyoPair(
      createPuyo(PuyoColor.RED),
      createPuyo(PuyoColor.BLUE),
      3, 13, RotationState.RIGHT
    );
    
    // Rotate clockwise (second puyo would go below the board)
    const result = rotateClockwise(pair, board);
    
    expect(result.ok, "rotation should succeed with wall kick").toBe(true);
    
    if (result.ok) {
      const rotatedPair = result.value;
      expect(rotatedPair.rotation, "rotation state").toBe(RotationState.DOWN);
      // The pair should be shifted up by 1 (only UP direction is tried for DOWN rotation)
      expect(rotatedPair.position.x, "x position").toBe(3);
      expect(rotatedPair.position.y, "y position after wall kick").toBe(12);
    }
  });

  it("counter-clockwise rotation to DOWN state against floor", () => {
    const board = createBoard();
    // Create a pair at the bottom of the board
    const pair = createPuyoPair(
      createPuyo(PuyoColor.RED),
      createPuyo(PuyoColor.BLUE),
      3, 13, RotationState.LEFT
    );
    
    // Rotate counter-clockwise (second puyo would go below the board)
    const result = rotateCounterClockwise(pair, board);
    
    expect(result.ok, "rotation should succeed with wall kick").toBe(true);
    
    if (result.ok) {
      const rotatedPair = result.value;
      expect(rotatedPair.rotation, "rotation state").toBe(RotationState.DOWN);
      // The pair should be shifted up by 1 (only UP direction is tried for DOWN rotation)
      expect(rotatedPair.position.x, "x position").toBe(3);
      expect(rotatedPair.position.y, "y position after wall kick").toBe(12);
    }
  });

  it("clockwise rotation to RIGHT state against another Puyo", () => {
    let board = createBoard();
    
    // Place a blocking Puyo
    const blockingPuyoResult = setPuyoAt(board, 4, 5, createPuyo(PuyoColor.GREEN));
    expect(blockingPuyoResult.ok, "placing blocking puyo").toBe(true);
    
    if (blockingPuyoResult.ok) {
      board = blockingPuyoResult.value;
      
      // Create a pair next to the blocking Puyo
      const pair = createPuyoPair(
        createPuyo(PuyoColor.RED),
        createPuyo(PuyoColor.BLUE),
        3, 5, RotationState.UP
      );
      
      // Rotate clockwise (second puyo would collide with the blocking puyo)
      const result = rotateClockwise(pair, board);
      
      expect(result.ok, "rotation should succeed with wall kick").toBe(true);
      
      if (result.ok) {
        const rotatedPair = result.value;
        expect(rotatedPair.rotation, "rotation state").toBe(RotationState.RIGHT);
        // The pair should be shifted left by 1 (only LEFT direction is tried for RIGHT rotation)
        expect(rotatedPair.position.x, "x position after wall kick").toBe(2);
        expect(rotatedPair.position.y, "y position").toBe(5);
      }
    }
  });

  it("counter-clockwise rotation to LEFT state against left wall", () => {
    const board = createBoard();
    // Create a pair at the left edge of the board
    const pair = createPuyoPair(
      createPuyo(PuyoColor.RED),
      createPuyo(PuyoColor.BLUE),
      0, 5, RotationState.UP
    );
    
    // Rotate counter-clockwise (second puyo would go out of bounds to the left)
    const result = rotateCounterClockwise(pair, board);
    
    expect(result.ok, "rotation should succeed with wall kick").toBe(true);
    
    if (result.ok) {
      const rotatedPair = result.value;
      expect(rotatedPair.rotation, "rotation state").toBe(RotationState.LEFT);
      // The pair should be shifted right by 1 (only RIGHT direction is tried for LEFT rotation)
      expect(rotatedPair.position.x, "x position after wall kick").toBe(1);
      expect(rotatedPair.position.y, "y position").toBe(5);
    }
  });

  it("fails when no valid position exists for DOWN rotation", () => {
    let board = createBoard();
    
    // Place a blocking Puyo to block the only valid wall kick position for DOWN rotation
    const blockingPuyoResult = setPuyoAt(board, 3, 12, createPuyo(PuyoColor.GREEN));
    expect(blockingPuyoResult.ok, "placing blocking puyo").toBe(true);
    
    if (blockingPuyoResult.ok) {
      board = blockingPuyoResult.value;
      
      // Create a pair at the bottom of the board
      const pair = createPuyoPair(
        createPuyo(PuyoColor.RED),
        createPuyo(PuyoColor.BLUE),
        3, 13, RotationState.RIGHT
      );
      
      // Attempt to rotate clockwise (would go to DOWN state)
      const result = rotateClockwise(pair, board);
      
      // Rotation should fail because the only wall kick position (UP) is blocked
      expect(result.ok, "rotation should fail when the only wall kick position is blocked").toBe(false);
      if (!result.ok) {
        expect(result.error.type, "error type").toBe("InvalidRotation");
      }
    }
  });

  it("fails when no valid position exists for RIGHT rotation", () => {
    let board = createBoard();
    
    // Place a blocking Puyo to the left to block the only valid wall kick position for RIGHT rotation
    const blockingPuyoResult = setPuyoAt(board, 2, 5, createPuyo(PuyoColor.GREEN));
    expect(blockingPuyoResult.ok, "placing blocking puyo").toBe(true);
    
    if (blockingPuyoResult.ok) {
      board = blockingPuyoResult.value;
      
      // Create a pair at the right edge of the board
      const pair = createPuyoPair(
        createPuyo(PuyoColor.RED),
        createPuyo(PuyoColor.BLUE),
        3, 5, RotationState.UP
      );
      
      // Place another blocking Puyo to the right
      const rightBlockingResult = setPuyoAt(board, 4, 5, createPuyo(PuyoColor.GREEN));
      expect(rightBlockingResult.ok, "placing right blocking puyo").toBe(true);
      
      if (rightBlockingResult.ok) {
        board = rightBlockingResult.value;
        
        // Attempt to rotate clockwise (would go to RIGHT state)
        const result = rotateClockwise(pair, board);
        
        // Rotation should fail because the only wall kick position (LEFT) is blocked
        expect(result.ok, "rotation should fail when the only wall kick position is blocked").toBe(false);
        if (!result.ok) {
          expect(result.error.type, "error type").toBe("InvalidRotation");
        }
      }
    }
  });
});