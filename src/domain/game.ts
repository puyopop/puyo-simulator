import { Board, BOARD_WIDTH, BOARD_HEIGHT, HIDDEN_ROWS, Position, createBoard, isEmptyAt, getPuyoAt, setPuyoAt, applyGravity, isOutOfBounds } from "./board.ts";
import { Puyo, PuyoColor, createEmptyPuyo, isEmpty } from "./puyo.ts";
import { PuyoPair, createRandomPuyoPair, getMainPosition, getSecondPosition, moveLeft, moveRight, moveDown, rotateClockwise, rotateCounterClockwise, placeOnBoard } from "./puyoPair.ts";
import { Result, ok, err, createPosition } from "./types.ts";

/**
 * Represents the state of the game
 */
export enum GameState {
  IDLE = "IDLE",
  PLAYING = "PLAYING",
  DROPPING = "DROPPING",
  CHECKING_CHAINS = "CHECKING_CHAINS",
  GAME_OVER = "GAME_OVER"
}

/**
 * Represents the Puyo Puyo game
 */
export type Game = Readonly<{
  board: Board;
  currentPair: PuyoPair | null;
  nextPair: PuyoPair;
  state: GameState;
  score: number;
  chainCount: number;
}>;

/**
 * Error types for Game operations
 */
export type GameError = {
  type: "InvalidState" | "GameOver";
  message: string;
};

/**
 * Creates a new game
 */
export function createGame(): Game {
  return Object.freeze({
    board: createBoard(),
    currentPair: null,
    nextPair: createRandomPuyoPair(),
    state: GameState.IDLE,
    score: 0,
    chainCount: 0
  });
}

/**
 * Starts a new game
 */
export function startGame(game: Game): Game {
  const newGame = spawnNextPair(Object.freeze({
    ...game,
    board: createBoard(),
    state: GameState.PLAYING,
    score: 0,
    chainCount: 0
  }));
  
  return newGame;
}

/**
 * Spawns the next Puyo pair
 */
function spawnNextPair(game: Game): Game {
  const currentPair = game.nextPair;
  const nextPair = createRandomPuyoPair();
  
  // Check if game over (no space for new pair)
  const mainPos = getMainPosition(currentPair);
  const secondPos = getSecondPosition(currentPair);
  
  if (
    !isEmptyAt(game.board, mainPos.x, mainPos.y) ||
    !isEmptyAt(game.board, secondPos.x, secondPos.y)
  ) {
    return Object.freeze({
      ...game,
      currentPair,
      nextPair,
      state: GameState.GAME_OVER
    });
  }
  
  return Object.freeze({
    ...game,
    currentPair,
    nextPair
  });
}

/**
 * Moves the current pair left
 */
export function moveLeftInGame(game: Game): Result<Game, GameError> {
  if (game.state !== GameState.PLAYING || !game.currentPair) {
    return err({
      type: "InvalidState",
      message: "Cannot move left in current state"
    });
  }
  
  const result = moveLeft(game.currentPair, game.board);
  if (!result.ok) {
    return ok(game); // No change if move is invalid
  }
  
  return ok(Object.freeze({
    ...game,
    currentPair: result.value
  }));
}

/**
 * Moves the current pair right
 */
export function moveRightInGame(game: Game): Result<Game, GameError> {
  if (game.state !== GameState.PLAYING || !game.currentPair) {
    return err({
      type: "InvalidState",
      message: "Cannot move right in current state"
    });
  }
  
  const result = moveRight(game.currentPair, game.board);
  if (!result.ok) {
    return ok(game); // No change if move is invalid
  }
  
  return ok(Object.freeze({
    ...game,
    currentPair: result.value
  }));
}

/**
 * Moves the current pair down
 * In this version, manual downward movement is disabled - only hard drops are allowed
 */
export function moveDownInGame(game: Game): Result<Game, GameError> {
  return err({
    type: "InvalidState",
    message: "Manual downward movement is disabled - use hard drop instead"
  });
}

/**
 * Rotates the current pair clockwise
 */
export function rotateClockwiseInGame(game: Game): Result<Game, GameError> {
  if (game.state !== GameState.PLAYING || !game.currentPair) {
    return err({
      type: "InvalidState",
      message: "Cannot rotate in current state"
    });
  }
  
  const result = rotateClockwise(game.currentPair, game.board);
  if (!result.ok) {
    return ok(game); // No change if rotation is invalid
  }
  
  return ok(Object.freeze({
    ...game,
    currentPair: result.value
  }));
}

/**
 * Rotates the current pair counter-clockwise
 */
export function rotateCounterClockwiseInGame(game: Game): Result<Game, GameError> {
  if (game.state !== GameState.PLAYING || !game.currentPair) {
    return err({
      type: "InvalidState",
      message: "Cannot rotate in current state"
    });
  }
  
  const result = rotateCounterClockwise(game.currentPair, game.board);
  if (!result.ok) {
    return ok(game); // No change if rotation is invalid
  }
  
  return ok(Object.freeze({
    ...game,
    currentPair: result.value
  }));
}

/**
 * Performs a hard drop (instantly drops the current pair)
 */
