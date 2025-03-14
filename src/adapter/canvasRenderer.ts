import { Game, GameState } from "../domain/game.ts";
import { PuyoColor, isEmpty } from "../domain/puyo.ts";
import { BOARD_WIDTH, BOARD_HEIGHT, HIDDEN_ROWS, getPuyoAt, isEmptyAt } from "../domain/board.ts";
import { GameRenderer } from "./gameRenderer.ts";
import { getMainPosition, getSecondPosition } from "../domain/puyoPair.ts";

/**
 * Renders the Puyo Puyo game on a canvas
 */
export class CanvasRenderer implements GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  private colors: Record<PuyoColor, string>;
  
  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas element with id ${canvasId} not found`);
    }
    
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context from canvas");
    }
    this.ctx = ctx;
    
    // Calculate cell size based on canvas dimensions
    this.cellSize = Math.min(
      this.canvas.width / (BOARD_WIDTH + 6), // Extra space for next piece
      this.canvas.height / BOARD_HEIGHT
    );
    
    // Define colors for Puyo pieces
    this.colors = {
      [PuyoColor.RED]: "#FF4136",
      [PuyoColor.GREEN]: "#2ECC40",
      [PuyoColor.BLUE]: "#0074D9",
      [PuyoColor.YELLOW]: "#FFDC00",
      [PuyoColor.PURPLE]: "#B10DC9",
      [PuyoColor.NONE]: "transparent"
    };
  }

  /**
   * Renders the game state
   */
  render(game: Game): void {
    this.clearCanvas();
    this.drawBoard(game);
    this.drawCurrentPair(game);
    this.drawNextPair(game);
    this.drawScore(game);
  }

  /**
   * Renders the game over screen
   */
  renderGameOver(score: number): void {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = "white";
    this.ctx.font = "30px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2 - 30);
    
    this.ctx.font = "24px Arial";
    this.ctx.fillText(`Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
    
    this.ctx.font = "18px Arial";
    this.ctx.fillText("Press ENTER to play again", this.canvas.width / 2, this.canvas.height / 2 + 50);
  }

  /**
   * Clears the canvas
   */
  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.ctx.fillStyle = "#f0f0f0";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draws the game board
   */
  private drawBoard(game: Game): void {
    const board = game.board;
    const boardX = 0;
    const boardY = 0;
    
    // Draw board background
    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(
      boardX,
      boardY,
      BOARD_WIDTH * this.cellSize,
      BOARD_HEIGHT * this.cellSize
    );
    
    // Draw grid lines
    this.ctx.strokeStyle = "#555";
    this.ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(boardX + x * this.cellSize, boardY);
      this.ctx.lineTo(boardX + x * this.cellSize, boardY + BOARD_HEIGHT * this.cellSize);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(boardX, boardY + y * this.cellSize);
      this.ctx.lineTo(boardX + BOARD_WIDTH * this.cellSize, boardY + y * this.cellSize);
      this.ctx.stroke();
    }
    
    // Draw Puyos on the board
    for (let y = HIDDEN_ROWS; y < BOARD_HEIGHT + HIDDEN_ROWS; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const puyo = getPuyoAt(board, x, y);
        
        if (!isEmpty(puyo)) {
          this.drawPuyo(
            boardX + x * this.cellSize,
            boardY + (y - HIDDEN_ROWS) * this.cellSize,
            puyo.color
          );
        }
      }
    }
  }

  /**
   * Draws the current Puyo pair
   */
  private drawCurrentPair(game: Game): void {
    const currentPair = game.currentPair;
    
    if (!currentPair || game.state !== GameState.PLAYING) {
      return;
    }
    
    const mainPos = getMainPosition(currentPair);
    const secondPos = getSecondPosition(currentPair);
    
    // Always draw the current pair, even if in hidden rows
    this.drawPuyo(
      mainPos.x * this.cellSize,
      Math.max(0, (mainPos.y - HIDDEN_ROWS)) * this.cellSize,
      currentPair.mainPuyo.color
    );
    
    this.drawPuyo(
      secondPos.x * this.cellSize,
      Math.max(0, (secondPos.y - HIDDEN_ROWS)) * this.cellSize,
      currentPair.secondPuyo.color
    );
  }

  /**
   * Draws the next Puyo pair
   */
  private drawNextPair(game: Game): void {
    const nextPair = game.nextPair;
    const nextX = BOARD_WIDTH * this.cellSize + 20;
    const nextY = 20;
    
    // Draw next piece label
    this.ctx.fillStyle = "black";
    this.ctx.font = "16px Arial";
    this.ctx.textAlign = "left";
    this.ctx.fillText("Next:", nextX, nextY - 5);
    
    // Draw next piece background
    this.ctx.fillStyle = "#ddd";
    this.ctx.fillRect(nextX, nextY, this.cellSize * 2, this.cellSize * 2);
    
    // Draw next piece
    this.drawPuyo(
      nextX,
      nextY + this.cellSize,
      nextPair.mainPuyo.color
    );
    
    this.drawPuyo(
      nextX + this.cellSize,
      nextY + this.cellSize,
      nextPair.secondPuyo.color
    );
  }

  /**
   * Draws the score
   */
  private drawScore(game: Game): void {
    const scoreX = BOARD_WIDTH * this.cellSize + 20;
    const scoreY = 100;
    
    this.ctx.fillStyle = "black";
    this.ctx.font = "16px Arial";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`Score: ${game.score}`, scoreX, scoreY);
    
    if (game.chainCount > 0) {
      this.ctx.fillText(`Chain: ${game.chainCount}`, scoreX, scoreY + 25);
    }
  }

  /**
   * Draws a single Puyo
   */
  private drawPuyo(x: number, y: number, color: PuyoColor): void {
    const radius = this.cellSize / 2 - 2;
    const centerX = x + this.cellSize / 2;
    const centerY = y + this.cellSize / 2;
    
    // Draw Puyo circle
    this.ctx.fillStyle = this.colors[color];
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw highlight
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.beginPath();
    this.ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw outline
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
  }
}