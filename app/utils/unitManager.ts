import type { Word } from "../types/word";

export interface Unit {
  id: number;
  name: string;
  startIndex: number;
  endIndex: number;
  totalWords: number;
}

/**
 * 根据 words 数组中的 unitId 字段动态创建单元
 */
export function createUnits(words: Word[]): Unit[] {
  const units: Unit[] = [];
  const unitMap = new Map<number, { startIndex: number; endIndex: number; count: number }>();

  // 遍历所有单词，统计每个单元的信息
  words.forEach((word, index) => {
    const unitId = word.unitId || 1; // 如果没有 unitId，默认归入单元 1
    
    if (!unitMap.has(unitId)) {
      unitMap.set(unitId, {
        startIndex: index,
        endIndex: index,
        count: 0,
      });
    }
    
    const unitInfo = unitMap.get(unitId)!;
    unitInfo.endIndex = index;
    unitInfo.count++;
  });

  // 将 Map 转换为 Unit 数组
  Array.from(unitMap.entries())
    .sort((a, b) => a[0] - b[0]) // 按单元 ID 排序
    .forEach(([unitId, info]) => {
      units.push({
        id: unitId,
        name: `单元 ${unitId}`,
        startIndex: info.startIndex,
        endIndex: info.endIndex + 1, // +1 是为了和 slice 的 endIndex 保持一致
        totalWords: info.count,
      });
    });

  return units;
}

/**
 * 获取指定单元的所有单词
 */
export function getUnitWords(words: Word[], unitId: number): Word[] {
  return words.filter((word) => (word.unitId || 1) === unitId);
}

/**
 * 根据单词索引获取单元 ID
 */
export function getWordUnit(words: Word[], wordIndex: number): number {
  if (wordIndex < 0 || wordIndex >= words.length) return 1;
  return words[wordIndex].unitId || 1;
}

/**
 * 获取指定单元的学习进度
 */
export function getUnitProgress(unitId: number, learnedWords: string[], allWords: Word[]): {
  learned: number;
  total: number;
  percentage: number;
} {
  const unitWords = getUnitWords(allWords, unitId);
  const learned = unitWords.filter((w) => learnedWords.includes(w.word)).length;
  const total = unitWords.length;
  const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;

  return { learned, total, percentage };
}

/**
 * 获取所有单元的进度
 */
export function getAllUnitsProgress(learnedWords: string[], allWords: Word[]) {
  const units = createUnits(allWords);
  return units.map((unit) => ({
    ...unit,
    progress: getUnitProgress(unit.id, learnedWords, allWords),
  }));
}

