/**
 * UI controller for key configuration
 * Handles the key configuration UI interactions
 */
import { KeyConfig, KeyBindings } from "./keyConfig.ts";

export class KeyConfigUI {
  private keyConfig: KeyConfig;
  private keyButtons: Map<keyof KeyBindings, HTMLButtonElement>;
  private controlsList: HTMLUListElement;
  private listeningButton: HTMLButtonElement | null = null;
  private reservedKeys: Set<string> = new Set(["Enter", "Escape"]);
  
  constructor(keyConfig: KeyConfig) {
    this.keyConfig = keyConfig;
    this.keyButtons = new Map();
    this.controlsList = document.getElementById("controls-list") as HTMLUListElement;
    
    this.initializeUI();
    this.setupEventListeners();
  }
  
  /**
   * Initializes the UI with current key bindings
   */
  private initializeUI(): void {
    const keyBindings = this.keyConfig.getKeyBindings();
    
    // Find all key buttons using data-action attribute
    const keyButtonElements = document.querySelectorAll<HTMLButtonElement>('.key-button[data-action]');
    
    // Initialize each button
    keyButtonElements.forEach(button => {
      const action = button.dataset.action as keyof KeyBindings;
      if (action && action in keyBindings) {
        button.textContent = this.formatKeyName(keyBindings[action]);
        button.addEventListener("click", () => this.startListeningForKey(button, action));
        this.keyButtons.set(action, button);
      }
    });
    
    // Initialize reset button
    const resetButton = document.getElementById("reset-keys");
    if (resetButton) {
      resetButton.addEventListener("click", () => this.resetToDefaults());
    }
    
    // Update the controls list
    this.updateControlsList();
  }
  
  /**
   * Sets up global event listeners
   */
  private setupEventListeners(): void {
    // Listen for key presses when in listening mode
    window.addEventListener("keydown", (event) => {
      if (this.listeningButton) {
        this.handleKeyPress(event);
      }
    });
    
    // Cancel listening when clicking elsewhere
    document.addEventListener("click", (event) => {
      if (this.listeningButton && !this.listeningButton.contains(event.target as Node)) {
        this.stopListening();
      }
    });
  }
  
  /**
   * Starts listening for a key press for the given action
   */
  private startListeningForKey(button: HTMLButtonElement, action: keyof KeyBindings): void {
    // Stop any previous listening
    this.stopListening();
    
    // Start listening on this button
    this.listeningButton = button;
    button.classList.add("listening");
    button.textContent = "Press a key...";
    
    // Prevent the click from propagating
    button.addEventListener("click", (event) => {
      event.stopPropagation();
    }, { once: true });
  }
  
  /**
   * Handles a key press when in listening mode
   */
  private handleKeyPress(event: KeyboardEvent): void {
    if (!this.listeningButton) return;
    
    // Get the action from the button's data attribute
    const action = this.listeningButton.dataset.action as keyof KeyBindings;
    
    // Check if the key is reserved
    if (this.reservedKeys.has(event.key)) {
      if (event.key === "Escape") {
        // Cancel key binding
        this.stopListening();
      }
      return;
    }
    
    // Update the key binding
    this.keyConfig.updateKeyBinding(action, event.key);
    
    // Update the button text
    this.listeningButton.textContent = this.formatKeyName(event.key);
    
    // Stop listening
    this.stopListening();
    
    // Update the controls list
    this.updateControlsList();
    
    // Prevent default behavior
    event.preventDefault();
  }
  
  /**
   * Stops listening for key presses
   */
  private stopListening(): void {
    if (this.listeningButton) {
      this.listeningButton.classList.remove("listening");
      
      // If the button text is still "Press a key...", reset it to the current binding
      if (this.listeningButton.textContent === "Press a key...") {
        const action = this.listeningButton.dataset.action as keyof KeyBindings;
        const currentKey = this.keyConfig.getKey(action);
        this.listeningButton.textContent = this.formatKeyName(currentKey);
      }
      
      this.listeningButton = null;
    }
  }
  
  /**
   * Resets all key bindings to defaults
   */
  private resetToDefaults(): void {
    this.keyConfig.resetToDefaults();
    const keyBindings = this.keyConfig.getKeyBindings();
    
    // Update all button texts
    for (const [action, button] of this.keyButtons.entries()) {
      button.textContent = this.formatKeyName(keyBindings[action]);
    }
    
    // Update the controls list
    this.updateControlsList();
  }
  
  /**
   * Updates the controls list in the UI
   */
  private updateControlsList(): void {
    if (!this.controlsList) return;
    
    const keyBindings = this.keyConfig.getKeyBindings();
    
    // Clear the current list
    this.controlsList.innerHTML = "";
    
    // Add the updated controls
    this.addControlItem("Move Left", keyBindings.moveLeft);
    this.addControlItem("Move Right", keyBindings.moveRight);
    this.addControlItem("Move Down", keyBindings.moveDown);
    this.addControlItem("Rotate Clockwise", keyBindings.rotateClockwise);
    this.addControlItem("Rotate Counter-Clockwise", keyBindings.rotateCounterClockwise);
    this.addControlItem("Hard Drop", keyBindings.hardDrop);
    this.addControlItem("Undo Move", keyBindings.undo);
  }
  
  /**
   * Adds a control item to the controls list
   */
  private addControlItem(action: string, key: string): void {
    const li = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = this.formatKeyName(key) + ":";
    li.appendChild(strong);
    li.appendChild(document.createTextNode(" " + action));
    this.controlsList.appendChild(li);
  }
  
  /**
   * Formats a key name for display
   */
  private formatKeyName(key: string): string {
    switch (key) {
      case " ":
        return "Space";
      case "ArrowLeft":
        return "Left Arrow";
      case "ArrowRight":
        return "Right Arrow";
      case "ArrowUp":
        return "Up Arrow";
      case "ArrowDown":
        return "Down Arrow";
      default:
        // Capitalize first letter for single character keys
        return key.length === 1 ? key.toUpperCase() : key;
    }
  }
  
  // No longer need getButtonId and kebabCase methods as we're using data-action attributes
}