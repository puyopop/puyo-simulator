import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { 
  PuyoColor, 
  createPuyo, 
  createEmptyPuyo, 
  isEmpty, 
  canConnectWith 
} from "../../src/domain/puyo.ts";

describe("Puyo", () => {
  it("createPuyo creates a puyo with the specified color", () => {
    const puyo = createPuyo(PuyoColor.RED);
    expect(puyo.color, "puyo color").toBe(PuyoColor.RED);
  });

  it("createEmptyPuyo creates a puyo with no color", () => {
    const puyo = createEmptyPuyo();
    expect(puyo.color, "empty puyo color").toBe(PuyoColor.NONE);
  });

  it("isEmpty returns true for empty puyos", () => {
    const emptyPuyo = createEmptyPuyo();
    expect(isEmpty(emptyPuyo), "empty puyo check").toBe(true);
    
    const coloredPuyo = createPuyo(PuyoColor.BLUE);
    expect(isEmpty(coloredPuyo), "colored puyo check").toBe(false);
  });

  it("canConnectWith returns true for same-colored puyos", () => {
    const redPuyo1 = createPuyo(PuyoColor.RED);
    const redPuyo2 = createPuyo(PuyoColor.RED);
    const bluePuyo = createPuyo(PuyoColor.BLUE);
    const emptyPuyo = createEmptyPuyo();
    
    expect(canConnectWith(redPuyo1, redPuyo2), "same color connection").toBe(true);
    expect(canConnectWith(redPuyo1, bluePuyo), "different color connection").toBe(false);
    expect(canConnectWith(redPuyo1, emptyPuyo), "empty puyo connection").toBe(false);
    expect(canConnectWith(emptyPuyo, redPuyo1), "empty puyo as source").toBe(false);
  });
});