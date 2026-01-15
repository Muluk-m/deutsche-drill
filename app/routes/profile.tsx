import type { Route } from "./+types/profile";
import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  Target,
  Flame,
  BookOpen,
  Star,
  CheckCircle,
  TrendingUp,
  Calendar,
  Settings,
  Percent,
  Database,
} from "lucide-react";
import {
  getLearningStats,
  getLearnedWords,
  getDailyGoal,
  setDailyGoal,
  checkGoalCompletion,
  getFavoritesCount,
  getTodayLearnedCount,
} from "../utils/storageManager";
import type { DailyGoal } from "../types/word";

export function meta({}: Route.MetaArgs) {
  return [{ title: "我的 - Deutsch Wörter" }];
}

export default function Profile() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLearned: 0,
    todayLearned: 0,
    streak: 0,
    totalReviews: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
  });
  const [goalInfo, setGoalInfo] = useState<{
    completed: boolean;
    current: number;
    target: number;
  }>({ completed: false, current: 0, target: 20 });
  const [currentGoal, setCurrentGoal] = useState<DailyGoal | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  useEffect(() => {
    // 获取学习统计
    const learningStats = getLearningStats();
    const learnedWords = getLearnedWords();
    
    setStats({
      ...learningStats,
      totalLearned: learnedWords.length,
      todayLearned: getTodayLearnedCount(),
    });

    // 获取目标信息
    setGoalInfo(checkGoalCompletion());
    setCurrentGoal(getDailyGoal());
    
    // 获取生词本数量
    setFavoritesCount(getFavoritesCount());
  }, []);

  const handleSetGoal = (target: 10 | 20 | 30 | 50) => {
    setDailyGoal(target);
    setCurrentGoal({ target, updatedAt: new Date().toISOString() });
    setGoalInfo(checkGoalCompletion());
    setShowGoalPicker(false);
  };

  const accuracy =
    stats.totalReviews > 0
      ? Math.round((stats.correctAnswers / stats.totalReviews) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            我的
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* 学习统计卡片 */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 text-white relative overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-blue-200 text-sm mb-1">学习统计</p>
                <h2 className="text-3xl font-bold">{stats.totalLearned}</h2>
                <p className="text-blue-200 text-sm">已掌握单词</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full">
                <Flame className="w-5 h-5 text-orange-300" />
                <span className="font-semibold">{stats.streak} 天</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{stats.todayLearned}</div>
                <div className="text-xs text-blue-200">今日学习</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{stats.totalReviews}</div>
                <div className="text-xs text-blue-200">总复习次数</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{accuracy}%</div>
                <div className="text-xs text-blue-200">正确率</div>
              </div>
            </div>
          </div>
        </section>

        {/* 每日目标 */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  每日目标
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {goalInfo.current} / {goalInfo.target} 个单词
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGoalPicker(!showGoalPicker)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg cursor-pointer"
            >
              {showGoalPicker ? "取消" : "修改"}
            </button>
          </div>

          {/* 进度条 */}
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                goalInfo.completed
                  ? "bg-gradient-to-r from-green-400 to-emerald-500"
                  : "bg-gradient-to-r from-blue-500 to-blue-600"
              }`}
              style={{
                width: `${Math.min(
                  (goalInfo.current / goalInfo.target) * 100,
                  100
                )}%`,
              }}
            />
          </div>

          {goalInfo.completed && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              今日目标已达成！
            </div>
          )}

          {/* 目标选择器 */}
          {showGoalPicker && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                选择每日学习目标：
              </p>
              <div className="grid grid-cols-4 gap-2">
                {([10, 20, 30, 50] as const).map((target) => (
                  <button
                    key={target}
                    onClick={() => handleSetGoal(target)}
                    className={`py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      currentGoal?.target === target
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {target}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 功能入口 */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 px-1">
            学习工具
          </h3>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* 生词本 */}
            <Link
              to="/favorites"
              className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  生词本
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {favoritesCount > 0
                    ? `${favoritesCount} 个单词`
                    : "收藏难词，重点复习"}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
            </Link>

            {/* 错题本 */}
            <Link
              to="/mistakes"
              className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  错题本
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  查看和复习错题
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
            </Link>

            {/* 学习记录 */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  学习记录
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  查看学习历史
                </p>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                即将推出
              </span>
            </div>

            {/* 设置 */}
            <Link
              to="/settings"
              className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Database className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  数据管理
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  备份、恢复、清除数据
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
            </Link>
          </div>
        </section>

        {/* 详细统计 */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 px-1">
            详细数据
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  正确答题
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.correctAnswers}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  正确率
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {accuracy}%
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  连续学习
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.streak} 天
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  总复习
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalReviews}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

