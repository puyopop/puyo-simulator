// 連鎖ボーナスを取得する関数
export function getChainBonus(chainCount: number): number {
    if (chainCount <= 1) return 0;
    if (chainCount <= 3) return 8 * (chainCount - 1);
    return 32 * (chainCount - 3);
}

// 連結ボーナスを取得する関数
export function getConnectionBonus(connectionCount: number): number {
    if (connectionCount <= 4) return 0;
    if (connectionCount >= 11) return 10;
    return connectionCount - 3;
}

// 色数ボーナスを取得する関数
export function getColorBonus(colorCount: number): number {
    const colorBonusTable = [0, 3, 6, 12, 24];
    return colorBonusTable[colorCount - 1] || 0;
}

// 得点を計算する関数
export function calculateScore(
    chainCount: number,
    puyoCount: number,
    connectionCounts: number[],
    colorCount: number
): number {
    console.log(`chainCount: ${chainCount}, puyoCount: ${puyoCount}, connectionCounts: ${connectionCounts}, colorCount: ${colorCount}`);
    const chainBonus = getChainBonus(chainCount);
    const connectionBonus = connectionCounts.reduce((sum, count) => sum + getConnectionBonus(count), 0);
    const colorBonus = getColorBonus(colorCount);
    const totalBonus = chainBonus + connectionBonus + colorBonus;
    const ret = puyoCount * 10 * Math.max(totalBonus, 1);
    console.log(`chainBonus: ${chainBonus}, connectionBonus: ${connectionBonus}, colorBonus: ${colorBonus}, totalBonus: ${totalBonus}, score: ${ret}`);
    return ret;
}