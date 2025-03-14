import { Puyo, PuyoColor, createPuyo, createRandomPuyo } from "./puyo.ts";
import { createPuyoPair } from "./puyoPair.ts";

export type PuyoSeq = Readonly<{
    seq: ReadonlyArray<Puyo>;
}>;

function random(seed: number): () => number {
    let state = seed & 0xFFFF; // 16-bit マスク
    return () => {
      state ^= state << 7;
      state ^= state >> 9;
      state ^= state << 8;
      return state & 0xFFFF;
    };
}

function shuffle(array: Puyo[], rnd: () => number): Puyo[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = rnd() % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function createPuyoSeq_prev(seed: number): PuyoSeq {
    const colors = [
        PuyoColor.RED,
        PuyoColor.GREEN,
        PuyoColor.YELLOW,
        PuyoColor.BLUE,
        PuyoColor.PURPLE
    ];
    const rnd = random(seed);
    const puyos = Array.from({ length: 256 }, () => createPuyo(colors[rnd() % colors.length]));
    return Object.freeze({
        seq: shuffle(puyos, rnd)
    });
}

export function createPuyoSeq(seed: number): PuyoSeq {
    // Read the esports.txt sequence file
    const decoder = new TextDecoder('utf-8');
    const text = Deno.readTextFileSync('./src/domain/sequences/esports.txt');
    
    // Split sequence into lines, removing comments and empty lines
    const lines = text.split('\n')
        .filter(line => line.trim() !== '' && !line.trim().startsWith('//'));
    
    // Select a line based on seed
    const selectedLine = lines[seed % lines.length];
    
    // Convert characters to Puyo colors
    const colorMap: Record<string, PuyoColor> = {
        'r': PuyoColor.RED,
        'g': PuyoColor.GREEN,
        'y': PuyoColor.YELLOW,
        'b': PuyoColor.BLUE,
        'p': PuyoColor.PURPLE
    };
    
    // Create puyos from the selected sequence
    const puyos = Array.from(selectedLine)
        .map(char => {
            const color = colorMap[char.toLowerCase()];
            if (color === undefined) {
                return createPuyo(PuyoColor.RED); // Default to red for unrecognized characters
            }
            return createPuyo(color);
        });
    
    return Object.freeze({
        seq: puyos
    });
}
