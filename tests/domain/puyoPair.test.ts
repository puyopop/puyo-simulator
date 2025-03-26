import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { 
  createPuyoPair,
  createRandomPuyoPair,
  getMainPosition,
  getSecondPosition,
  moveLeft,
  moveRight,
  moveDown,
  rotateClockwise,
  rotateCounterClockwise,
  placeOnBoard,
  RotationState,
  executeQuickTurn
} from "../../src/domain/puyoPair.ts";
import { createBoard, isEmptyAt, getPuyoAt, setPuyoAt } from "../../src/domain/board.ts";
import { PuyoColor, createPuyo } from "../../src/domain/puyo.ts";

describe("PuyoPair", () => {
  it("createPuyoPair creates a pair with the specified properties", () => {
    const mainPuyo = createPuyo(PuyoColor.RED);
    const secondPuyo = createPuyo(PuyoColor.BLUE);
    const pair = createPuyoPair(mainPuyo, secondPuyo, 2, 3, RotationState.RIGHT);
    
    expect(pair.mainPuyo.color, "main puyo color").toBe(PuyoColor.RED);
    expect(pair.secondPuyo.color, "second puyo color").toBe(PuyoColor.BLUE);
    expect(pair.position.x, "x position").toBe(2);
    expect(pair.position.y, "y position").toBe(3);
    expect(pair.rotation, "rotation").toBe(RotationState.RIGHT);
  });
  
  it("getSecondPosition returns the correct position based on rotation", () => {
    const mainPuyo = createPuyo(PuyoColor.RED);
    const secondPuyo = createPuyo(PuyoColor.BLUE);
    const x = 2;
    const y = 3;
    
    // Test all rotation states
    const upPair = createPuyoPair(mainPuyo, secondPuyo, x, y, RotationState.UP);
    const upSecondPos = getSecondPosition(upPair);
    expect(upSecondPos.x, "UP rotation x").toBe(x);
    expect(upSecondPos.y, "UP rotation y").toBe(y - 1);
    
    const rightPair = createPuyoPair(mainPuyo, secondPuyo, x, y, RotationState.RIGHT);
    const rightSecondPos = getSecondPosition(rightPair);
    expect(rightSecondPos.x, "RIGHT rotation x").toBe(x + 1);
    expect(rightSecondPos.y, "RIGHT rotation y").toBe(y);
    
    const downPair = createPuyoPair(mainPuyo, secondPuyo, x, y, RotationState.DOWN);
    const downSecondPos = getSecondPosition(downPair);
    expect(downSecondPos.x, "DOWN rotation x").toBe(x);
    expect(downSecondPos.y, "DOWN rotation y").toBe(y + 1);
    
    const leftPair = createPuyoPair(mainPuyo, secondPuyo, x, y, RotationState.LEFT);
    const leftSecondPos = getSecondPosition(leftPair);
    expect(leftSecondPos.x, "LEFT rotation x").toBe(x - 1);
    expect(leftSecondPos.y, "LEFT rotation y").toBe(y);
  });
  
  it("moveLeft moves the pair left when possible", () => {
    const board = createBoard();
    const pair = createPuyoPair(
      createPuyo(PuyoColor.RED),
      createPuyo(PuyoColor.BLUE),
      2, 3, RotationState.DOWN
    );
    
    // Move left
    const result = moveLeft(pair, board);
    expect(result.ok, "move left result").toBe(true);
    
    if (result.ok) {
      const movedPair = result.value;
      expect(movedPair.position.x, "moved x position").toBe(1);
      expect(movedPair.position.y, "moved y position").toBe(3);
      
      // Original pair should be unchanged
      expect(pair.position.x, "original x position").toBe(2);
    }
    
    // Try to move left at edge
    const edgePair = createPuyoPair(
      createPuyo(PuyoColor.RED),
      createPuyo(PuyoColor.BLUE),
      0, 3, RotationState.DOWN
    );
    
    const edgeResult = moveLeft(edgePair, board);
    expect(edgeResult.ok, "edge move result").toBe(false);
  });
  
  it("rotateClockwise rotates the pair when possible", () => {
    const board = createBoard();
    const pair = createPuyoPair(
      createPuyo(PuyoColor.RED),
      createPuyo(PuyoColor.BLUE),
      2, 3, RotationState.DOWN
    );
    
    // Rotate clockwise
    const result = rotateClockwise(pair, board);
    expect(result.ok, "rotate result").toBe(true);
    
    if (result.ok) {
      const rotatedPair = result.value;
      expect(rotatedPair.rotation, "rotated state").toBe(RotationState.LEFT);
      
      // Original pair should be unchanged
      expect(pair.rotation, "original rotation").toBe(RotationState.DOWN);
    }
  });
  
  it("placeOnBoard places the pair on the board", () => {
    const board = createBoard();
    const pair = createPuyoPair(
      createPuyo(PuyoColor.RED),
      createPuyo(PuyoColor.BLUE),
      2, 3, RotationState.DOWN
    );
    
    // Place on board
    const result = placeOnBoard(pair, board);
    expect(result.ok, "place result").toBe(true);
    
    if (result.ok) {
      const updatedBoard = result.value;
      const mainPos = getMainPosition(pair);
      const secondPos = getSecondPosition(pair);
      
      // Check that the Puyos are on the board
      expect(isEmptyAt(updatedBoard, mainPos.x, mainPos.y), "main position").toBe(false);
      expect(isEmptyAt(updatedBoard, secondPos.x, secondPos.y), "second position").toBe(false);
      
      expect(getPuyoAt(updatedBoard, mainPos.x, mainPos.y).color, "main puyo color").toBe(PuyoColor.RED);
      expect(getPuyoAt(updatedBoard, secondPos.x, secondPos.y).color, "second puyo color").toBe(PuyoColor.BLUE);
      
      // Original board should be unchanged
      expect(isEmptyAt(board, mainPos.x, mainPos.y), "original board main position").toBe(true);
      expect(isEmptyAt(board, secondPos.x, secondPos.y), "original board second position").toBe(true);
    }
  });

  it("rotating clockwise then counterclockwise returns to original position", () => {
    const board = createBoard();
    
    // Test for all rotation states
    const rotationStates = [
      RotationState.UP,
      RotationState.RIGHT,
      RotationState.DOWN,
      RotationState.LEFT
    ];
    
    for (const initialRotation of rotationStates) {
      const pair = createPuyoPair(
        createPuyo(PuyoColor.RED),
        createPuyo(PuyoColor.BLUE),
        2, 3, initialRotation
      );
      
      // First rotate clockwise
      const clockwiseResult = rotateClockwise(pair, board);
      expect(clockwiseResult.ok, `clockwise rotation from ${RotationState[initialRotation]}`).toBe(true);
      
      if (clockwiseResult.ok) {
        const clockwisePair = clockwiseResult.value;
        
        // Then rotate counterclockwise
        const counterClockwiseResult = rotateCounterClockwise(clockwisePair, board);
        expect(counterClockwiseResult.ok, `counterclockwise rotation from ${RotationState[clockwisePair.rotation]}`).toBe(true);
        
        if (counterClockwiseResult.ok) {
          const finalPair = counterClockwiseResult.value;
          
          // Verify we're back to the original rotation
          expect(finalPair.rotation, `final rotation after clockwise+counterclockwise from ${RotationState[initialRotation]}`).toBe(initialRotation);
          
          // Position should also remain unchanged
          expect(finalPair.position.x, "x position after rotations").toBe(pair.position.x);
          expect(finalPair.position.y, "y position after rotations").toBe(pair.position.y);
        }
      }
    }
  });

  it("executeQuickTurn works from UP to DOWN when both sides are blocked by Puyos", () => {
    // Create a board with Puyos on both sides of the pair
    let board = createBoard();
    const x = 2;
    const y = 3;
    
    // Place blocking Puyos on both sides of the pair
    const leftResult = setPuyoAt(board, x - 1, y, createPuyo(PuyoColor.RED)); // Left blocker
    if (leftResult.ok) {
      board = leftResult.value;
    }
    
    const rightResult = setPuyoAt(board, x + 1, y, createPuyo(PuyoColor.BLUE)); // Right blocker
    if (rightResult.ok) {
      board = rightResult.value;
    }
    
    // Create a pair with UP rotation
    const pair = createPuyoPair(
      createPuyo(PuyoColor.GREEN),
      createPuyo(PuyoColor.YELLOW),
      x, y, RotationState.UP
    );
    
    // Get original positions for comparison
    const originalMainPos = getMainPosition(pair);
    const originalSecondPos = getSecondPosition(pair);
    
    // Execute quick turn
    const result = executeQuickTurn(pair, board);
    expect(result.ok, "quick turn result").toBe(true);
    
    if (result.ok) {
      const quickTurnedPair = result.value;
      
      // Check rotation state changed from UP to DOWN
      expect(quickTurnedPair.rotation, "rotation after quick turn").toBe(RotationState.DOWN);
      
      // Check that the positions are swapped (main puyo is now where second puyo was)
      expect(quickTurnedPair.position.x, "new main x position").toBe(originalSecondPos.x);
      expect(quickTurnedPair.position.y, "new main y position").toBe(originalSecondPos.y);
      
      // Get the new second position
      const newSecondPos = getSecondPosition(quickTurnedPair);
      
      // Check that the new second position is where the main puyo was
      expect(newSecondPos.x, "new second x position").toBe(originalMainPos.x);
      expect(newSecondPos.y, "new second y position").toBe(originalMainPos.y);
    }
  });
  
  it("executeQuickTurn works from UP to DOWN when one side is blocked by a Puyo and the other by a wall", () => {
    // Create a board with a Puyo on one side and position the pair against a wall
    let board = createBoard();
    const x = 0; // Position against the left wall
    const y = 3;
    
    // Place blocking Puyo on the right side
    const result = setPuyoAt(board, x + 1, y, createPuyo(PuyoColor.RED));
    if (result.ok) {
      board = result.value;
    }
    
    // Create a pair with UP rotation
    const pair = createPuyoPair(
      createPuyo(PuyoColor.GREEN),
      createPuyo(PuyoColor.YELLOW),
      x, y, RotationState.UP
    );
    
    // Get original positions for comparison
    const originalMainPos = getMainPosition(pair);
    const originalSecondPos = getSecondPosition(pair);
    
    // Execute quick turn
    const quickTurnResult = executeQuickTurn(pair, board);
    expect(quickTurnResult.ok, "quick turn result").toBe(true);
    
    if (quickTurnResult.ok) {
      const quickTurnedPair = quickTurnResult.value;
      
      // Check rotation state changed from UP to DOWN
      expect(quickTurnedPair.rotation, "rotation after quick turn").toBe(RotationState.DOWN);
      
      // Check that the positions are swapped (main puyo is now where second puyo was)
      expect(quickTurnedPair.position.x, "new main x position").toBe(originalSecondPos.x);
      expect(quickTurnedPair.position.y, "new main y position").toBe(originalSecondPos.y);
      
      // Get the new second position
      const newSecondPos = getSecondPosition(quickTurnedPair);
      
      // Check that the new second position is where the main puyo was
      expect(newSecondPos.x, "new second x position").toBe(originalMainPos.x);
      expect(newSecondPos.y, "new second y position").toBe(originalMainPos.y);
    }
    
    // Test with the right wall
    let rightBoard = createBoard();
    const rightX = 5; // Position against the right wall of a standard board
    
    // Place blocking Puyo on the left side
    const rightResult = setPuyoAt(rightBoard, rightX - 1, y, createPuyo(PuyoColor.BLUE));
    if (rightResult.ok) {
      rightBoard = rightResult.value;
    }
    
    // Create a pair with UP rotation at the right edge
    const rightPair = createPuyoPair(
      createPuyo(PuyoColor.GREEN),
      createPuyo(PuyoColor.YELLOW),
      rightX, y, RotationState.UP
    );
    
    // Get original positions for comparison
    const rightOriginalMainPos = getMainPosition(rightPair);
    const rightOriginalSecondPos = getSecondPosition(rightPair);
    
    // Execute quick turn
    const rightQuickTurnResult = executeQuickTurn(rightPair, rightBoard);
    expect(rightQuickTurnResult.ok, "right wall quick turn result").toBe(true);
    
    if (rightQuickTurnResult.ok) {
      const rightQuickTurnedPair = rightQuickTurnResult.value;
      
      // Check rotation state changed from UP to DOWN
      expect(rightQuickTurnedPair.rotation, "rotation after right quick turn").toBe(RotationState.DOWN);
      
      // Position checks
      expect(rightQuickTurnedPair.position.x, "new main x position at right").toBe(rightOriginalSecondPos.x);
      expect(rightQuickTurnedPair.position.y, "new main y position at right").toBe(rightOriginalSecondPos.y);
    }
  });

  it("executeQuickTurn works from DOWN to UP when both sides are blocked by Puyos", () => {
    // Create a board with Puyos on both sides of the pair
    let board = createBoard();
    const x = 2;
    const y = 3;
    
    // Place blocking Puyos on both sides of the pair
    const leftResult = setPuyoAt(board, x - 1, y, createPuyo(PuyoColor.RED)); // Left blocker
    if (leftResult.ok) {
      board = leftResult.value;
    }
    
    const rightResult = setPuyoAt(board, x + 1, y, createPuyo(PuyoColor.BLUE)); // Right blocker
    if (rightResult.ok) {
      board = rightResult.value;
    }
    
    // Create a pair with DOWN rotation
    const pair = createPuyoPair(
      createPuyo(PuyoColor.GREEN),
      createPuyo(PuyoColor.YELLOW),
      x, y, RotationState.DOWN
    );
    
    // Get original positions for comparison
    const originalMainPos = getMainPosition(pair);
    const originalSecondPos = getSecondPosition(pair);
    
    // Execute quick turn
    const result = executeQuickTurn(pair, board);
    expect(result.ok, "quick turn result").toBe(true);
    
    if (result.ok) {
      const quickTurnedPair = result.value;
      
      // Check rotation state changed from DOWN to UP
      expect(quickTurnedPair.rotation, "rotation after quick turn").toBe(RotationState.UP);
      
      // Check that the positions are swapped (main puyo is now where second puyo was)
      expect(quickTurnedPair.position.x, "new main x position").toBe(originalSecondPos.x);
      expect(quickTurnedPair.position.y, "new main y position").toBe(originalSecondPos.y);
      
      // Get the new second position
      const newSecondPos = getSecondPosition(quickTurnedPair);
      
      // Check that the new second position is where the main puyo was
      expect(newSecondPos.x, "new second x position").toBe(originalMainPos.x);
      expect(newSecondPos.y, "new second y position").toBe(originalMainPos.y);
    }
  });
  
  it("executeQuickTurn works from DOWN to UP when one side is blocked by a Puyo and the other by a wall", () => {
    // Create a board with a Puyo on one side and position the pair against a wall
    let board = createBoard();
    const x = 0; // Position against the left wall
    const y = 3;
    
    // Place blocking Puyo on the right side
    const result = setPuyoAt(board, x + 1, y, createPuyo(PuyoColor.RED));
    if (result.ok) {
      board = result.value;
    }
    
    // Create a pair with DOWN rotation
    const pair = createPuyoPair(
      createPuyo(PuyoColor.GREEN),
      createPuyo(PuyoColor.YELLOW),
      x, y, RotationState.DOWN
    );
    
    // Get original positions for comparison
    const originalMainPos = getMainPosition(pair);
    const originalSecondPos = getSecondPosition(pair);
    
    // Execute quick turn
    const quickTurnResult = executeQuickTurn(pair, board);
    expect(quickTurnResult.ok, "quick turn result").toBe(true);
    
    if (quickTurnResult.ok) {
      const quickTurnedPair = quickTurnResult.value;
      
      // Check rotation state changed from DOWN to UP
      expect(quickTurnedPair.rotation, "rotation after quick turn").toBe(RotationState.UP);
      
      // Check that the positions are swapped (main puyo is now where second puyo was)
      expect(quickTurnedPair.position.x, "new main x position").toBe(originalSecondPos.x);
      expect(quickTurnedPair.position.y, "new main y position").toBe(originalSecondPos.y);
      
      // Get the new second position
      const newSecondPos = getSecondPosition(quickTurnedPair);
      
      // Check that the new second position is where the main puyo was
      expect(newSecondPos.x, "new second x position").toBe(originalMainPos.x);
      expect(newSecondPos.y, "new second y position").toBe(originalMainPos.y);
    }
  });
  
  it("executeQuickTurn fails when not in UP or DOWN rotation or sides are not blocked", () => {
    const board = createBoard();
    const x = 2;
    const y = 3;
    
    // Create a pair with RIGHT rotation (not UP or DOWN)
    const rightPair = createPuyoPair(
      createPuyo(PuyoColor.GREEN),
      createPuyo(PuyoColor.YELLOW),
      x, y, RotationState.RIGHT
    );
    
    // Quick turn should fail
    const rightResult = executeQuickTurn(rightPair, board);
    expect(rightResult.ok, "right rotation quick turn result").toBe(false);
    
    // Create a pair with LEFT rotation (not UP or DOWN)
    const leftPair = createPuyoPair(
      createPuyo(PuyoColor.GREEN),
      createPuyo(PuyoColor.YELLOW),
      x, y, RotationState.LEFT
    );
    
    // Quick turn should fail
    const leftResult = executeQuickTurn(leftPair, board);
    expect(leftResult.ok, "left rotation quick turn result").toBe(false);
    
    // Create a pair with UP rotation but no blockers
    const unblockPair = createPuyoPair(
      createPuyo(PuyoColor.GREEN),
      createPuyo(PuyoColor.YELLOW),
      x, y, RotationState.UP
    );
    
    // Quick turn should fail - no blockers
    const unblockResult = executeQuickTurn(unblockPair, board);
    expect(unblockResult.ok, "unblocked quick turn result").toBe(false);
  });
});