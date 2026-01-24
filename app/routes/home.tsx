import type { Route } from "./+types/home";
import { Link } from "react-router";
import { useState, useEffect, useRef } from "react";
import type { Word } from "../types/word";
import { getUnitProgress } from "../utils/unitManager";
import { useWords } from "../contexts/WordsContext";
import {
  getSRSProgress,
  getMistakesList,
  needsMigration,
  migrateData,
  getSelectedUnits,
  getDailyGoal,
  getLearningStats,
} from "../utils/storageManager";
import { getDueWords } from "../utils/srsAlgorithm";
import {
  Search,
  X,
  CheckCircle,
  BookOpen,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { LearningDashboard } from "../components/LearningDashboard";
import { QuickActions, GrammarPractice } from "../components/QuickActions";
import { UnitSelector } from "../components/UnitSelector";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "德语单词练习 - Deutsch Wörter" },
    { name: "description", content: "德语单词发音、拼写练习应用" },
  ];
}

export default function Home() {
  // 使用全局词库 Context
  const { words, isLoading, units, unitList, filterByUnits } = useWords();
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ word: Word; index: number; unitId: number; globalIndex: number }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [selectedUnits, setSelectedUnits] = useState<number[] | null>(null);
  const [dailyGoal, setDailyGoalState] = useState(20);
  const [streakDays, setStreakDays] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<number[]>([0]); // 默认展开第一组
  const [isComposing, setIsComposing] = useState(false); // 追踪输入法组合状态
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (needsMigration()) {
      migrateData();
    }

    // 读取选中的单元
    setSelectedUnits(getSelectedUnits());

    // 读取本地存储的学习数据
    const learned = JSON.parse(
      localStorage.getItem("learnedWords") || "[]",
    ) as string[];
    setLearnedWords(learned);

    const todayDate = new Date().toDateString();
    const todayLearned = JSON.parse(
      localStorage.getItem("todayLearned") || "{}",
    );
    setTodayCount(todayLearned[todayDate] || 0);

    const srsProgress = getSRSProgress();
    const dueWordsResult = getDueWords(srsProgress);
    setDueCount(dueWordsResult.length);

    const mistakes = getMistakesList();
    setMistakesCount(mistakes.length);

    // 获取每日目标和学习统计
    const goal = getDailyGoal();
    if (goal) {
      setDailyGoalState(goal.target);
    }
    const stats = getLearningStats();
    setStreakDays(stats.streak);
  }, []);

  // 搜索功能 - 使用 debounce 延迟搜索，避免输入法中间状态干扰
  useEffect(() => {
    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // 显示搜索状态
    setIsSearching(true);

    // 如果正在使用输入法组合，不执行搜索，等待组合结束
    if (isComposing) {
      return;
    }

    // 延迟执行搜索
    searchTimeoutRef.current = setTimeout(() => {
      const query = searchQuery.toLowerCase().trim();

      const matchedWords: Array<{
        word: Word;
        index: number;
        unitId: number;
        globalIndex: number;
      }> = [];

      words.forEach((word, globalIndex) => {
        const matches =
          word.word.toLowerCase().includes(query) ||
          word.zh_cn.toLowerCase().includes(query);

        if (matches) {
          const unitId = word.unitId || 1;
          const unitWords = words.filter((w) => (w.unitId || 1) === unitId);
          const indexInUnit = unitWords.findIndex((w) => w.word === word.word);

          matchedWords.push({
            word,
            index: indexInUnit,
            unitId,
            globalIndex,
          });
        }
      });

      setSearchResults(matchedWords.slice(0, 20));
    }, 150);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, words, isComposing]);

  // 根据选中单元过滤的单词数量
  const filteredWords = filterByUnits(selectedUnits);
  const filteredLearnedCount = filteredWords.filter((w) =>
    learnedWords.includes(w.word),
  ).length;

  const handleUnitChange = (newSelected: number[] | null) => {
    setSelectedUnits(newSelected);
  };

  return (
    <div className="scroll-container bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="Deutsch Wörter Logo"
                className="w-11 h-11 rounded-xl shadow-md"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Deutsch Wörter
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  德语单词学习
                </p>
              </div>
            </div>
            {mistakesCount > 0 && (
              <Link
                to="/mistakes"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-xs font-medium cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {mistakesCount} 错题
              </Link>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="搜索单词..."
              className="w-full h-10 pl-10 pr-10 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Search Results Overlay */}
      {isSearching && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 bg-white dark:bg-gray-900 overflow-y-auto"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 132px)",
            paddingTop: "8px",
          }}
        >
          {searchResults.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {searchResults.map(({ word, index, unitId, globalIndex }) => {
                const isLearned = learnedWords.includes(word.word);
                return (
                  <Link
                    key={globalIndex}
                    to={`/learn?unit=${unitId}&index=${index}`}
                    onClick={() => setSearchQuery("")}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isLearned
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                      }`}
                    >
                      {isLearned ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <BookOpen className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {word.word}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          U{unitId}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {word.zh_cn}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">未找到相关单词</p>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      {!isSearching && (
        <main className="px-4 py-4 space-y-6">
          {/* Learning Dashboard */}
          <LearningDashboard
            todayCount={todayCount}
            totalLearned={filteredLearnedCount}
            totalWords={filteredWords.length}
            dueCount={dueCount}
            dailyGoal={dailyGoal}
            streakDays={streakDays}
          />

          {/* Unit Selector Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    学习范围
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {filteredWords.length} 个单词
                  </div>
                </div>
              </div>
              <UnitSelector units={unitList} onChange={handleUnitChange} />
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Grammar Practice */}
          <GrammarPractice />

          {/* Units Section - 可折叠分组 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                学习单元
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {units.length} 个单元
              </span>
            </div>

            <div className="space-y-4">
              {/* 按5个单元分组 */}
              {Array.from(
                { length: Math.ceil(units.length / 5) },
                (_, groupIndex) => {
                  const groupUnits = units.slice(
                    groupIndex * 5,
                    (groupIndex + 1) * 5,
                  );
                  const isExpanded = expandedGroups.includes(groupIndex);
                  const groupStart = groupIndex * 5 + 1;
                  const groupEnd = Math.min((groupIndex + 1) * 5, units.length);

                  // 计算组进度
                  const groupProgress =
                    groupUnits.reduce((acc, unit) => {
                      const p = getUnitProgress(unit.id, learnedWords, words);
                      return acc + p.percentage;
                    }, 0) / groupUnits.length;

                  return (
                    <div key={groupIndex} className="space-y-2">
                      {/* 组标题 - 可点击展开/折叠 */}
                      <button
                        onClick={() => {
                          setExpandedGroups((prev) =>
                            prev.includes(groupIndex)
                              ? prev.filter((g) => g !== groupIndex)
                              : [...prev, groupIndex],
                          );
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            className={`w-5 h-5 text-gray-500 transition-transform ${
                              isExpanded ? "rotate-0" : "-rotate-90"
                            }`}
                          />
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            单元 {groupStart}-{groupEnd}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                groupProgress === 100
                                  ? "bg-green-500"
                                  : groupProgress > 0
                                    ? "bg-blue-500"
                                    : "bg-gray-300 dark:bg-gray-600"
                              }`}
                              style={{ width: `${groupProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                            {Math.round(groupProgress)}%
                          </span>
                        </div>
                      </button>

                      {/* 单元列表 */}
                      {isExpanded && (
                        <div className="space-y-2 pl-2">
                          {groupUnits.map((unit) => {
                            const progress = getUnitProgress(
                              unit.id,
                              learnedWords,
                              words,
                            );
                            const isCompleted = progress.percentage === 100;
                            const isStarted = progress.percentage > 0;

                            return (
                              <Link
                                key={unit.id}
                                to={`/unit/${unit.id}`}
                                className="block bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-4">
                                  {/* Progress Ring */}
                                  <div className="relative w-12 h-12 shrink-0">
                                    <svg className="w-full h-full -rotate-90">
                                      <circle
                                        cx="24"
                                        cy="24"
                                        r="20"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        fill="none"
                                        className="text-gray-200 dark:text-gray-700"
                                      />
                                      <circle
                                        cx="24"
                                        cy="24"
                                        r="20"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 20}`}
                                        strokeDashoffset={`${
                                          2 *
                                          Math.PI *
                                          20 *
                                          (1 - progress.percentage / 100)
                                        }`}
                                        strokeLinecap="round"
                                        className={`${
                                          isCompleted
                                            ? "text-green-500"
                                            : isStarted
                                              ? "text-blue-500"
                                              : "text-gray-300 dark:text-gray-600"
                                        } transition-all duration-500`}
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      {isCompleted ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                      ) : (
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                          {progress.percentage}%
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                        {unit.name}
                                      </h4>
                                      {isCompleted && (
                                        <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded font-medium">
                                          完成
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {progress.learned}/{progress.total} 个单词
                                    </p>
                                  </div>

                                  <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </section>
        </main>
      )}

      {/* Bottom Navigation */}
      <BottomNav dueCount={dueCount} />
    </div>
  );
}
