import { Board, BOARD_WIDTH, BOARD_HEIGHT, HIDDEN_ROWS, GHOST_ROW, CRANE_ROW, NORMAL_FIELD_START, Position, createBoard, isEmptyAt, getPuyoAt, setPuyoAt, applyGravity, isOutOfBounds, isGhostRow, isCraneRow } from "./board.ts";
import { Puyo, PuyoColor, PuyoState, createEmptyPuyo, isEmpty, markPuyoForDeletion, isGhostPuyo, isCranePuyo, createPuyo } from "./puyo.ts";
import { PuyoPair, createRandomPuyoPair, getMainPosition, getSecondPosition, moveLeft, moveRight, moveDown, rotateClockwise, rotateCounterClockwise, placeOnBoard, createPuyoPair, executeQuickTurn } from "./puyoPair.ts";
import { Result, ok, err, createPosition } from "./types.ts";
import { PuyoSeq, createPuyoSeq } from "./puyoSeq.ts";
import { calculateScore } from "./score.ts";

/**
 * Represents the state of the game
 */
export enum GameState {
  IDLE = "IDLE",
  PLAYING = "PLAYING",
  DROPPING = "DROPPING",
  CHECKING_CHAINS = "CHECKING_CHAINS",
  FLASHING_PUYOS = "FLASHING_PUYOS", // 消去予定のぷよが点滅している状態
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
  flashingTime: number; // 消去予定のぷよが点滅している時間（ミリ秒）
  puyoSeq: PuyoSeq;    // Sequence of Puyos to use
  moveCount: number;    // Current move count
}>;

// 消去予定のぷよが点滅する時間（ミリ秒）
const FLASHING_DURATION = 500;

/**
 * Error types for Game operations
 */
export type GameError = {
  type: "InvalidState" | "GameOver" | "PuyoSeqNotLoaded";
  message: string;
};

// デフォルトのシーケンスを生成する関数
function createDefaultPuyoSeq(): PuyoSeq {
  const defaultColors = [PuyoColor.RED, PuyoColor.GREEN, PuyoColor.BLUE, PuyoColor.YELLOW, PuyoColor.PURPLE];
  const puyos: Puyo[] = [];
  
  // 256個のランダムなぷよを生成
  for (let i = 0; i < 256; i++) {
    const randomIndex = Math.floor(Math.random() * defaultColors.length);
    puyos.push(createPuyo(defaultColors[randomIndex]));
  }
  
  return Object.freeze({
    seq: puyos
  });
}

/**
 * Creates a new game
 */
export function createGame(seed: number = 0): Result<Game, GameError> {
  const puyoSeqResult = createPuyoSeq(seed);
  
  if (!puyoSeqResult.ok) {
    // シーケンスがロードされていない場合はデフォルトのシーケンスを使用
    console.warn("PuyoSeq not loaded yet, using default sequence");
    const defaultPuyoSeq = createDefaultPuyoSeq();
    const mainPuyo = defaultPuyoSeq.seq[0];
    const secondPuyo = defaultPuyoSeq.seq[1];
    const nextPair = createPuyoPair(mainPuyo, secondPuyo);

    return ok(Object.freeze({
      board: createBoard(),
      currentPair: null,
      nextPair: nextPair,
      state: GameState.IDLE,
      score: 0,
      chainCount: 0,
      flashingTime: 0,
      puyoSeq: defaultPuyoSeq,
      moveCount: 1  // Start at 1 since we've already used the first pair
    }));
  }
  
  const puyoSeq = puyoSeqResult.value;
  const mainPuyo = puyoSeq.seq[0];
  const secondPuyo = puyoSeq.seq[1];
  const nextPair = createPuyoPair(mainPuyo, secondPuyo);

  return ok(Object.freeze({
    board: createBoard(),
    currentPair: null,
    nextPair: nextPair,
    state: GameState.IDLE,
    score: 0,
    chainCount: 0,
    flashingTime: 0,
    puyoSeq: puyoSeq,
    moveCount: 1  // Start at 1 since we've already used the first pair
  }));
}

