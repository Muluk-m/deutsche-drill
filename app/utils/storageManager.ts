/**
 * LocalStorage 统一管理器
 * 管理所有应用数据的持久化
 */

import type { WordSRSProgress, MistakeRecord, LearningStats, TestResult } from "../types/word";
import { migrateLegacyData } from "./srsAlgorithm";

// LocalStorage keys
const KEYS = {
  LEARNED_WORDS: 'learnedWords',           // 旧版已学习单词列表
  SRS_PROGRESS: 'srsProgress',             // SRS 进度数据
  MISTAKES: 'mistakes',                     // 错题记录
  TODAY_LEARNED: 'todayLearned',           // 今日学习数量
  LEARNING_STATS: 'learningStats',         // 学习统计
  TEST_RESULTS: 'testResults',             // 测试结果历史
  GRAMMAR_STATS: 'grammarStats',           // 语法练习统计
  MIGRATED: 'dataMigrated',                // 数据迁移标记
};

// ==================== SRS Progress ====================

/**
 * 获取所有 SRS 进度
 */
export function getSRSProgress(): Record<string, WordSRSProgress> {
  try {
    const data = localStorage.getItem(KEYS.SRS_PROGRESS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading SRS progress:', error);
    return {};
  }
}

/**
 * 保存 SRS 进度
 */
export function setSRSProgress(progress: Record<string, WordSRSProgress>): void {
  try {
    localStorage.setItem(KEYS.SRS_PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving SRS progress:', error);
  }
}

/**
 * 更新单个单词的 SRS 进度
 */
export function updateWordSRSProgress(wordProgress: WordSRSProgress): void {
  const allProgress = getSRSProgress();
  allProgress[wordProgress.word] = wordProgress;
  setSRSProgress(allProgress);
}

/**
 * 获取单个单词的 SRS 进度
 */
export function getWordSRSProgress(word: string): WordSRSProgress | null {
  const allProgress = getSRSProgress();
  return allProgress[word] || null;
}

// ==================== Mistakes ====================

/**
 * 获取所有错题记录
 */
export function getMistakes(): Record<string, MistakeRecord> {
  try {
    const data = localStorage.getItem(KEYS.MISTAKES);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading mistakes:', error);
    return {};
  }
}

/**
 * 保存错题记录
 */
export function setMistakes(mistakes: Record<string, MistakeRecord>): void {
  try {
    localStorage.setItem(KEYS.MISTAKES, JSON.stringify(mistakes));
  } catch (error) {
    console.error('Error saving mistakes:', error);
  }
}

/**
 * 添加错题记录
 */
export function addMistake(word: string, wrongAnswer: string, zh_cn: string): void {
  const mistakes = getMistakes();
  
  if (!mistakes[word]) {
    mistakes[word] = {
      word,
      wrongCount: 0,
      lastWrongDate: new Date().toISOString(),
      wrongAnswers: [],
      zh_cn,
    };
  }
  
  const mistake = mistakes[word];
  mistake.wrongCount++;
  mistake.lastWrongDate = new Date().toISOString();
  
  // 只保留最近10个错误答案
  mistake.wrongAnswers.unshift(wrongAnswer);
  if (mistake.wrongAnswers.length > 10) {
    mistake.wrongAnswers = mistake.wrongAnswers.slice(0, 10);
  }
  
  setMistakes(mistakes);
}

/**
 * 删除错题记录
 */
export function removeMistake(word: string): void {
  const mistakes = getMistakes();
  delete mistakes[word];
  setMistakes(mistakes);
}

/**
 * 获取错题列表（按错误次数排序）
 */
export function getMistakesList(): MistakeRecord[] {
  const mistakes = getMistakes();
  return Object.values(mistakes).sort((a, b) => b.wrongCount - a.wrongCount);
}

// ==================== Learned Words (Legacy) ====================

/**
 * 获取已学习单词列表（旧版格式）
 */
export function getLearnedWords(): string[] {
  try {
    const data = localStorage.getItem(KEYS.LEARNED_WORDS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading learned words:', error);
    return [];
  }
}

/**
 * 保存已学习单词列表（旧版格式）
 */
export function setLearnedWords(words: string[]): void {
  try {
    localStorage.setItem(KEYS.LEARNED_WORDS, JSON.stringify(words));
  } catch (error) {
    console.error('Error saving learned words:', error);
  }
}

/**
 * 添加已学习单词
 */
export function addLearnedWord(word: string): void {
  const learned = getLearnedWords();
  if (!learned.includes(word)) {
    learned.push(word);
    setLearnedWords(learned);
  }
}

// ==================== Today's Learning ====================

/**
 * 获取今日学习数据
 */
export function getTodayLearned(): Record<string, number> {
  try {
    const data = localStorage.getItem(KEYS.TODAY_LEARNED);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading today learned:', error);
    return {};
  }
}

/**
 * 增加今日学习计数
 */
export function incrementTodayLearned(): void {
  const todayDate = new Date().toDateString();
  const todayLearned = getTodayLearned();
  todayLearned[todayDate] = (todayLearned[todayDate] || 0) + 1;
  
  try {
    localStorage.setItem(KEYS.TODAY_LEARNED, JSON.stringify(todayLearned));
  } catch (error) {
    console.error('Error saving today learned:', error);
  }
}

/**
 * 获取今日学习数量
 */
export function getTodayLearnedCount(): number {
  const todayDate = new Date().toDateString();
  const todayLearned = getTodayLearned();
  return todayLearned[todayDate] || 0;
}

// ==================== Learning Stats ====================

/**
 * 获取学习统计
 */
export function getLearningStats(): LearningStats {
  try {
    const data = localStorage.getItem(KEYS.LEARNING_STATS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading learning stats:', error);
  }
  
  // 默认统计
  return {
    totalLearned: 0,
    todayLearned: 0,
    streak: 0,
    lastStudyDate: '',
    totalReviews: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
  };
}

/**
 * 更新学习统计
 */
export function updateLearningStats(stats: Partial<LearningStats>): void {
  const current = getLearningStats();
  const updated = { ...current, ...stats };
  
  try {
    localStorage.setItem(KEYS.LEARNING_STATS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving learning stats:', error);
  }
}

/**
 * 记录一次学习活动
 */
export function recordStudySession(correct: boolean): void {
  const stats = getLearningStats();
  const today = new Date().toDateString();
  
  // 更新连续学习天数
  if (stats.lastStudyDate !== today) {
    const lastDate = new Date(stats.lastStudyDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      stats.streak++;
    } else if (diffDays > 1) {
      stats.streak = 1;
    }
    
    stats.lastStudyDate = today;
  }
  
  // 更新统计
  stats.totalReviews++;
  if (correct) {
    stats.correctAnswers++;
  } else {
    stats.wrongAnswers++;
  }
  
  updateLearningStats(stats);
}

// ==================== Test Results ====================

/**
 * 获取测试结果历史
 */
export function getTestResults(): TestResult[] {
  try {
    const data = localStorage.getItem(KEYS.TEST_RESULTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading test results:', error);
    return [];
  }
}

/**
 * 保存测试结果
 */
export function saveTestResult(result: TestResult): void {
  const results = getTestResults();
  results.unshift(result);
  
  // 只保留最近100条记录
  if (results.length > 100) {
    results.splice(100);
  }
  
  try {
    localStorage.setItem(KEYS.TEST_RESULTS, JSON.stringify(results));
  } catch (error) {
    console.error('Error saving test result:', error);
  }
}

// ==================== Data Migration ====================

/**
 * 检查是否需要数据迁移
 */
export function needsMigration(): boolean {
  const migrated = localStorage.getItem(KEYS.MIGRATED);
  return !migrated && getLearnedWords().length > 0 && Object.keys(getSRSProgress()).length === 0;
}

/**
 * 执行数据迁移
 */
export function migrateData(): boolean {
  try {
    const learnedWords = getLearnedWords();
    if (learnedWords.length === 0) {
      return false;
    }
    
    const srsProgress = migrateLegacyData(learnedWords);
    setSRSProgress(srsProgress);
    
    // 标记为已迁移
    localStorage.setItem(KEYS.MIGRATED, 'true');
    
    console.log(`Data migration completed: ${learnedWords.length} words migrated to SRS`);
    return true;
  } catch (error) {
    console.error('Error during data migration:', error);
    return false;
  }
}

/**
 * 清除所有数据（用于测试）
 */
export function clearAllData(): void {
  Object.values(KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

