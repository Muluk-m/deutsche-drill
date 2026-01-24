/**
 * LocalStorage 统一管理器
 * 管理所有应用数据的持久化
 */

import type { WordSRSProgress, MistakeRecord, LearningStats, TestResult, DailyGoal, FavoriteWord } from "../types/word";
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
  DAILY_GOAL: 'dailyGoal',                 // 每日学习目标
  FAVORITES: 'favorites',                   // 生词本
  SELECTED_UNITS: 'selectedUnits',         // 选中的学习单元
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

// ==================== Daily Goal ====================

/**
 * 获取每日学习目标
 */
export function getDailyGoal(): DailyGoal | null {
  try {
    const data = localStorage.getItem(KEYS.DAILY_GOAL);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading daily goal:', error);
    return null;
  }
}

/**
 * 设置每日学习目标
 */
export function setDailyGoal(target: 10 | 20 | 30 | 50): void {
  const goal: DailyGoal = {
    target,
    updatedAt: new Date().toISOString(),
  };
  
  try {
    localStorage.setItem(KEYS.DAILY_GOAL, JSON.stringify(goal));
  } catch (error) {
    console.error('Error saving daily goal:', error);
  }
}

/**
 * 检查今日目标是否达成
 */
export function checkGoalCompletion(): { completed: boolean; current: number; target: number } {
  const goal = getDailyGoal();
  const todayCount = getTodayLearnedCount();
  
  if (!goal) {
    return { completed: false, current: todayCount, target: 20 }; // 默认目标 20
  }
  
  return {
    completed: todayCount >= goal.target,
    current: todayCount,
    target: goal.target,
  };
}

// ==================== Favorites (生词本) ====================

/**
 * 获取所有生词
 */
export function getFavorites(): Record<string, FavoriteWord> {
  try {
    const data = localStorage.getItem(KEYS.FAVORITES);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading favorites:', error);
    return {};
  }
}

/**
 * 获取生词列表（按添加时间排序，最新在前）
 */
export function getFavoritesList(): FavoriteWord[] {
  const favorites = getFavorites();
  return Object.values(favorites).sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );
}

/**
 * 添加生词
 */
export function addFavorite(word: string, zh_cn: string, note?: string): void {
  const favorites = getFavorites();
  
  favorites[word] = {
    word,
    zh_cn,
    addedAt: new Date().toISOString(),
    note,
  };
  
  try {
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorite:', error);
  }
}

/**
 * 移除生词
 */