export function hardDrop(game: Game): Result<Game, GameError> {
  if (game.state !== GameState.PLAYING || !game.currentPair) {
    return err({
      type: "InvalidState",
      message: "Cannot hard drop in current state"
    });
  }
  
  let currentPair = game.currentPair;
  let moved = true;
  
  // Keep moving down until it can't move anymore
  while (moved) {
    const result = moveDown(currentPair, game.board);
    if (result.ok) {
      currentPair = result.value;
    } else {
      moved = false;
    }
  }
  
  // Place the pair on the board
  const placeResult = placeOnBoard(currentPair, game.board);
  if (!placeResult.ok) {
    return err({
      type: "GameOver",
      message: "Cannot place pair on board"
    });
  }
  
  return ok(Object.freeze({
    ...game,
    board: placeResult.value,
    currentPair: null,
    state: GameState.DROPPING
  }));
}

/**
 * Updates the game state
 * Returns the updated game
 */
export function updateGame(game: Game): Game {
  switch (game.state) {
    case GameState.IDLE:
      return game;
      
    case GameState.PLAYING:
      // Auto-drop would be handled by the game loop timer
      return game;
      
    case GameState.DROPPING:
      // Apply gravity to make Puyos fall down
      const { board: boardAfterGravity, moved } = applyGravity(game.board);
      if (moved) {
        return Object.freeze({
          ...game,
          board: boardAfterGravity
        });
      }
      return Object.freeze({
        ...game,
        board: boardAfterGravity,
        state: GameState.CHECKING_CHAINS
      });
      
    case GameState.CHECKING_CHAINS:
      // Check for chains and remove connected Puyos
      const { board: boardAfterChains, chainsFound, score } = checkAndRemoveChains(game.board, game.chainCount);
      
      if (chainsFound) {
        // Continue the chain reaction
        return Object.freeze({
          ...game,
          board: boardAfterChains,
          state: GameState.DROPPING,
          score: game.score + score,
          chainCount: game.chainCount + 1
        });
      } else {
        // No more chains, spawn the next pair
        const gameWithNextPair = spawnNextPair(Object.freeze({
          ...game,
          board: boardAfterChains,
          chainCount: 0
        }));
        
        // After spawning, check if the game is over
        // If not, continue playing
        if (gameWithNextPair.state !== GameState.GAME_OVER) {
          return Object.freeze({
            ...gameWithNextPair,
            state: GameState.PLAYING
          });
        }
        
        return gameWithNextPair;
      }
      
    case GameState.GAME_OVER:
      return game;
  }
}

/**
 * Checks for chains and removes connected Puyos
 * Returns a new board with connected Puyos removed and the score earned
 */
function checkAndRemoveChains(board: Board, chainCount: number): { board: Board; chainsFound: boolean; score: number } {
  // Find all connected groups of 4 or more same-colored Puyos
  const visited: boolean[][] = Array(BOARD_HEIGHT + HIDDEN_ROWS)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(false));
  
  let chainsFound = false;
  let totalScore = 0;
  let currentBoard = board;
  
  for (let y = 0; y < BOARD_HEIGHT + HIDDEN_ROWS; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (visited[y][x] || isEmptyAt(currentBoard, x, y)) {
        continue;
      }
      
      const group: Position[] = [];
      const color = getPuyoAt(currentBoard, x, y).color;
      
      // Use DFS to find all connected Puyos of the same color
      findConnectedPuyos(currentBoard, x, y, color, visited, group);
      
      // If the group has 4 or more Puyos, remove them
      if (group.length >= 4) {
        chainsFound = true;
        
        // Remove the Puyos
        for (const pos of group) {
          const result = setPuyoAt(currentBoard, pos.x, pos.y, createEmptyPuyo());
          if (result.ok) {
            currentBoard = result.value;
          }
        }
        
        // Update score
        const points = calculateScore(group.length, chainCount);
        totalScore += points;
      }
    }
  }
  
  return { board: currentBoard, chainsFound, score: totalScore };
}

/**
 * Finds all connected Puyos of the same color using DFS
 */
function findConnectedPuyos(
  board: Board,
  x: number,
  y: number,
  color: PuyoColor,
  visited: boolean[][],
  group: Position[]
): void {
  if (
    isOutOfBounds(board, x, y) ||
    visited[y][x] ||
    isEmptyAt(board, x, y) ||
    getPuyoAt(board, x, y).color !== color
  ) {
    return;
  }
  
  visited[y][x] = true;
  group.push(createPosition(x, y));
  
  // Check adjacent positions
  findConnectedPuyos(board, x + 1, y, color, visited, group);
  findConnectedPuyos(board, x - 1, y, color, visited, group);
  findConnectedPuyos(board, x, y + 1, color, visited, group);
  findConnectedPuyos(board, x, y - 1, color, visited, group);
}

/**
 * Calculates the score based on the number of Puyos cleared and chain count
 */
function calculateScore(puyosCleared: number, chainCount: number): number {
  // Basic scoring formula:
  // Score = (Puyos cleared) * (10) * (Chain power)
  // Chain power increases with each chain in the sequence
  const chainPower = Math.pow(2, chainCount);
  return puyosCleared * 10 * chainPower;
}