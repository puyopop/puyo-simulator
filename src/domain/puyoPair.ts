import { Puyo, PuyoColor, createPuyo, createRandomPuyo } from "./puyo.ts";
import { Board, BOARD_WIDTH, BOARD_HEIGHT, HIDDEN_ROWS, NORMAL_FIELD_START, Position, isEmptyAt, isOutOfBounds, setPuyoAt } from "./board.ts";
import { Result, ok, err, createPosition } from "./types.ts";

/**
 * Represents the rotation states of a Puyo pair
 */
export enum RotationState {
  UP = 0,    // Second Puyo is above the first
  RIGHT = 1, // Second Puyo is to the right of the first
  DOWN = 2,  // Second Puyo is below the first
  LEFT = 3   // Second Puyo is to the left of the first
}

/**
 * Represents a pair of Puyos that the player controls
 */
export type PuyoPair = Readonly<{
  mainPuyo: Puyo;
  secondPuyo: Puyo;
  position: Position;
  rotation: RotationState;
}>;

/**
 * Error types for PuyoPair operations
 */
export type PuyoPairError = {
  type: "InvalidMove" | "InvalidRotation";
  message: string;
};

/**
 * Creates a new PuyoPair
 */
export function createPuyoPair(
  mainPuyo: Puyo,
  secondPuyo: Puyo,
  x = Math.floor(BOARD_WIDTH / 2) - 1,
  y = NORMAL_FIELD_START,
  rotation = RotationState.UP
): PuyoPair {
  return Object.freeze({
    mainPuyo,
    secondPuyo,
    position: createPosition(x, y),
    rotation
  });
}

/**
 * Creates a random PuyoPair
 */
export function createRandomPuyoPair(): PuyoPair {
  return createPuyoPair(
    createRandomPuyo(),
    createRandomPuyo()
  );
}

/**
 * Gets the position of the main Puyo
 */
export function getMainPosition(pair: PuyoPair): Position {
  return pair.position;
}

/**
 * Gets the position of the second Puyo based on rotation
 */
export function getSecondPosition(pair: PuyoPair): Position {
  const { x, y } = pair.position;
  
  switch (pair.rotation) {
    case RotationState.UP:
      return createPosition(x, y - 1);
    case RotationState.RIGHT:
      return createPosition(x + 1, y);
    case RotationState.DOWN:
      return createPosition(x, y + 1);
    case RotationState.LEFT:
      return createPosition(x - 1, y);
  }
}

/**
 * Moves the pair left if possible
 */
export function moveLeft(pair: PuyoPair, board: Board): Result<PuyoPair, PuyoPairError> {
  const newX = pair.position.x - 1;
  const mainY = pair.position.y;
  const secondPos = getSecondPosition(pair);
  const newSecondX = secondPos.x - 1;
  
  // Check if the move is valid
  if (
    newX < 0 || 
    newSecondX < 0 ||
    !isEmptyAt(board, newX, mainY) ||
    !isEmptyAt(board, newSecondX, secondPos.y)
  ) {
    return err({
      type: "InvalidMove",
      message: "Cannot move left"
    });
  }
  
  return ok(Object.freeze({
    ...pair,
    position: createPosition(newX, pair.position.y)
  }));
}

/**
 * Moves the pair right if possible
 */
export function moveRight(pair: PuyoPair, board: Board): Result<PuyoPair, PuyoPairError> {
  const newX = pair.position.x + 1;
  const mainY = pair.position.y;
  const secondPos = getSecondPosition(pair);
  const newSecondX = secondPos.x + 1;
  
  // Check if the move is valid
  if (
    newX >= BOARD_WIDTH || 
    newSecondX >= BOARD_WIDTH ||
    !isEmptyAt(board, newX, mainY) ||
    !isEmptyAt(board, newSecondX, secondPos.y)
  ) {
    return err({
      type: "InvalidMove",
      message: "Cannot move right"
    });
  }
  
  return ok(Object.freeze({
    ...pair,
    position: createPosition(newX, pair.position.y)
  }));
}

/**
 * Moves the pair down if possible
 */
export function moveDown(pair: PuyoPair, board: Board): Result<PuyoPair, PuyoPairError> {
  const newY = pair.position.y + 1;
  const mainX = pair.position.x;
  const secondPos = getSecondPosition(pair);
  const newSecondY = secondPos.y + 1;
  
  // Check if the move would go beyond the bottom of the board
  if (
    newY >= BOARD_HEIGHT + HIDDEN_ROWS || 
    newSecondY >= BOARD_HEIGHT + HIDDEN_ROWS ||
    !isEmptyAt(board, mainX, newY) ||
    !isEmptyAt(board, secondPos.x, newSecondY)
  ) {
    return err({
      type: "InvalidMove",
      message: "Cannot move down"
    });
  }
  
  return ok(Object.freeze({
    ...pair,
    position: createPosition(pair.position.x, newY)
  }));
}

