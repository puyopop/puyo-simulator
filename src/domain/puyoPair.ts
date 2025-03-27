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
 * Attempts to perform a wall kick for rotation
 * Returns a new pair position if successful, null if not possible
 *
 * Wall kick behavior:
 * 1. When rotating to DOWN state, only try moving upward
 * 2. When rotating to LEFT/RIGHT state, only try moving in the opposite horizontal direction
 */
function tryWallKick(
  pair: PuyoPair,
  board: Board,
  newRotation: RotationState
): Position | null {
  const { x, y } = pair.position;
  
  // Define possible wall kick positions based on the target rotation state
  let kickPositions: [number, number][] = [];
  
  switch (newRotation) {
    case RotationState.DOWN:
      // For DOWN rotation, only try moving up
      kickPositions = [[x, y - 1]];
      break;
    case RotationState.RIGHT:
      // For RIGHT rotation, only try moving left
      kickPositions = [[x - 1, y]];
      break;
    case RotationState.LEFT:
      // For LEFT rotation, only try moving right
      kickPositions = [[x + 1, y]];
      break;
    case RotationState.UP:
      // For UP rotation, try all directions (original behavior)
      kickPositions = [
        [x - 1, y], // Try shifting left
        [x + 1, y], // Try shifting right
        [x, y - 1], // Try shifting up
        [x, y + 1]  // Try shifting down
      ];
      break;
  }
  
  // Try each kick position
  for (const [kickX, kickY] of kickPositions) {
    // Skip invalid positions
    if (kickX < 0 || kickX >= BOARD_WIDTH || kickY < 0 || kickY >= BOARD_HEIGHT + HIDDEN_ROWS) {
      continue;
    }
    
    // Create a test pair at the new position
    const testPair = createPuyoPair(
      pair.mainPuyo,
      pair.secondPuyo,
      kickX,
      kickY,
      pair.rotation
    );
    
    // Calculate where the second Puyo would be after rotation
    const testSecondPos = calculateRotationPosition(testPair, newRotation);
    
    // Check if this position is valid
    if (
      !isOutOfBounds(board, testSecondPos.x, testSecondPos.y) &&
      isEmptyAt(board, kickX, kickY) &&
      isEmptyAt(board, testSecondPos.x, testSecondPos.y)
    ) {
      // Found a valid wall kick position
      return createPosition(kickX, kickY);
    }
  }
  
  // No valid wall kick position found
  return null;
}

/**
 * Rotates the pair clockwise if possible
 */
export function rotateClockwise(pair: PuyoPair, board: Board): Result<PuyoPair, PuyoPairError> {
  const newRotation = (pair.rotation + 1) % 4 as RotationState;
  const newSecondPos = calculateRotationPosition(pair, newRotation);
  
  // Check if the rotation is valid without wall kick
  if (
    !isOutOfBounds(board, newSecondPos.x, newSecondPos.y) &&
    isEmptyAt(board, newSecondPos.x, newSecondPos.y)
  ) {
    // Normal rotation is possible
    return ok(Object.freeze({
      ...pair,
      rotation: newRotation
    }));
  }
  
  // Try wall kick
  const wallKickPos = tryWallKick(pair, board, newRotation);
  
  if (wallKickPos) {
    // Wall kick successful
    return ok(Object.freeze({
      ...pair,
      position: wallKickPos,
      rotation: newRotation
    }));
  }
  
  // Wall kick failed
  return err({
    type: "InvalidRotation",
    message: "Cannot rotate clockwise"
  });
}

/**
 * Rotates the pair counter-clockwise if possible
 */
