import { Game } from "../domain/game.ts";

/**
 * Interface for rendering the game
 */
export interface GameRenderer {
  render(game: Game, undoAvailable?: boolean, redoAvailable?: boolean): void;
  renderGameOver(score: number): void;
}