export function removeFavorite(word: string): void {
  const favorites = getFavorites();
  delete favorites[word];
  
  try {
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
}

/**
 * 检查单词是否在生词本中
 */
export function isFavorite(word: string): boolean {
  const favorites = getFavorites();
  return !!favorites[word];
}

/**
 * 更新生词备注
 */
export function updateFavoriteNote(word: string, note: string): void {
  const favorites = getFavorites();
  
  if (favorites[word]) {
    favorites[word].note = note;
    
    try {
      localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error updating favorite note:', error);
    }
  }
}

/**
 * 获取生词数量
 */
export function getFavoritesCount(): number {
  const favorites = getFavorites();
  return Object.keys(favorites).length;
}

// ==================== Selected Units ====================

/**
 * 获取选中的学习单元
 * 返回 null 表示全部单元
 */
export function getSelectedUnits(): number[] | null {
  try {
    const data = localStorage.getItem(KEYS.SELECTED_UNITS);
    if (!data) return null;
    const units = JSON.parse(data) as number[];
    return units.length > 0 ? units : null;
  } catch (error) {
    console.error('Error reading selected units:', error);
    return null;
  }
}

/**
 * 设置选中的学习单元
 * 传入 null 或空数组表示全部单元
 */
export function setSelectedUnits(units: number[] | null): void {
  try {
    if (!units || units.length === 0) {
      localStorage.removeItem(KEYS.SELECTED_UNITS);
    } else {
      localStorage.setItem(KEYS.SELECTED_UNITS, JSON.stringify(units));
    }
  } catch (error) {
    console.error('Error saving selected units:', error);
  }
}

/**
 * 切换单元选中状态
 */
export function toggleUnitSelection(unitId: number): number[] | null {
  const current = getSelectedUnits() || [];
  let newUnits: number[];
  
  if (current.includes(unitId)) {
    newUnits = current.filter(id => id !== unitId);
  } else {
    newUnits = [...current, unitId].sort((a, b) => a - b);
  }
  
  setSelectedUnits(newUnits.length > 0 ? newUnits : null);
  return newUnits.length > 0 ? newUnits : null;
}

/**
 * 检查单元是否被选中
 */
export function isUnitSelected(unitId: number): boolean {
  const selected = getSelectedUnits();
  // 如果没有选中任何单元，则视为全选
  if (!selected) return true;
  return selected.includes(unitId);
}

// ==================== Clear Data ====================

/**
 * 清除所有数据（用于测试）
 */
export function clearAllData(): void {
  Object.values(KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// ==================== Backup & Restore ====================

/**
 * 备份数据结构
 */
export interface BackupData {
  version: string;
  exportedAt: string;
  learnedWords: string[];
  srsProgress: Record<string, WordSRSProgress>;
  mistakes: Record<string, MistakeRecord>;
  favorites: Record<string, FavoriteWord>;
  learningStats: LearningStats;
  dailyGoal: DailyGoal | null;
  todayLearned: Record<string, number>;
  testResults: TestResult[];
}

/**
 * 导出所有学习数据
 */
export function exportAllData(): BackupData {
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    learnedWords: getLearnedWords(),
    srsProgress: getSRSProgress(),
    mistakes: getMistakes(),
    favorites: getFavorites(),
    learningStats: getLearningStats(),
    dailyGoal: getDailyGoal(),
    todayLearned: getTodayLearned(),
    testResults: getTestResults(),
  };
}

/**
 * 验证备份数据格式
 */
export function validateBackupData(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;
  
  const backup = data as Record<string, unknown>;
  
  // 检查必要字段
  if (typeof backup.version !== 'string') return false;
  if (typeof backup.exportedAt !== 'string') return false;
  if (!Array.isArray(backup.learnedWords)) return false;
  if (typeof backup.srsProgress !== 'object' || backup.srsProgress === null) return false;
  if (typeof backup.mistakes !== 'object' || backup.mistakes === null) return false;
  if (typeof backup.favorites !== 'object' || backup.favorites === null) return false;
  if (typeof backup.learningStats !== 'object' || backup.learningStats === null) return false;
  
  return true;
}

/**
 * 导入学习数据（会覆盖现有数据）
 */
export function importAllData(data: BackupData): { success: boolean; message: string } {
  try {
    // 验证数据格式
    if (!validateBackupData(data)) {
      return { success: false, message: '无效的备份文件格式' };
    }
    
    // 导入数据
    setLearnedWords(data.learnedWords);
    setSRSProgress(data.srsProgress);
    setMistakes(data.mistakes);
    
    // 导入生词本
    try {
      localStorage.setItem(KEYS.FAVORITES, JSON.stringify(data.favorites));
    } catch (e) {
      console.error('Error importing favorites:', e);
    }
    
    // 导入学习统计
    updateLearningStats(data.learningStats);
    
    // 导入每日目标
    if (data.dailyGoal) {
      try {
        localStorage.setItem(KEYS.DAILY_GOAL, JSON.stringify(data.dailyGoal));
      } catch (e) {
        console.error('Error importing daily goal:', e);
      }
    }
    
    // 导入今日学习数据
    if (data.todayLearned) {
      try {
        localStorage.setItem(KEYS.TODAY_LEARNED, JSON.stringify(data.todayLearned));
      } catch (e) {
        console.error('Error importing today learned:', e);
      }
    }
    
    // 导入测试结果
    if (data.testResults && Array.isArray(data.testResults)) {
      try {
        localStorage.setItem(KEYS.TEST_RESULTS, JSON.stringify(data.testResults));
      } catch (e) {
        console.error('Error importing test results:', e);
      }
    }
    
    return { 
      success: true, 
      message: `成功导入 ${data.learnedWords.length} 个已学单词` 
    };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, message: '导入数据时发生错误' };
  }
}

/**
 * 下载备份文件
 */
export function downloadBackup(): void {
  const data = exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `deutsch-words-backup-${date}.json`;
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 获取数据统计摘要
 */
export function getDataSummary(): {
  learnedCount: number;
  mistakesCount: number;
  favoritesCount: number;
  totalReviews: number;
  streak: number;
} {
  const stats = getLearningStats();
  return {
    learnedCount: getLearnedWords().length,
    mistakesCount: Object.keys(getMistakes()).length,
    favoritesCount: Object.keys(getFavorites()).length,
    totalReviews: stats.totalReviews,
    streak: stats.streak,
  };
}