/**
 * Calculates the new position for a rotation
 */
function calculateRotationPosition(pair: PuyoPair, newRotation: RotationState): Position {
  const { x, y } = pair.position;
  
  switch (newRotation) {
    case RotationState.UP:
      return createPosition(x, y - 1);
    case RotationState.RIGHT:
      return createPosition(x + 1, y);
    case RotationState.DOWN:
      return createPosition(x, y + 1);
    case RotationState.LEFT:
      return createPosition(x - 1, y);
  }
}

/**
 * Rotates the pair clockwise if possible
 */
export function rotateClockwise(pair: PuyoPair, board: Board): Result<PuyoPair, PuyoPairError> {
  const newRotation = (pair.rotation + 1) % 4 as RotationState;
  const newSecondPos = calculateRotationPosition(pair, newRotation);
  console.log(`Current rotation: ${pair.rotation}, New rotation: ${newRotation}`);
  console.log(`Current position: (${pair.position.x}, ${pair.position.y}), New position: (${newSecondPos.x}, ${newSecondPos.y})`);
  // Check if the rotation is valid
  if (
    isOutOfBounds(board, newSecondPos.x, newSecondPos.y) ||
    !isEmptyAt(board, newSecondPos.x, newSecondPos.y)
  ) {
    // Try wall kick if hitting a wall
    if (newSecondPos.x < 0) {
      // Hitting left wall, try moving right
      const movedPair = createPuyoPair(
        pair.mainPuyo,
        pair.secondPuyo,
        pair.position.x + 1,
        pair.position.y,
        pair.rotation
      );
      return rotateClockwise(movedPair, board);
    } else if (newSecondPos.x >= BOARD_WIDTH) {
      // Hitting right wall, try moving left
      const movedPair = createPuyoPair(
        pair.mainPuyo,
        pair.secondPuyo,
        pair.position.x - 1,
        pair.position.y,
        pair.rotation
      );
      return rotateClockwise(movedPair, board);
    }
    
    return err({
      type: "InvalidRotation",
      message: "Cannot rotate clockwise"
    });
  }
  
  return ok(Object.freeze({
    ...pair,
    rotation: newRotation
  }));
}

/**
 * Rotates the pair counter-clockwise if possible
 */
export function rotateCounterClockwise(pair: PuyoPair, board: Board): Result<PuyoPair, PuyoPairError> {
  const newRotation = (pair.rotation + 3) % 4 as RotationState; // +3 is equivalent to -1 in modulo 4
  const newSecondPos = calculateRotationPosition(pair, newRotation);
  console.log(`Current rotation: ${pair.rotation}, New rotation: ${newRotation}`);
  console.log(`Current position: (${pair.position.x}, ${pair.position.y}), New position: (${newSecondPos.x}, ${newSecondPos.y})`);

  // Check if the rotation is valid
  if (
    isOutOfBounds(board, newSecondPos.x, newSecondPos.y) ||
    !isEmptyAt(board, newSecondPos.x, newSecondPos.y)
  ) {
    // Try wall kick if hitting a wall
    if (newSecondPos.x < 0) {
      // Hitting left wall, try moving right
      const movedPair = createPuyoPair(
        pair.mainPuyo,
        pair.secondPuyo,
        pair.position.x + 1,
        pair.position.y,
        pair.rotation
      );
      return rotateCounterClockwise(movedPair, board);
    } else if (newSecondPos.x >= BOARD_WIDTH) {
      // Hitting right wall, try moving left
      const movedPair = createPuyoPair(
        pair.mainPuyo,
        pair.secondPuyo,
        pair.position.x - 1,
        pair.position.y,
        pair.rotation
      );
      return rotateCounterClockwise(movedPair, board);
    }
    
    return err({
      type: "InvalidRotation",
      message: "Cannot rotate counter-clockwise"
    });
  }
  
  return ok(Object.freeze({
    ...pair,
    rotation: newRotation
  }));
}

/**
 * Places the Puyo pair on the board
 */
export function placeOnBoard(pair: PuyoPair, board: Board): Result<Board, PuyoPairError> {
  const mainPos = getMainPosition(pair);
  const secondPos = getSecondPosition(pair);
  
  const result1 = setPuyoAt(board, mainPos.x, mainPos.y, pair.mainPuyo);
  if (!result1.ok) {
    return err({
      type: "InvalidMove",
      message: "Cannot place main puyo on board"
    });
  }
  
  const result2 = setPuyoAt(result1.value, secondPos.x, secondPos.y, pair.secondPuyo);
  if (!result2.ok) {
    return err({
      type: "InvalidMove",
      message: "Cannot place second puyo on board"
    });
  }
  
  return ok(result2.value);
}