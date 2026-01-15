/**
 * SM-2 (SuperMemo 2) 算法实现
 * 用于计算间隔重复学习的最佳复习时间
 * 
 * 算法参考：https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

import type { WordSRSProgress } from "../types/word";

/**
 * 初始化单词的 SRS 进度
 */
export function initializeSRSProgress(word: string): WordSRSProgress {
  return {
    word,
    easinessFactor: 2.5,  // 初始难度系数
    interval: 0,          // 首次学习间隔为0
    repetitions: 0,       // 重复次数
    nextReview: new Date().toISOString(),
    lastReview: new Date().toISOString(),
    quality: undefined,
  };
}

/**
 * 根据答题质量更新 SRS 进度
 * @param progress 当前进度
 * @param quality 答题质量 (0-5):
 *   0 - Again (完全不记得)
 *   1 - Hard (很难想起来)
 *   2 - Hard (有点难)
 *   3 - Good (想起来了，有点犹豫)
 *   4 - Good (想起来了)
 *   5 - Easy (很容易)
 * @returns 更新后的进度
 */
export function updateSRSProgress(
  progress: WordSRSProgress,
  quality: number
): WordSRSProgress {
  // 质量值必须在 0-5 之间
  quality = Math.max(0, Math.min(5, quality));

  const now = new Date();
  let newEF = progress.easinessFactor;
  let newInterval = progress.interval;
  let newRepetitions = progress.repetitions;

  // 计算新的 Easiness Factor (EF)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEF = newEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // EF 不能低于 1.3
  if (newEF < 1.3) {
    newEF = 1.3;
  }

  // 根据质量更新间隔和重复次数
  if (quality < 3) {
    // 答错了，重置重复次数，间隔设为1天
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // 答对了
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      // interval(n) = interval(n-1) * EF
      newInterval = Math.round(newInterval * newEF);
    }
    newRepetitions++;
  }

  // 计算下次复习时间
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    word: progress.word,
    easinessFactor: newEF,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview: nextReviewDate.toISOString(),
    lastReview: now.toISOString(),
    quality,
  };
}

/**
 * 检查单词是否到期需要复习
 */
export function isDue(progress: WordSRSProgress): boolean {
  const now = new Date();
  const nextReview = new Date(progress.nextReview);
  return now >= nextReview;
}

/**
 * 获取到期的单词列表
 */
export function getDueWords(
  allProgress: Record<string, WordSRSProgress>
): WordSRSProgress[] {
  return Object.values(allProgress)
    .filter(isDue)
    .sort((a, b) => {
      // 按到期时间排序，越早到期的越靠前
      return new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime();
    });
}

/**
 * 获取未来几天内到期的单词数量
 */
export function getUpcomingDueCount(
  allProgress: Record<string, WordSRSProgress>,
  days: number
): number {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + days);

  return Object.values(allProgress).filter(progress => {
    const nextReview = new Date(progress.nextReview);
    return nextReview >= now && nextReview <= futureDate;
  }).length;
}

/**
 * 获取 SRS 统计信息
 */
export function getSRSStats(allProgress: Record<string, WordSRSProgress>): {
  total: number;
  dueToday: number;
  dueThisWeek: number;
  mature: number;  // 成熟卡片 (interval >= 21天)
  young: number;   // 年轻卡片 (interval < 21天)
  learning: number; // 学习中 (repetitions < 2)
} {
  const progressList = Object.values(allProgress);
  const dueToday = getDueWords(allProgress).length;
  const dueThisWeek = getUpcomingDueCount(allProgress, 7);

  let mature = 0;
  let young = 0;
  let learning = 0;

  progressList.forEach(progress => {
    if (progress.repetitions < 2) {
      learning++;
    } else if (progress.interval >= 21) {
      mature++;
    } else {
      young++;
    }
  });

  return {
    total: progressList.length,
    dueToday,
    dueThisWeek,
    mature,
    young,
    learning,
  };
}

/**
 * 将旧的学习记录迁移到 SRS 格式
 * @param learnedWords 已学习的单词列表
 * @returns SRS 进度记录
 */
export function migrateLegacyData(learnedWords: string[]): Record<string, WordSRSProgress> {
  const srsProgress: Record<string, WordSRSProgress> = {};
  
  learnedWords.forEach(word => {
    // 为已学习的单词创建初始 SRS 记录
    // 设置为已经复习过一次，下次1天后复习
    const progress = initializeSRSProgress(word);
    progress.repetitions = 1;
    progress.interval = 1;
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 1);
    progress.nextReview = nextReview.toISOString();
    
    srsProgress[word] = progress;
  });
  
  return srsProgress;
}

/**
 * 格式化下次复习时间为人类可读的格式
 */
export function formatNextReview(nextReview: string): string {
  const now = new Date();
  const reviewDate = new Date(nextReview);
  const diffMs = reviewDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return '需要复习';
  } else if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '明天';
  } else if (diffDays < 7) {
    return `${diffDays}天后`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}周后`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}个月后`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years}年后`;
  }
}


