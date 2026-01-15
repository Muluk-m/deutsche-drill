/**
 * 应用初始化工具
 * 在首次加载时执行数据迁移和初始化
 */

import { needsMigration, migrateData } from "./storageManager";

/**
 * 初始化应用数据
 * 应该在应用启动时调用一次
 */
export function initializeApp(): void {
  // 检查并执行数据迁移
  if (needsMigration()) {
    console.log('[App Init] Migrating legacy data to SRS format...');
    const success = migrateData();
    if (success) {
      console.log('[App Init] Data migration completed successfully');
    } else {
      console.warn('[App Init] Data migration failed or no data to migrate');
    }
  }
  
  // 清理过期的今日学习记录（保留最近30天）
  cleanupOldDailyRecords();
  
  console.log('[App Init] Application initialized');
}

/**
 * 清理旧的每日学习记录
 */
function cleanupOldDailyRecords(): void {
  try {
    const todayLearned = localStorage.getItem('todayLearned');
    if (!todayLearned) return;

    const records = JSON.parse(todayLearned) as Record<string, number>;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const cleaned: Record<string, number> = {};
    let removedCount = 0;

    Object.entries(records).forEach(([dateStr, count]) => {
      const recordDate = new Date(dateStr);
      if (recordDate >= thirtyDaysAgo) {
        cleaned[dateStr] = count;
      } else {
        removedCount++;
      }
    });

    if (removedCount > 0) {
      localStorage.setItem('todayLearned', JSON.stringify(cleaned));
      console.log(`[App Init] Cleaned up ${removedCount} old daily records`);
    }
  } catch (error) {
    console.error('[App Init] Error cleaning up old records:', error);
  }
}

/**
 * 获取应用统计信息（用于调试）
 */
export function getAppStats(): {
  srsWords: number;
  mistakes: number;
  learnedWords: number;
  todayLearned: number;
  hasMigrated: boolean;
} {
  try {
    const srsProgress = localStorage.getItem('srsProgress');
    const mistakes = localStorage.getItem('mistakes');
    const learnedWords = localStorage.getItem('learnedWords');
    const todayLearned = localStorage.getItem('todayLearned');
    const migrated = localStorage.getItem('dataMigrated');

    const today = new Date().toDateString();
    const todayCount = todayLearned
      ? (JSON.parse(todayLearned)[today] || 0)
      : 0;

    return {
      srsWords: srsProgress ? Object.keys(JSON.parse(srsProgress)).length : 0,
      mistakes: mistakes ? Object.keys(JSON.parse(mistakes)).length : 0,
      learnedWords: learnedWords ? JSON.parse(learnedWords).length : 0,
      todayLearned: todayCount,
      hasMigrated: !!migrated,
    };
  } catch (error) {
    console.error('[App Stats] Error getting stats:', error);
    return {
      srsWords: 0,
      mistakes: 0,
      learnedWords: 0,
      todayLearned: 0,
      hasMigrated: false,
    };
  }
}


