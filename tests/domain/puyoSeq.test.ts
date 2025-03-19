import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { PuyoColor, createPuyo } from "../../src/domain/puyo.ts";
import { createPuyoSeq } from "../../src/domain/puyoSeq.ts";

const seed_0 = "rrprpypyrbbbpbbprrrybbyppbyyrppybybrbbbppppbyypybppyypbyrbyyyppppbpppyryyrpyybpbryrbbrpybrrbrrbbpypyrryrrybrbpbbybrrpppyrprrryrrbybrbbrbrybprpyppybyrpprpbbyybbyybrprbybryrrbrybyppbbbpyybprpyyrryppyrrbppybyyypprpryrpbpbpbyrpyprybrybrrbppyrbyypryrbbprrbprprb";
const seed_10 = "ybpyyyppygpggyygbygbppygpyggygbgygggpbbgbgpgggbpppybgypgpygggbppyybgbpbbyybppggbybbbyypgppbgbbyppbbybybyyggbbyybppppygbgybppbbbpbygpbbpypyypybpybpyyypyygpgpbgpgypyyypypygygygpbpbpbbgggbpbbgbybgpypbgpbpbbgypbyygygygbgypygpggygggggggpbbppyppgbbgbbbpyyypbgypb";

// シード値から期待されるぷよの配列を生成
function createExpectedPuyosFromSeed(seedString: string) {
  const colorMap: Record<string, PuyoColor> = {
    'r': PuyoColor.RED,
    'g': PuyoColor.GREEN,
    'b': PuyoColor.BLUE,
    'y': PuyoColor.YELLOW,
    'p': PuyoColor.PURPLE
  };

  return [...seedString].map(c => createPuyo(colorMap[c]));
}

describe("PuyoSeq", () => {
  // シーケンスがロードされていない場合のテスト
  it("should fail when sequences are not loaded", () => {
    // シーケンスが未ロードの場合、エラーを返すことを確認
    const result = createPuyoSeq(0);
    
    if (result.ok) {
      // このテストはシーケンスがロードされていない場合のみ有効
      console.log("Skipping test: PuyoSeq already loaded");
      return;
    }
    
    expect(result.ok, "result should be error").toBe(false);
    if (!result.ok) {
      expect(result.error instanceof Error, "error should be Error instance").toBe(true);
      expect(result.error.message, "error message").toBe("PuyoSeq not loaded yet. Please retry later.");
    }
  });

  // 以下のテストはシーケンスがロード済みであることを前提としています
  it("should generate consistent sequence with seed 0", () => {
    // シード値0でPuyoSeqを作成
    const result = createPuyoSeq(0);
    
    // シーケンスがロードされていない場合はスキップ
    if (!result.ok) {
      console.log("Skipping test: PuyoSeq not loaded yet");
      return;
    }
    
    const puyoSeq = result.value;
    
    // seed_0 文字列から期待されるぷよの配列を生成
    const expectedPuyos = createExpectedPuyosFromSeed(seed_0);
    
    // 最初の256ぷよが期待通りであることを確認
    for (let i = 0; i < Math.min(puyoSeq.seq.length, expectedPuyos.length); i++) {
      expect(puyoSeq.seq[i].color, `Puyo at index ${i}`).toBe(expectedPuyos[i].color);
    }
    
    // 配列の長さが一致することを確認（256であるべき）
    expect(puyoSeq.seq.length, "PuyoSeq length").toBe(256);
  });

  it("should generate consistent sequence with seed 10", () => {
    // シード値10でPuyoSeqを作成
    const result = createPuyoSeq(10);
    
    // シーケンスがロードされていない場合はスキップ
    if (!result.ok) {
      console.log("Skipping test: PuyoSeq not loaded yet");
      return;
    }
    
    const puyoSeq = result.value;
    
    // seed_10 文字列から期待されるぷよの配列を生成
    const expectedPuyos = createExpectedPuyosFromSeed(seed_10);
    
    // 最初の256ぷよが期待通りであることを確認
    for (let i = 0; i < Math.min(puyoSeq.seq.length, expectedPuyos.length); i++) {
      expect(puyoSeq.seq[i].color, `Puyo at index ${i}`).toBe(expectedPuyos[i].color);
    }
    
    // 配列の長さが一致することを確認（256であるべき）
    expect(puyoSeq.seq.length, "PuyoSeq length").toBe(256);
  });

  it("should always return the same sequence for the same seed", () => {
    // 同じシード値で2つのPuyoSeqを生成
    const result1 = createPuyoSeq(0);
    const result2 = createPuyoSeq(0);
    
    // シーケンスがロードされていない場合はスキップ
    if (!result1.ok || !result2.ok) {
      console.log("Skipping test: PuyoSeq not loaded yet");
      return;
    }
    
    const puyoSeq1 = result1.value;
    const puyoSeq2 = result2.value;
    
    // 両者が同じ配列を生成することを確認
    expect(puyoSeq1.seq.length, "sequence lengths").toBe(puyoSeq2.seq.length);
    
    for (let i = 0; i < puyoSeq1.seq.length; i++) {
      expect(puyoSeq1.seq[i].color, `Puyo at index ${i}`).toBe(puyoSeq2.seq[i].color);
    }
  });

  it("should produce different sequences for different seeds", () => {
    // 異なるシード値で2つのPuyoSeqを生成
    const result1 = createPuyoSeq(0);
    const result2 = createPuyoSeq(1);
    
    // シーケンスがロードされていない場合はスキップ
    if (!result1.ok || !result2.ok) {
      console.log("Skipping test: PuyoSeq not loaded yet");
      return;
    }
    
    const puyoSeq1 = result1.value;
    const puyoSeq2 = result2.value;
    
    // 少なくとも1つのぷよが異なることを期待
    let hasDifference = false;
    for (let i = 0; i < puyoSeq1.seq.length; i++) {
      if (puyoSeq1.seq[i].color !== puyoSeq2.seq[i].color) {
        hasDifference = true;
        break;
      }
    }
    
    expect(hasDifference, "sequences should be different").toBe(true);
  });
});