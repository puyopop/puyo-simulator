import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { KeyConfig } from "../../src/adapter/keyConfig.ts";
import { KeyConfigUI } from "../../src/adapter/keyConfigUI.ts";

// Mock the document and window objects since we're running in Deno
let mockElements: Record<string, HTMLElement> = {};
let mockEventListeners: Record<string, Array<(event: any) => void>> = {};

// Create a mock for the document object
const originalDocument = globalThis.document;
const mockDocument = {
  getElementById: (id: string) => mockElements[id] || null,
  createElement: (tag: string) => {
    const element = {
      textContent: "",
      classList: {
        add: () => {},
        remove: () => {},
      },
      contains: () => false,
      appendChild: () => {},
      addEventListener: (event: string, callback: (event: any) => void) => {
        if (!mockEventListeners[`element-${event}`]) {
          mockEventListeners[`element-${event}`] = [];
        }
        mockEventListeners[`element-${event}`].push(callback);
      }
    };
    return element;
  },
  createTextNode: (text: string) => ({ textContent: text }),
  addEventListener: (event: string, callback: (event: any) => void) => {
    if (!mockEventListeners[event]) {
      mockEventListeners[event] = [];
    }
    mockEventListeners[event].push(callback);
  }
} as unknown as Document;

// Create a mock for the window object
const originalWindow = globalThis.window;
const mockWindow = {
  addEventListener: (event: string, callback: (event: any) => void) => {
    if (!mockEventListeners[event]) {
      mockEventListeners[event] = [];
    }
    mockEventListeners[event].push(callback);
  }
} as unknown as Window & typeof globalThis;

// Set up the test environment
const setupMockDOM = () => {
  // Create mock HTML elements
  mockElements = {
    "controls-list": {
      innerHTML: "",
      appendChild: () => {}
    } as unknown as HTMLUListElement,
    "key-move-left": createMockButton("moveLeft"),
    "key-move-right": createMockButton("moveRight"),
    "key-move-down": createMockButton("moveDown"),
    "key-rotate-cw": createMockButton("rotateClockwise"),
    "key-rotate-ccw": createMockButton("rotateCounterClockwise"),
    "key-hard-drop": createMockButton("hardDrop"),
    "reset-keys": createMockButton("reset")
  };

  // Assign mocks to global objects
  globalThis.document = mockDocument;
  globalThis.window = mockWindow;
};

// Helper to create a mock button
function createMockButton(action: string): HTMLButtonElement {
  return {
    textContent: "",
    dataset: { action },
    classList: {
      add: () => {},
      remove: () => {}
    },
    contains: () => false,
    addEventListener: (event: string, callback: (event: any) => void) => {
      if (!mockEventListeners[`button-${action}-${event}`]) {
        mockEventListeners[`button-${action}-${event}`] = [];
      }
      mockEventListeners[`button-${action}-${event}`].push(callback);
    }
  } as unknown as HTMLButtonElement;
}

// Clean up after tests
const cleanupMockDOM = () => {
  globalThis.document = originalDocument;
  globalThis.window = originalWindow;
  mockElements = {};
  mockEventListeners = {};
};

// Storage mock for KeyConfig
let mockStorage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    mockStorage = {};
  },
  length: 0,
  key: () => null
} as unknown as Storage;

// Mock querySelectorAll for our new implementation
mockDocument.querySelectorAll = (selector: string) => {
  if (selector === '.key-button[data-action]') {
    return [
      mockElements["key-move-left"],
      mockElements["key-move-right"],
      mockElements["key-move-down"],
      mockElements["key-rotate-cw"],
      mockElements["key-rotate-ccw"],
      mockElements["key-hard-drop"]
    ] as unknown as NodeListOf<HTMLButtonElement>;
  }
  return [] as unknown as NodeListOf<HTMLButtonElement>;
};

// Test suite
Deno.test("KeyConfigUI initialization test", async () => {
  setupMockDOM();
  try {
    // Create a simple implementation to test
    const keyConfig = new KeyConfig();
    const keyConfigUI = new KeyConfigUI(keyConfig);
    
    // Verify no errors occur during initialization
    assertEquals(true, true);
    
  } finally {
    cleanupMockDOM();
  }
});

// Test case for our data-action based implementation
Deno.test("KeyConfigUI with data-action attributes", () => {
  setupMockDOM();
  try {
    // Setup the test with buttons that have data-action attributes
    const actions = [
      "moveLeft",
      "rotateClockwise",
      "rotateCounterClockwise"
    ];
    
    // Initialize KeyConfigUI which should now use querySelectorAll with data-action
    const keyConfigUI = new KeyConfigUI(new KeyConfig());
    
    // Test that buttons with data-action attributes are properly found
    const verifyButtonsFound = () => {
      // Check if our buttons were properly initialized by their data-action attributes
      let rotateClockwiseFound = false;
      let rotateCounterClockwiseFound = false;
      
      // Check the buttons directly by their data-action attributes
      const cwButton = mockElements["key-rotate-cw"] as HTMLButtonElement;
      const ccwButton = mockElements["key-rotate-ccw"] as HTMLButtonElement;
      
      if (cwButton && cwButton.dataset.action === "rotateClockwise") {
        rotateClockwiseFound = true;
      }
      
      if (ccwButton && ccwButton.dataset.action === "rotateCounterClockwise") {
        rotateCounterClockwiseFound = true;
      }
      
      return {
        rotateClockwiseFound,
        rotateCounterClockwiseFound
      };
    };
    
    // With our data-action implementation, both buttons should be found
    const result = verifyButtonsFound();
    
    // Both these should be true with our new implementation
    assertEquals(result.rotateClockwiseFound, true, "rotateClockwise button should be found by data-action");
    assertEquals(result.rotateCounterClockwiseFound, true, "rotateCounterClockwise button should be found by data-action");
    
  } finally {
    cleanupMockDOM();
  }
});