/**
 * Starts a new game
 */
export function startGame(game: Game, seed?: number): Result<Game, GameError> {
  // seedの指定がないなら、ランダムにseedを生成
  seed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
  const puyoSeqResult = createPuyoSeq(seed);
  
  if (!puyoSeqResult.ok) {
    return err({
      type: "PuyoSeqNotLoaded",
      message: "Cannot start game: PuyoSeq not loaded yet. Please retry later."
    });
  }
  
  const puyoSeq = puyoSeqResult.value;
  const mainPuyo = puyoSeq.seq[0];
  const secondPuyo = puyoSeq.seq[1];
  const nextPair = createPuyoPair(mainPuyo, secondPuyo);

  const newGameBase = Object.freeze({
    ...game,
    board: createBoard(),
    state: GameState.PLAYING,
    score: 0,
    chainCount: 0,
    flashingTime: 0,
    nextPair: nextPair,
    puyoSeq: puyoSeq,
    moveCount: 1  // Start at 1 since we've already used the first pair
  });
  
  const newGame = spawnNextPair(newGameBase);
  return ok(newGame);
}

/**
 * Spawns the next Puyo pair
 */
function spawnNextPair(game: Game): Game {
  const currentPair = game.nextPair;
  
  // Get the next Puyos from the sequence
  const moveCount = game.moveCount;
  const seqLength = game.puyoSeq.seq.length;
  
  // Calculate indices with wrapping (looping back to start)
  const mainPuyoIndex = (moveCount * 2) % seqLength;
  const secondPuyoIndex = (moveCount * 2 + 1) % seqLength;
  
  const mainPuyo = game.puyoSeq.seq[mainPuyoIndex];
  const secondPuyo = game.puyoSeq.seq[secondPuyoIndex];
  
  const nextPair = createPuyoPair(mainPuyo, secondPuyo);
  
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
    nextPair,
    moveCount: moveCount + 1  // Increment move count
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
 * If the pair can't move down further, it will be placed on the board
 */
export function moveDownInGame(game: Game): Result<Game, GameError> {
  if (game.state !== GameState.PLAYING || !game.currentPair) {
    return err({
      type: "InvalidState",
      message: "Cannot move down in current state"
    });
  }
  
  const result = moveDown(game.currentPair, game.board);
  if (result.ok) {
    // The pair can move down
    return ok(Object.freeze({
      ...game,
      currentPair: result.value
    }));
  } else {
    // The pair can't move down further, place it on the board
    const placeResult = placeOnBoard(game.currentPair, game.board);
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
    return err({
      type: "InvalidState",
      message: "Cannot rotate in current state"
    })
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
    return err({
      type: "InvalidState",
      message: "Cannot rotate in current state"
    })
  }
  
  return ok(Object.freeze({
    ...game,
    currentPair: result.value
  }));
}

export function executeQuickTurnInGame(game: Game): Result<Game, GameError> {
  if (game.state !== GameState.PLAYING || !game.currentPair) {
    return err({
      type: "InvalidState",
      message: "Cannot execute quick turn in current state"
    });
  }
  const result = executeQuickTurn(game.currentPair, game.board);
  if (!result.ok) {
    return err({
      type: "InvalidState",
      message: "Cannot execute quick turn in current state"
    })
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
      // Check for chains and mark connected Puyos for deletion
      const { board: boardWithMarkedPuyos, chainsFound, score } = checkAndMarkChainsForDeletion(game.board, game.chainCount);
      
      if (chainsFound) {
        // Puyos found to be deleted, start flashing animation
        return Object.freeze({
          ...game,
          board: boardWithMarkedPuyos,
          state: GameState.FLASHING_PUYOS,
          score: game.score + score,
          chainCount: game.chainCount + 1,
          flashingTime: 0 // Reset flashing timer
        });
      } else {
        // No more chains, spawn the next pair
        const gameWithNextPair = spawnNextPair(Object.freeze({
          ...game,
          board: boardWithMarkedPuyos,
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
      
    case GameState.FLASHING_PUYOS:
      // Update flashing time
      const newFlashingTime = game.flashingTime + 16; // Assuming 60fps, each frame is about 16ms
      
      if (newFlashingTime >= FLASHING_DURATION) {
        // Flashing animation completed, remove the marked Puyos
        const boardAfterRemoval = removeMarkedPuyos(game.board);
        
        return Object.freeze({
          ...game,
          board: boardAfterRemoval,
          state: GameState.DROPPING,
          flashingTime: 0
        });
      } else {
        // Continue flashing
        return Object.freeze({
          ...game,
          flashingTime: newFlashingTime
        });
      }
      
    case GameState.GAME_OVER:
      return game;
  }
}

/**
 * Checks for chains and marks connected Puyos for deletion
 * Returns a new board with connected Puyos marked and the score earned
 */
export function checkAndMarkChainsForDeletion(board: Board, chainCount: number): { board: Board; chainsFound: boolean; score: number } {
  // Find all connected groups of 4 or more same-colored Puyos
  const visited: boolean[][] = Array(board.grid.length)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(false));
  
  let chainsFound = false;
  let totalScore = 0;
  let currentBoard = board;
  
  // For collecting information needed for score calculation
  let groupConnections: number[] = []; // groupごとの連結数を保存
  let totalPuyoCount = 0; // 消去される総ぷよ数
  let uniqueColors = new Set<PuyoColor>(); // 消去される色の種類
  
  // Start from the normal field (skip offscreen and ghost rows)
  for (let y = NORMAL_FIELD_START; y < board.grid.length; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (visited[y][x] || isEmptyAt(currentBoard, x, y)) {
        continue;
      }
      
      const group: Position[] = [];
      const puyo = getPuyoAt(currentBoard, x, y);
      const color = puyo.color;
      
      // Use DFS to find all connected Puyos of the same color
      findConnectedPuyos(currentBoard, x, y, color, visited, group);
      
      // If the group has 4 or more Puyos, mark them for deletion
      if (group.length >= 4) {
        chainsFound = true;
        
        // Mark the Puyos for deletion
        for (const pos of group) {
          const puyo = getPuyoAt(currentBoard, pos.x, pos.y);
          const result = setPuyoAt(currentBoard, pos.x, pos.y, markPuyoForDeletion(puyo));
          if (result.ok) {
            currentBoard = result.value;
          }
        }
        
        // Collect score information
        groupConnections.push(group.length);
        totalPuyoCount += group.length;
        uniqueColors.add(color);
      }
    }
  }
  
  // Calculate score if any chains were found
  if (chainsFound) {
    totalScore = calculateScore(chainCount + 1, totalPuyoCount, groupConnections, uniqueColors.size);
  }
  
  return { board: currentBoard, chainsFound, score: totalScore };
}

/**
 * Removes all Puyos marked for deletion
 * Returns a new board with marked Puyos removed
 */
function removeMarkedPuyos(board: Board): Board {
  let currentBoard = board;
  
  // Process only the standard field and ghost row (don't touch crane row)
  // Start from NORMAL_FIELD_START to include all normal field rows
  for (let y = NORMAL_FIELD_START; y < board.grid.length; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const puyo = getPuyoAt(currentBoard, x, y);
      
      if (!isEmpty(puyo) && puyo.state === PuyoState.MARKED_FOR_DELETION) {
        const result = setPuyoAt(currentBoard, x, y, createEmptyPuyo());
        if (result.ok) {
          currentBoard = result.value;
        }
      }
    }
  }
  
  return currentBoard;
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
    getPuyoAt(board, x, y).color !== color ||
    isGhostRow(y) ||  // Skip ghost puyos (now at y=1)
    isCraneRow(y) // Skip crane puyos (now at y=0)
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