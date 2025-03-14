import { GameController } from "./adapter/gameController.ts";
import { CanvasRenderer } from "./adapter/canvasRenderer.ts";
import { KeyConfig } from "./adapter/keyConfig.ts";
import { KeyConfigUI } from "./adapter/keyConfigUI.ts";

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the game
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found");
    return;
  }
  
  try {
    // Create renderer, key config, and game controller
    const renderer = new CanvasRenderer("game-canvas");
    const keyConfig = new KeyConfig();
    const gameController = new GameController(renderer, keyConfig);
    
    // Initialize key configuration UI
    new KeyConfigUI(keyConfig);
    
    // Set up start button
    const startButton = document.getElementById("start-button");
    if (startButton) {
      startButton.addEventListener("click", () => {
        gameController.startGame();
        startButton.style.display = "none";
      });
    }
    
    // Add keyboard event listener for restarting the game
    window.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        gameController.startGame();
        if (startButton) {
          startButton.style.display = "none";
        }
      }
    });
    
    console.log("Puyo Puyo Simulator initialized successfully");
  } catch (error) {
    console.error("Error initializing game:", error);
  }
});