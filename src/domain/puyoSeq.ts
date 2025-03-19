import { Puyo, PuyoColor, createPuyo, createRandomPuyo } from "./puyo.ts";
import { createPuyoPair } from "./puyoPair.ts";

export type PuyoSeq = Readonly<{
    seq: ReadonlyArray<Puyo>;
}>;

// 静的なシーケンスデータをキャッシュするための変数
let cachedSequences: string[] | null = null;
// シーケンスをロード中かどうかを示すフラグ
let isLoadingSequence = false;
// シーケンスロード中の待機PromiseとそのResolve関数
let loadingPromise: Promise<string[]> | null = null;

// シーケンスファイルを読み込む非同期関数
async function loadSequences(): Promise<string[]> {
    if (cachedSequences !== null) {
        return cachedSequences;
    }

    // すでにロード中なら既存のPromiseを返す
    if (isLoadingSequence && loadingPromise) {
        return loadingPromise;
    }

    // 新しくロードを開始
    isLoadingSequence = true;
    loadingPromise = (async () => {
        try {
            const response = await fetch('./src/domain/sequences/esports.txt');
            if (!response.ok) {
                throw new Error(`Failed to load sequence file: ${response.statusText}`);
            }

            const text = await response.text();

            // Split sequence into lines, removing comments and empty lines
            const lines = text.split('\n')
                .filter(line => line.trim() !== '' && !line.trim().startsWith('//'));

            cachedSequences = lines;
            return lines;
        } catch (error) {
            console.error('Error loading sequence file:', error);
            // エラーの場合はデフォルトのシーケンスを返す
            cachedSequences = ['rgbyprgbyp'];
            return cachedSequences;
        } finally {
            isLoadingSequence = false;
        }
    })();

    return loadingPromise;
}

// 非同期バージョンのcreatePuyoSeq
export async function createPuyoSeqAsync(seed: number): Promise<PuyoSeq> {
    const lines = await loadSequences();

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

export function createPuyoSeq(seed: number): PuyoSeq {
    if (!isLoadingSequence) {
        loadSequences();
    }
    // Convert characters to Puyo colors
    const colorMap: Record<string, PuyoColor> = {
        'r': PuyoColor.RED,
        'g': PuyoColor.GREEN,
        'y': PuyoColor.YELLOW,
        'b': PuyoColor.BLUE,
        'p': PuyoColor.PURPLE
    };

    if (cachedSequences === null) {
        // デフォルトのシーケンスを返す
        return {
            seq: Array.from('rgbyprgbyp').map(char => {
                return createPuyo(colorMap[char.toLowerCase()]);
            })};
    }
    
    return {
        seq: cachedSequences[seed % cachedSequences.length]
            .split('')
            .map(char => {
                const color = colorMap[char.toLowerCase()];
                if (color === undefined) {
                    return createPuyo(PuyoColor.RED); // Default to red for unrecognized characters
                }
                return createPuyo(color);
            })
    };
}