export function rotateCounterClockwise(pair: PuyoPair, board: Board): Result<PuyoPair, PuyoPairError> {
  const newRotation = (pair.rotation + 3) % 4 as RotationState; // +3 is equivalent to -1 in modulo 4
  const newSecondPos = calculateRotationPosition(pair, newRotation);

  // Check if the rotation is valid without wall kick
  if (
    !isOutOfBounds(board, newSecondPos.x, newSecondPos.y) &&
    isEmptyAt(board, newSecondPos.x, newSecondPos.y)
  ) {
    // Normal rotation is possible
    return ok(Object.freeze({
      ...pair,
      rotation: newRotation
    }));
  }
  
  // Try wall kick
  const wallKickPos = tryWallKick(pair, board, newRotation);
  
  if (wallKickPos) {
    // Wall kick successful
    return ok(Object.freeze({
      ...pair,
      position: wallKickPos,
      rotation: newRotation
    }));
  }
  
  // Wall kick failed
  return err({
    type: "InvalidRotation",
    message: "Cannot rotate counter-clockwise"
  });
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

function placeOnBoardAndFallDownPuyo(puyo: Puyo, x: number, y: number, board: Board): Result<Board, PuyoPairError> {
  let newY = y;
  while (isEmptyAt(board, x, newY + 1) && !isOutOfBounds(board, x, newY + 1)) {
    newY++;
  }
  const result = setPuyoAt(board, x, newY, puyo);
  if (!result.ok) {
    return err({
      type: "InvalidMove",
      message: "Cannot place puyo on board"
    });
  }
  return ok(result.value);
}

/**
 * Places the Puyo pair on the board and falls down
 */
export function placeOnBoardAndFallDown(pair: PuyoPair, board: Board): Result<Board, PuyoPairError> {
  let formerPos = getMainPosition(pair);
  let formerPuyo = pair.mainPuyo;
  let latterPos = getSecondPosition(pair);
  let latterPuyo = pair.secondPuyo;

  if (formerPos.y < latterPos.y) {
    // Swap the Puyos if the second Puyo is above the first
    [formerPos, latterPos] = [latterPos, formerPos];
    [formerPuyo, latterPuyo] = [latterPuyo, formerPuyo];
  }

  const result1 = placeOnBoardAndFallDownPuyo(formerPuyo, formerPos.x, formerPos.y, board);
  if (!result1.ok) {
    return result1;
  }
  const result2 = placeOnBoardAndFallDownPuyo(latterPuyo, latterPos.x, latterPos.y, result1.value);
  if (!result2.ok) {
    return result2;
  }
  return ok(result2.value);
}

function canExecuteQuickTurn(pair: PuyoPair, board: Board): boolean {
  // Quick Turn is only valid for UP or DOWN rotations
  if (pair.rotation !== RotationState.UP && pair.rotation !== RotationState.DOWN) {
    return false;
  }
  
  const leftX = pair.position.x - 1;
  const rightX = pair.position.x + 1;
  const mainY = pair.position.y;
  
  // Check if the left side is blocked (by a wall or a Puyo)
  const isLeftBlocked = leftX < 0 || !isEmptyAt(board, leftX, mainY);
  
  // Check if the right side is blocked (by a wall or a Puyo)
  const isRightBlocked = rightX >= BOARD_WIDTH || !isEmptyAt(board, rightX, mainY);

  // Debug output
  console.log({
    position: pair.position,
    rotation: RotationState[pair.rotation],
    leftX,
    rightX,
    mainY,
    isLeftBlocked,
    isRightBlocked,
    canQuickTurn: isLeftBlocked && isRightBlocked
  });

  // Quick Turn can be executed when both left and right are blocked
  return isLeftBlocked && isRightBlocked;
}

export function executeQuickTurn(pair: PuyoPair, board:Board): Result<PuyoPair, PuyoPairError> {
  if (canExecuteQuickTurn(pair, board)) {
    const newMainPosition = getSecondPosition(pair);
    const newRotation = pair.rotation === RotationState.UP
      ? RotationState.DOWN
      : RotationState.UP;
    return ok({
      ...pair,
      rotation: newRotation,
      position: newMainPosition
    });
  }
  return err({
    type: "InvalidMove",
    message: "Cannot execute quick turn"
  });
}