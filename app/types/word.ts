export interface Word {
  word: string;
  zh_cn: string;
  phonetic?: string;        // IPA 音标，例如 /haʊ̯s/
  phoneticFailed?: boolean; // 音标获取失败标记
  unitId?: number;          // 所属单元 ID，例如 1, 2, 3...
  wordType?: 'noun' | 'verb' | 'adjective' | 'other'; // 单词类型
  article?: 'der' | 'die' | 'das';  // 名词冠词
  plural?: string;          // 复数后缀，如 -n, -e, ¨-er
  singularOnly?: boolean;   // 只有单数形式 (nur Sg.)
  pluralOnly?: boolean;     // 只有复数形式 (nur Pl.)
  verbConjugation?: VerbConjugation; // 动词变位数据
  exampleSentences?: string[]; // 例句（用于填空练习）
}

export interface ParsedWord {
  word: string;
  article?: string;
  plural?: string;
  forPronunciation: string;
  singularForPronunciation: string;
  pluralForPronunciation?: string;
}

// SRS (Spaced Repetition System) 相关类型
export interface WordSRSProgress {
  word: string;
  easinessFactor: number;  // SM-2: 2.5初始值，范围 1.3-2.5
  interval: number;        // 天数间隔
  repetitions: number;     // 连续正确次数
  nextReview: string;      // ISO日期字符串
  lastReview: string;      // ISO日期字符串
  quality?: number;        // 最近一次答题质量 0-5
}

// 错题记录
export interface MistakeRecord {
  word: string;
  wrongCount: number;
  lastWrongDate: string;   // ISO日期字符串
  wrongAnswers: string[];  // 记录错误输入（最多保留10个）
  zh_cn: string;           // 中文释义（用于显示）
}

// 动词变位
export interface VerbConjugation {
  infinitive: string;      // 不定式
  present: VerbPersonForms; // 现在时
  past?: VerbPersonForms;   // 过去时（可选）
  perfect?: {              // 现在完成时（可选）
    auxiliary: 'haben' | 'sein'; // 助动词
    participle: string;    // 过去分词
  };
}

// 动词人称变位
export interface VerbPersonForms {
  ich: string;
  du: string;
  er: string;   // er/sie/es
  wir: string;
  ihr: string;
  sie: string;  // sie/Sie
}

// 学习统计
export interface LearningStats {
  totalLearned: number;
  todayLearned: number;
  streak: number;          // 连续学习天数
  lastStudyDate: string;   // ISO日期字符串
  totalReviews: number;
  correctAnswers: number;
  wrongAnswers: number;
}

// 测试结果
export interface TestResult {
  mode: 'listening' | 'choice' | 'cn-to-de' | 'cloze' | 'article' | 'plural' | 'verb';
  date: string;            // ISO日期字符串
  correct: number;
  total: number;
  accuracy: number;        // 百分比
  timeSpent?: number;      // 秒数
}

// 每日学习目标
export interface DailyGoal {
  target: 10 | 20 | 30 | 50;  // 目标词数
  updatedAt: string;          // ISO日期字符串
}

// 生词本记录
export interface FavoriteWord {
  word: string;
  zh_cn: string;
  addedAt: string;            // ISO日期字符串
  note?: string;              // 用户备注
}
