import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { 
  createGame,
  startGame,
  moveLeftInGame,
  moveRightInGame,
  moveDownInGame,
  rotateClockwiseInGame,
  rotateCounterClockwiseInGame,
  hardDrop,
  updateGame,
  GameState
} from "../../src/domain/game.ts";
import { PuyoColor, createPuyo } from "../../src/domain/puyo.ts";
import { createPuyoPair, RotationState } from "../../src/domain/puyoPair.ts";
import { createBoard, setPuyoAt, BOARD_HEIGHT, HIDDEN_ROWS } from "../../src/domain/board.ts";

describe("Game", () => {
  it("createGame creates a game in IDLE state", () => {
    const game = createGame();
    
    expect(game.state, "initial state").toBe(GameState.IDLE);
    expect(game.score, "initial score").toBe(0);
    expect(game.chainCount, "initial chain count").toBe(0);
    expect(game.currentPair, "initial current pair").toBe(null);
    expect(game.nextPair, "initial next pair").not.toBe(null);
  });
  
  it("startGame initializes a new game in PLAYING state", () => {
    const game = createGame();
    const newGame = startGame(game);
    
    expect(newGame.state, "game state after start").toBe(GameState.PLAYING);
    expect(newGame.score, "score after start").toBe(0);
    expect(newGame.chainCount, "chain count after start").toBe(0);
    expect(newGame.currentPair, "current pair after start").not.toBe(null);
    expect(newGame.nextPair, "next pair after start").not.toBe(null);
  });
  
  it("moveLeftInGame moves the current pair left", () => {
    // Create a game with a specific pair
    let game = createGame();
    game = startGame(game);
    
    // Force a specific current pair
    const mainPuyo = createPuyo(PuyoColor.RED);
    const secondPuyo = createPuyo(PuyoColor.BLUE);
    const pair = createPuyoPair(mainPuyo, secondPuyo, 3, 0, RotationState.DOWN);
    
    game = Object.freeze({
      ...game,
      currentPair: pair
    });
    
    // Move left
    const result = moveLeftInGame(game);
    expect(result.ok, "move left result").toBe(true);
    
    if (result.ok) {
      const movedGame = result.value;
      expect(movedGame.currentPair?.position.x, "x position after move").toBe(2);
      
      // Original game should be unchanged
      expect(game.currentPair?.position.x, "original x position").toBe(3);
    }
  });
  
  it("moveDownInGame places the pair on the board when it hits the bottom", () => {
    // Create a game with a pair at the bottom of the board
    let game = createGame();
    game = startGame(game);
    
    const mainPuyo = createPuyo(PuyoColor.RED);
    const secondPuyo = createPuyo(PuyoColor.GREEN);
    
    // Position the pair at the bottom of the board
    // The board's height is BOARD_HEIGHT + HIDDEN_ROWS, so the bottom row is at index BOARD_HEIGHT + HIDDEN_ROWS - 1
    const bottomRowIndex = BOARD_HEIGHT + HIDDEN_ROWS - 1;
    
    // Create a pair with the main puyo at the second to last row and second puyo below it (at the bottom)
    const pair = createPuyoPair(mainPuyo, secondPuyo, 3, bottomRowIndex - 1, RotationState.DOWN);
    
    game = Object.freeze({
      ...game,
      currentPair: pair
    });
    
    // Move down - this should trigger placement since the second puyo can't move beyond the bottom
    const result = moveDownInGame(game);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const finalGame = result.value;
    
    // The pair should be placed on the board
    expect(finalGame.currentPair, "current pair after placement").toBe(null);
    expect(finalGame.state, "state after placement").toBe(GameState.DROPPING);
    
    // The board should have the Puyos at their final positions
    // Main puyo should be at the second to last row
    const mainPuyoOnBoard = finalGame.board.grid[bottomRowIndex - 1][3];
    expect(mainPuyoOnBoard.color, "main puyo on board").toBe(PuyoColor.RED);
    
    // Second puyo should be at the bottom row
    const secondPuyoOnBoard = finalGame.board.grid[bottomRowIndex][3];
    expect(secondPuyoOnBoard.color, "second puyo on board").toBe(PuyoColor.GREEN);
  });
  
  it("updateGame applies gravity and checks for chains", () => {
    // Create a game with Puyos that need to fall
    let game = createGame();
    game = startGame(game);
    
    // Set up a board with floating Puyos
    let board = game.board;
    const redPuyo = createPuyo(PuyoColor.RED);
    
    // Place a Puyo in the air
    const result = setPuyoAt(board, 2, 5, redPuyo);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    board = result.value;
    
    game = Object.freeze({
      ...game,
      board,
      state: GameState.DROPPING,
      currentPair: null
    });
    
    // Update the game to apply gravity
    let updatedGame = updateGame(game);
    
    // The Puyo should have moved down
    expect(updatedGame.board.grid[5][2].color, "puyo at original position").not.toBe(PuyoColor.RED);
    expect(updatedGame.board.grid[6][2].color, "puyo at new position").toBe(PuyoColor.RED);
    
    // Keep updating until all Puyos have settled
    while (updatedGame.state === GameState.DROPPING) {
      updatedGame = updateGame(updatedGame);
    }
    
    // After settling, the state should change to CHECKING_CHAINS
    expect(updatedGame.state, "state after settling").toBe(GameState.CHECKING_CHAINS);
    
    // Update again to check for chains
    updatedGame = updateGame(updatedGame);
    
    // Since there are no chains, it should spawn a new pair and go back to PLAYING
    expect(updatedGame.state, "state after checking chains").toBe(GameState.PLAYING);
    expect(updatedGame.currentPair, "current pair after checking chains").not.toBe(null);
  });
});