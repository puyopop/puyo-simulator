import {
  Game,
  GameState,
  createGame,
  startGame,
  moveLeftInGame,
  moveRightInGame,
  moveDownInGame,
  rotateClockwiseInGame,
  rotateCounterClockwiseInGame,
  hardDrop,
  updateGame
} from "../domain/game.ts";
import { BOARD_WIDTH, BOARD_HEIGHT, HIDDEN_ROWS, createBoard } from "../domain/board.ts";
import { PuyoColor, createPuyo } from "../domain/puyo.ts";
import { createPuyoPair, RotationState } from "../domain/puyoPair.ts";
import { GameRenderer } from "./gameRenderer.ts";
import { KeyConfig, KeyBindings } from "./keyConfig.ts";

/**
 * Controller for the Puyo Puyo game
 * Handles user input and game updates
 */
export class GameController {
  private game: Game;
  private lastUpdateTime: number;
  private dropInterval: number; // Time in ms between automatic drops
  private isKeyDown: Record<string, boolean>;
  private renderer: GameRenderer;
  private keyConfig: KeyConfig;
  
  // キー入力の制御用パラメータ
  private keyHoldTime: Record<string, number>;
  private keyRepeatDelay: number;   // キー長押し時の初期遅延（ms）
  private keyRepeatInterval: number; // キー長押し時の繰り返し間隔（ms）
  private lastKeyActionTime: Record<string, number>;
  
  constructor(renderer: GameRenderer, keyConfig: KeyConfig) {
    const gameResult = createGame();
    if (gameResult.ok) {
      this.game = gameResult.value;
    } else {
      console.error("Failed to create game:", gameResult.error);
      // Create a default game using a fallback method
      this.game = this.createDefaultGame();
    }
    
    this.lastUpdateTime = 0;
    this.dropInterval = 1000; // 1 second
    this.isKeyDown = {};
    this.renderer = renderer;
    this.keyConfig = keyConfig;
    
    // キー入力制御のための初期化
    this.keyHoldTime = {};
    this.keyRepeatDelay = 200; // 最初の入力から次の入力までの遅延
    this.keyRepeatInterval = 50; // 連続入力の間隔
    this.lastKeyActionTime = {};
    
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Creates a default game when the normal creation fails
   * This is a fallback method
   */
  private createDefaultGame(): Game {
    // Create a minimal valid game object
    return {
      board: createBoard(),
      currentPair: null,
      nextPair: createPuyoPair(
        createPuyo(PuyoColor.RED),
        createPuyo(PuyoColor.BLUE)
      ),
      state: GameState.IDLE,
      score: 0,
      chainCount: 0,
      flashingTime: 0,
      puyoSeq: {
        seq: Array(256).fill(null).map(() =>
          createPuyo(
            [PuyoColor.RED, PuyoColor.BLUE, PuyoColor.GREEN, PuyoColor.YELLOW, PuyoColor.PURPLE][
              Math.floor(Math.random() * 5)
            ]
          )
        )
      },
      moveCount: 1
    };
  }

  /**
   * Starts a new game
   */
  startGame(): void {
    const startGameResult = startGame(this.game);
    
    if (startGameResult.ok) {
      this.game = startGameResult.value;
      this.lastUpdateTime = performance.now();
      this.dropInterval = 1000;
      
      // キー入力状態をリセット
      this.keyHoldTime = {};
      this.lastKeyActionTime = {};
      
      // Start the game loop
      requestAnimationFrame(this.gameLoop.bind(this));
    } else {
      console.error("Failed to start game:", startGameResult.error);
      // If the game failed to start due to PuyoSeq not being loaded,
      // we can retry after a short delay
      if (startGameResult.error.type === "PuyoSeqNotLoaded") {
        console.log("PuyoSeq not loaded yet, retrying in 500ms...");
        setTimeout(() => this.startGame(), 500);
      }
    }
  }

  /**
   * The main game loop
   */
  private gameLoop(timestamp: number): void {
    // Calculate time since last update
    const deltaTime = timestamp - this.lastUpdateTime;
    
    // Handle user input
    this.handleInput(timestamp);
    
    // Update game state
    // No auto-drop functionality - only hard drops are allowed
    this.game = updateGame(this.game);
    
    // Render the game
    this.renderer.render(this.game);
    
    // Continue the game loop if not game over
    if (this.game.state !== GameState.GAME_OVER) {
      requestAnimationFrame(this.gameLoop.bind(this));
    } else {
      this.renderer.renderGameOver(this.game.score);
    }
  }

  /**
   * Sets up keyboard event listeners
   */
  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener("keydown", (event) => {
      if (!this.isKeyDown[event.key]) {
        // キーが押された初回のみ時間を記録
        this.keyHoldTime[event.key] = performance.now();
        this.isKeyDown[event.key] = true;
      }
      
      // Handle one-time key presses
      const keyBindings = this.keyConfig.getKeyBindings();
      
      if (event.key === keyBindings.rotateClockwise) {
        const result = rotateClockwiseInGame(this.game);
        if (result.ok) {
          this.game = result.value;
        }
      } else if (event.key === keyBindings.rotateCounterClockwise) {
        const result = rotateCounterClockwiseInGame(this.game);
        if (result.ok) {
          this.game = result.value;
        }
      } else if (event.key === keyBindings.hardDrop) {
        const result = hardDrop(this.game);
        if (result.ok) {
          this.game = result.value;
        }
      }
      
      // Prevent default for game keys
      const gameKeys = Object.values(keyBindings);
      if (gameKeys.includes(event.key)) {
        event.preventDefault();
      }
    });
    
    window.addEventListener("keyup", (event) => {
      this.isKeyDown[event.key] = false;
      this.keyHoldTime[event.key] = 0;
      // キーが離された時、次回の入力までの遅延をリセット
      delete this.lastKeyActionTime[event.key];
    });
  }

