import { Puyo, PuyoColor, createPuyo, createRandomPuyo } from "./puyo.ts";
import { createPuyoPair } from "./puyoPair.ts";
import { Result, err, ok } from "./types.ts";

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

// 共通のカラーマップ
const colorMap: Record<string, PuyoColor> = {
    'r': PuyoColor.RED,
    'g': PuyoColor.GREEN,
    'y': PuyoColor.YELLOW,
    'b': PuyoColor.BLUE,
    'p': PuyoColor.PURPLE
};

// 文字列からPuyoの配列を生成する共通関数
function createPuyosFromString(sequence: string): Puyo[] {
    return sequence.split('')
        .map(char => {
            const color = colorMap[char.toLowerCase()];
            if (color === undefined) {
                return createPuyo(PuyoColor.RED); // Default to red for unrecognized characters
            }
            return createPuyo(color);
        });
}

// 非同期バージョンのcreatePuyoSeq
export async function createPuyoSeqAsync(seed: number): Promise<Result<PuyoSeq, Error>> {
    try {
        const lines = await loadSequences();
        
        // Select a line based on seed
        const selectedLine = lines[seed % lines.length];
        
        // Create puyos from the selected sequence
        const puyos = createPuyosFromString(selectedLine);
        
        return ok(Object.freeze({
            seq: puyos
        }));
    } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
    }
}

export function createPuyoSeq(seed: number): Result<PuyoSeq, Error> {
    if (!isLoadingSequence) {
        loadSequences();
    }

    if (cachedSequences === null) {
        // シーケンスがまだロードされていない場合はエラーを返す
        return err(new Error("PuyoSeq not loaded yet. Please retry later."));
    }
    
    const selectedLine = cachedSequences[seed % cachedSequences.length];
    const puyos = createPuyosFromString(selectedLine);
    
    return ok(Object.freeze({
        seq: puyos
    }));
}

export function getPuyoFrom(seq: PuyoSeq, index: number): Puyo {
    return seq.seq[index % seq.seq.length];
}