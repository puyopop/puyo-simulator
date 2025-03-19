/**
 * Key configuration for the game
 * Manages customizable key bindings
 */

// Default key bindings
export interface KeyBindings {
  moveLeft: string;
  moveRight: string;
  moveDown: string;
  rotateClockwise: string;
  rotateCounterClockwise: string;
  hardDrop: string;
  undo: string;
  redo: string;
}

// Default key configuration
export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  moveLeft: "a",
  moveRight: "d",
  moveDown: "s",
  rotateClockwise: "k",
  rotateCounterClockwise: "j",
  hardDrop: " ", // Space
  undo: "u",
  redo: "r",
};

// Storage key for saving key bindings in localStorage
const STORAGE_KEY = "puyoSimulatorKeyBindings";

/**
 * Key configuration manager
 * Handles loading, saving, and updating key bindings
 */
export class KeyConfig {
  private keyBindings: KeyBindings;
  
  constructor() {
    this.keyBindings = this.loadKeyBindings();
  }
  
  /**
   * Gets the current key bindings
   */
  getKeyBindings(): KeyBindings {
    return { ...this.keyBindings };
  }
  
  /**
   * Updates a specific key binding
   */
  updateKeyBinding(action: keyof KeyBindings, key: string): void {
    this.keyBindings[action] = key;
    this.saveKeyBindings();
  }
  
  /**
   * Resets all key bindings to default
   */
  resetToDefaults(): void {
    this.keyBindings = { ...DEFAULT_KEY_BINDINGS };
    this.saveKeyBindings();
  }
  
  /**
   * Gets the key for a specific action
   */
  getKey(action: keyof KeyBindings): string {
    return this.keyBindings[action];
  }
  
  /**
   * Gets the action associated with a key
   */
  getActionForKey(key: string): keyof KeyBindings | null {
    for (const [action, boundKey] of Object.entries(this.keyBindings)) {
      if (boundKey === key) {
        return action as keyof KeyBindings;
      }
    }
    return null;
  }
  
  /**
   * Loads key bindings from localStorage or uses defaults
   */
  private loadKeyBindings(): KeyBindings {
    try {
      const savedBindings = localStorage.getItem(STORAGE_KEY);
      if (savedBindings) {
        const parsed = JSON.parse(savedBindings);
        // Add undo key if missing in saved bindings
        if (!parsed.undo) {
          parsed.undo = DEFAULT_KEY_BINDINGS.undo;
        }
        // Add redo key if missing in saved bindings
        if (!parsed.redo) {
          parsed.redo = DEFAULT_KEY_BINDINGS.redo;
        }
        return parsed;
      }
    } catch (error) {
      console.error("Error loading key bindings:", error);
    }
    
    return { ...DEFAULT_KEY_BINDINGS };
  }
  
  /**
   * Saves current key bindings to localStorage
   */
  private saveKeyBindings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.keyBindings));
    } catch (error) {
      console.error("Error saving key bindings:", error);
    }
  }
}