  /**
   * Handles continuous key presses with improved control mechanics
   */
  private handleInput(currentTime: number): void {
    if (this.game.state !== GameState.PLAYING) {
      return;
    }
    
    const keyBindings = this.keyConfig.getKeyBindings();
    
    // 左移動キーの処理
    this.handleDirectionalInput(currentTime, keyBindings.moveLeft, () => {
      const result = moveLeftInGame(this.game);
      if (result.ok) {
        this.game = result.value;
      }
    });
    
    // 右移動キーの処理
    this.handleDirectionalInput(currentTime, keyBindings.moveRight, () => {
      const result = moveRightInGame(this.game);
      if (result.ok) {
        this.game = result.value;
      }
    });
    
    // 下移動キーの処理は無効化 - ハードドロップのみ使用可能
    // moveDown functionality is disabled - only hard drops are allowed
  }

  /**
   * キー入力の処理を改善した方向キー入力処理
   */
  private handleDirectionalInput(currentTime: number, key: string, action: () => void): void {
    if (!this.isKeyDown[key]) return;

    const holdDuration = currentTime - (this.keyHoldTime[key] || 0);
    const lastActionTime = this.lastKeyActionTime[key] || 0;
    const timeSinceLastAction = currentTime - lastActionTime;
    
    // 初回入力またはキーリピート間隔の条件を満たした場合
    if (
      lastActionTime === 0 || // 初回入力
      (holdDuration <= this.keyRepeatDelay && timeSinceLastAction >= this.keyRepeatInterval * 4) || // 長押し開始直後は遅く
      (holdDuration > this.keyRepeatDelay && timeSinceLastAction >= this.keyRepeatInterval) // 長押し継続中は設定間隔で
    ) {
      // アクションを実行し、最終アクション時間を更新
      action();
      this.lastKeyActionTime[key] = currentTime;
    }
  }
}