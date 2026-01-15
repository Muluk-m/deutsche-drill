import type { Route } from "./+types/home";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { createUnits, getUnitProgress } from "../utils/unitManager";
import {
  getSRSProgress,
  getMistakesList,
  needsMigration,
  migrateData,
} from "../utils/storageManager";
import { getDueWords } from "../utils/srsAlgorithm";
import {
  Search,
  X,
  CheckCircle,
  BookOpen,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { LearningDashboard } from "../components/LearningDashboard";
import { QuickActions, GrammarPractice } from "../components/QuickActions";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "德语单词练习 - Deutsch Wörter" },
    { name: "description", content: "德语单词发音、拼写练习应用" },
  ];
}

export default function Home() {
  const [words, setWords] = useState<Word[]>([]);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ word: Word; index: number; unitId: number; globalIndex: number }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);

  useEffect(() => {
    if (needsMigration()) {
      migrateData();
    }

    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setWords(data);
        const learned = JSON.parse(
          localStorage.getItem("learnedWords") || "[]"
        ) as string[];
        setLearnedWords(learned);

        const todayDate = new Date().toDateString();
        const todayLearned = JSON.parse(
          localStorage.getItem("todayLearned") || "{}"
        );
        setTodayCount(todayLearned[todayDate] || 0);

        const srsProgress = getSRSProgress();
        const dueWords = getDueWords(srsProgress);
        setDueCount(dueWords.length);

        const mistakes = getMistakesList();
        setMistakesCount(mistakes.length);
      });
  }, []);

  // 搜索功能
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
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
  }, [searchQuery, words]);

  const units = createUnits(words);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-nav">
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
        <div className="fixed inset-x-0 top-[120px] bottom-0 z-30 bg-white dark:bg-gray-900 overflow-y-auto">
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
            totalLearned={learnedWords.length}
            totalWords={words.length}
            dueCount={dueCount}
          />

          {/* Quick Actions */}
          <QuickActions />

          {/* Grammar Practice */}
          <GrammarPractice />

          {/* Units Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                学习单元
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {units.length} 个单元
              </span>
            </div>

            <div className="space-y-3">
              {units.map((unit) => {
                const progress = getUnitProgress(unit.id, learnedWords, words);
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
                      <div className="relative w-14 h-14 shrink-0">
                        <svg className="w-full h-full -rotate-90">
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-gray-200 dark:text-gray-700"
                          />
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 24}`}
                            strokeDashoffset={`${
                              2 * Math.PI * 24 * (1 - progress.percentage / 100)
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
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                              {progress.percentage}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
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
          </section>
        </main>
      )}

      {/* Bottom Navigation */}
      <BottomNav dueCount={dueCount} />
    </div>
  );
}
