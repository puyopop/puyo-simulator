import { Game } from "../domain/game.ts";

/**
 * Interface for rendering the game
 */
export interface GameRenderer {
  render(game: Game): void;
  renderGameOver(score: number): void;
}