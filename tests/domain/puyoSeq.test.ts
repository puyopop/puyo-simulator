import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
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

Deno.test("PuyoSeq should generate consistent sequence with seed 0", () => {
  // シード値0でPuyoSeqを作成
  const puyoSeq = createPuyoSeq(0);
  
  // seed_0 文字列から期待されるぷよの配列を生成
  const expectedPuyos = createExpectedPuyosFromSeed(seed_0);
  
  // 最初の256ぷよが期待通りであることを確認
  for (let i = 0; i < Math.min(puyoSeq.seq.length, expectedPuyos.length); i++) {
    assertEquals(puyoSeq.seq[i].color, expectedPuyos[i].color, 
      `Puyo at index ${i} should be ${expectedPuyos[i].color} but was ${puyoSeq.seq[i].color}`);
  }
  
  // 配列の長さが一致することを確認（256であるべき）
  assertEquals(puyoSeq.seq.length, 256, "PuyoSeq should contain exactly 256 Puyos");
});

Deno.test("PuyoSeq should generate consistent sequence with seed 10", () => {
    // シード値0でPuyoSeqを作成
    const puyoSeq = createPuyoSeq(10);
    
    // seed_0 文字列から期待されるぷよの配列を生成
    const expectedPuyos = createExpectedPuyosFromSeed(seed_10);
    
    // 最初の256ぷよが期待通りであることを確認
    for (let i = 0; i < Math.min(puyoSeq.seq.length, expectedPuyos.length); i++) {
      assertEquals(puyoSeq.seq[i].color, expectedPuyos[i].color, 
        `Puyo at index ${i} should be ${expectedPuyos[i].color} but was ${puyoSeq.seq[i].color}`);
    }
    
    // 配列の長さが一致することを確認（256であるべき）
    assertEquals(puyoSeq.seq.length, 256, "PuyoSeq should contain exactly 256 Puyos");
  });

Deno.test("PuyoSeq should always return the same sequence for the same seed", () => {
  // 同じシード値で2つのPuyoSeqを生成
  const puyoSeq1 = createPuyoSeq(0);
  const puyoSeq2 = createPuyoSeq(0);
  
  // 両者が同じ配列を生成することを確認
  assertEquals(puyoSeq1.seq.length, puyoSeq2.seq.length);
  
  for (let i = 0; i < puyoSeq1.seq.length; i++) {
    assertEquals(puyoSeq1.seq[i].color, puyoSeq2.seq[i].color, 
      `Puyo at index ${i} should be the same in both sequences`);
  }
});

Deno.test("Different seeds should produce different PuyoSeqs", () => {
  // 異なるシード値で2つのPuyoSeqを生成
  const puyoSeq1 = createPuyoSeq(0);
  const puyoSeq2 = createPuyoSeq(1);
  
  // 少なくとも1つのぷよが異なることを期待
  let hasDifference = false;
  for (let i = 0; i < puyoSeq1.seq.length; i++) {
    if (puyoSeq1.seq[i].color !== puyoSeq2.seq[i].color) {
      hasDifference = true;
      break;
    }
  }
  
  assertEquals(hasDifference, true, "Different seeds should produce different sequences");
});