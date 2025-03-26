import { assertEquals } from "https://deno.land/std@0.207.0/assert/assert_equals.ts";
import { describe, it } from "https://deno.land/std@0.207.0/testing/bdd.ts";
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
  GameState,
  Game,
  checkAndMarkChainsForDeletion
} from "../../src/domain/game.ts";
import { PuyoColor, createPuyo, PuyoState, createEmptyPuyo } from "../../src/domain/puyo.ts";
import { createPuyoPair, RotationState } from "../../src/domain/puyoPair.ts";
import { 
  createBoard, 
  setPuyoAt, 
  BOARD_HEIGHT, 
  HIDDEN_ROWS, 
  NORMAL_FIELD_START, 
  Board, 
  applyGravity,
  getPuyoAt,
  BOARD_WIDTH
} from "../../src/domain/board.ts";

describe("Game", () => {
  it("createGame creates a game in IDLE state", () => {
    const gameResult = createGame();
    assertEquals(gameResult.ok, true, "createGame result");
    if (!gameResult.ok) return;
    
    const game = gameResult.value;
    assertEquals(game.state, GameState.IDLE, "initial state");
    assertEquals(game.score, 0, "initial score");
    assertEquals(game.chainCount, 0, "initial chain count");
    assertEquals(game.currentPair, null, "initial current pair");
    assertEquals(game.nextPair !== null, true, "initial next pair");
  });
  
  it("startGame initializes a new game in PLAYING state", () => {
    const gameResult = createGame();
    assertEquals(gameResult.ok, true, "createGame result");
    if (!gameResult.ok) return;
    
    const game = gameResult.value;
    const newGameResult = startGame(game);
    assertEquals(newGameResult.ok, true, "startGame result");
    if (!newGameResult.ok) return;
    
    const newGame = newGameResult.value;
    assertEquals(newGame.state, GameState.PLAYING, "game state after start");
    assertEquals(newGame.score, 0, "score after start");
    assertEquals(newGame.chainCount, 0, "chain count after start");
    assertEquals(newGame.currentPair !== null, true, "current pair after start");
    assertEquals(newGame.nextPair !== null, true, "next pair after start");
  });
  
  it("moveLeftInGame moves the current pair left", () => {
    // Create a game with a specific pair
    const gameResult = createGame();
    assertEquals(gameResult.ok, true, "createGame result");
    if (!gameResult.ok) return;
    
    let game = gameResult.value;
    const startGameResult = startGame(game);
    assertEquals(startGameResult.ok, true, "startGame result");
    if (!startGameResult.ok) return;
    
    game = startGameResult.value;
    
    // Force a specific current pair
    const mainPuyo = createPuyo(PuyoColor.RED);
    const secondPuyo = createPuyo(PuyoColor.BLUE);
    const pair = createPuyoPair(mainPuyo, secondPuyo, 3, NORMAL_FIELD_START, RotationState.DOWN);
    
    game = Object.freeze({
      ...game,
      currentPair: pair
    });
    
    // Move left
    const result = moveLeftInGame(game);
    assertEquals(result.ok, true, "move left result");
    
    if (result.ok) {
      const movedGame = result.value;
      assertEquals(movedGame.currentPair?.position.x, 2, "x position after move");
      
      // Original game should be unchanged
      assertEquals(game.currentPair?.position.x, 3, "original x position");
    }
  });
  
  it("moveDownInGame places the pair on the board when it hits the bottom", () => {
    // Create a game with a pair at the bottom of the board
    const gameResult = createGame();
    assertEquals(gameResult.ok, true, "createGame result");
    if (!gameResult.ok) return;
    
    let game = gameResult.value;
    const startGameResult = startGame(game);
    assertEquals(startGameResult.ok, true, "startGame result");
    if (!startGameResult.ok) return;
    
    game = startGameResult.value;
    
    const mainPuyo = createPuyo(PuyoColor.RED);
    const secondPuyo = createPuyo(PuyoColor.GREEN);
    
    // Position the pair at the bottom of the board
    const bottomRowIndex = game.board.grid.length - 1; // Bottom row of the board
    
    // Create a pair with the main puyo at the second to last row and second puyo below it
    const pair = createPuyoPair(mainPuyo, secondPuyo, 3, bottomRowIndex - 1, RotationState.DOWN);
    
    game = Object.freeze({
      ...game,
      currentPair: pair
    });
    
    // Move down - this should trigger placement since the second puyo can't move beyond the bottom
    const result = moveDownInGame(game);
    assertEquals(result.ok, true);
    if (!result.ok) return;
    
    const finalGame = result.value;
    
    // The pair should be placed on the board and currentPair should be null
    assertEquals(finalGame.currentPair, null, "current pair after placement");
    assertEquals(finalGame.state, GameState.DROPPING, "state after placement");
    
    // The board should have the Puyos at their final positions
    // Main puyo should be at the second to last row
    const mainPuyoOnBoard = finalGame.board.grid[bottomRowIndex - 1][3];
    assertEquals(mainPuyoOnBoard.color, PuyoColor.RED, "main puyo on board");
    
    // Second puyo should be at the bottom row
    const secondPuyoOnBoard = finalGame.board.grid[bottomRowIndex][3];
    assertEquals(secondPuyoOnBoard.color, PuyoColor.GREEN, "second puyo on board");
  });
  
  it("updateGame applies gravity and checks for chains", () => {
    // Create a game with Puyos that need to fall
    const gameResult = createGame();
    assertEquals(gameResult.ok, true, "createGame result");
    if (!gameResult.ok) return;
    
    let game = gameResult.value;
    const startGameResult = startGame(game);
    assertEquals(startGameResult.ok, true, "startGame result");
    if (!startGameResult.ok) return;
    
    game = startGameResult.value;
    
    // Set up a board with floating Puyos in the normal field
    let board = game.board;
    const redPuyo = createPuyo(PuyoColor.RED);
    
    // Place a Puyo in the air in the normal field
    const normalFieldY = NORMAL_FIELD_START + 3; // Some position in the normal field
    const setPuyoResult = setPuyoAt(board, 2, normalFieldY, redPuyo);
    assertEquals(setPuyoResult.ok, true);
    if (!setPuyoResult.ok) return;
    board = setPuyoResult.value;
    
    game = Object.freeze({
      ...game,
      board,
      state: GameState.DROPPING,
      currentPair: null
    });
    
    // Update the game to apply gravity
    let updatedGame = updateGame(game);
    
    // The Puyo should have moved down
    assertEquals(updatedGame.board.grid[normalFieldY][2].color !== PuyoColor.RED, true, "puyo at original position");
    assertEquals(updatedGame.board.grid[normalFieldY + 1][2].color, PuyoColor.RED, "puyo at new position");
    
    // Keep updating until all Puyos have settled
    while (updatedGame.state === GameState.DROPPING) {
      updatedGame = updateGame(updatedGame);
    }
    
    // After settling, the state should change to CHECKING_CHAINS
    assertEquals(updatedGame.state, GameState.CHECKING_CHAINS, "state after settling");
    
    // Update again to check for chains
    updatedGame = updateGame(updatedGame);
    
    // Since there are no chains, it should spawn a new pair and go back to PLAYING
    assertEquals(updatedGame.state, GameState.PLAYING, "state after checking chains");
    assertEquals(updatedGame.currentPair !== null, true, "current pair after checking chains");
  });
  
  describe("Score calculation", () => {
    // Helper function to set up a game with a specific board configuration
    function setupGameWithBoard(boardStr: string): Game {
      const gameResult = createGame();
      if (!gameResult.ok) throw new Error("Failed to create game");
      
      const startGameResult = startGame(gameResult.value);
      if (!startGameResult.ok) throw new Error("Failed to start game");
      
      let game = startGameResult.value;
      
      // Parse the board string and set up the board
      const lines = boardStr.trim().split('\n');
      let board = game.board;
      
      // Process the board string from bottom to top
      for (let i = 0; i < lines.length; i++) {
        const line = lines[lines.length - 1 - i].trim();
        for (let x = 0; x < line.length; x++) {
          const char = line[x];
          if (char === '.') continue;
          
          const color = char === 'R' ? PuyoColor.RED :
                       char === 'B' ? PuyoColor.BLUE :
                       char === 'Y' ? PuyoColor.YELLOW :
                       char === 'G' ? PuyoColor.GREEN :
                       char === 'P' ? PuyoColor.PURPLE :
                       null;
          
          if (color !== null) {
            const puyo = createPuyo(color);
            const result = setPuyoAt(board, x, NORMAL_FIELD_START + i, puyo);
            if (result.ok) board = result.value;
          }
        }
      }
      
      game = Object.freeze({
        ...game,
        board,
        state: GameState.DROPPING
      });

      return game;
    }

    // Helper function to process chain reactions until completion
    function processChains(game: Game): Game {
      let currentGame = game;
      
      while (currentGame.state !== GameState.PLAYING && currentGame.state !== GameState.GAME_OVER) {
        currentGame = updateGame(currentGame);
      }
      
      return currentGame;
    }

    it("calculates a score of 920 for a 2-chain with red 7-group followed by two blue 4-groups", () => {
      const game = setupGameWithBoard(`
        ......
        ......
        ......
        ......
        ......
        ......
        ......
        ......
        ......
        BRB...
        RRR...
        BRB...
        BRB...
        BRB...`);

      const finalGame = processChains(game);
      assertEquals(finalGame.score, 920, "score should be 920 for 2-chain with red 7-group and two blue 4-groups");
    });

    it("calculates a score of 1160 for a 2-chain with red 7-group followed by blue 4-group and yellow 4-group", () => {
      const game = setupGameWithBoard(`
        ......
        ......
        ......
        ......
        ......
        ......
        ......
        ......
        ......
        BRY...
        RRR...
        BRY...
        BRY...
        BRY...`);

      const finalGame = processChains(game);
      assertEquals(finalGame.score, 1160, "score should be 1160 for 2-chain with red 7-group followed by blue 4-group and yellow 4-group");
    });

    it("calculates a score of 1380 for a 2-chain with red 7-group followed by blue 4-group and blue 6-group", () => {
      const game = setupGameWithBoard(`
        ......
        ......
        ......
        ......
        ......
        ......
        ......
        B.....
        B.....
        BRB...
        RRR...
        BRB...
        BRB...
        BRB...`);

      const finalGame = processChains(game);
      assertEquals(finalGame.score, 1380, "score should be 1380 for 2-chain with red 7-group followed by blue 4-group and blue 6-group");
    });

    it("calculates a score of 1480 for a 2-chain with red 7-group followed by two blue 5-groups", () => {
      const game = setupGameWithBoard(`
        ......
        ......
        ......
        ......
        ......
        ......
        ......
        ......
        B.B...
        BRB...
        RRR...
        BRB...
        BRB...
        BRB...`);

      const finalGame = processChains(game);
      assertEquals(finalGame.score, 1480, "score should be 1480 for 2-chain with red 7-group followed by two blue 5-groups");
    });
  });
});