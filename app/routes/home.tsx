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
import { getDueWords, getSRSStats } from "../utils/srsAlgorithm";

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
    // 检查是否需要迁移旧数据
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

        // 获取 SRS 统计
        const srsProgress = getSRSProgress();
        const dueWords = getDueWords(srsProgress);
        setDueCount(dueWords.length);

        // 获取错题数量
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

    // 搜索匹配的单词
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
        // 获取该单元的所有单词（和 learn 页面相同的方式）
        const unitWords = words.filter((w) => (w.unitId || 1) === unitId);
        // 找到这个单词在单元内的索引
        const indexInUnit = unitWords.findIndex((w) => w.word === word.word);

        matchedWords.push({
          word,
          index: indexInUnit,
          unitId,
          globalIndex,
        });
      }
    });

    setSearchResults(matchedWords.slice(0, 20)); // 最多显示20个结果
  }, [searchQuery, words]);

  const units = createUnits(words);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🇩🇪 Deutsch Wörter
          </h1>
          <p className="text-gray-600">德语单词分单元学习系统</p>
        </header>

        {/* Search Box */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索单词或中文释义..."
              className="w-full px-4 py-3 pl-12 pr-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-gray-800 placeholder-gray-400"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Search Results */}
          {isSearching && searchResults.length > 0 && (
            <div className="mt-4 bg-white rounded-xl shadow-lg border-2 border-gray-200 max-h-96 overflow-y-auto">
              {searchResults.map(({ word, index, unitId, globalIndex }) => {
                const isLearned = learnedWords.includes(word.word);

                return (
                  <Link
                    key={globalIndex}
                    to={`/learn?unit=${unitId}&index=${index}`}
                    onClick={() => setSearchQuery("")}
                    className="block p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {isLearned ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-200 text-gray-600 rounded-full text-xs">
                            •
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800">
                            {word.word}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            单元 {unitId}
                          </span>
                          <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {word.zh_cn}
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {isSearching && searchResults.length === 0 && searchQuery.trim() && (
            <div className="mt-4 bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 text-center">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-gray-600">未找到匹配的单词</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {learnedWords.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">已学习</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {todayCount}
            </div>
            <div className="text-sm text-gray-600 mt-1">今日学习</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {words.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">词库总数</div>
          </div>
          <Link
            to="/srs-review"
            className={`bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition-shadow ${
              dueCount > 0 ? "ring-2 ring-red-500" : ""
            }`}
          >
            <div
              className={`text-3xl font-bold ${
                dueCount > 0 ? "text-red-600" : "text-gray-400"
              }`}
            >
              {dueCount}
            </div>
            <div className="text-sm text-gray-600 mt-1">待复习</div>
          </Link>
          <Link
            to="/mistakes"
            className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition-shadow"
          >
            <div
              className={`text-3xl font-bold ${
                mistakesCount > 0 ? "text-orange-600" : "text-gray-400"
              }`}
            >
              {mistakesCount}
            </div>
            <div className="text-sm text-gray-600 mt-1">错题本</div>
          </Link>
          <Link
            to="/test-modes"
            className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition-shadow"
          >
            <div className="text-3xl font-bold text-indigo-600">🎯</div>
            <div className="text-sm text-gray-600 mt-1">多种测试</div>
          </Link>
        </div>

        {/* Overall Progress */}
        {words.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg p-6 text-white mb-8">
            <h3 className="text-xl font-bold mb-4">总体进度</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-90">
                {learnedWords.length} / {words.length} 个单词
              </span>
              <span className="text-sm font-medium">
                {words.length > 0
                  ? Math.round((learnedWords.length / words.length) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    words.length > 0
                      ? (learnedWords.length / words.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Units List - 只在非搜索状态下显示 */}
        {!isSearching && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                学习单元
              </h2>
              <p className="text-sm text-gray-600">
                每个单元包含 100 个单词，选择单元后可进行学习、复习和测试
              </p>
            </div>

            <div className="grid gap-4">
              {units.map((unit) => {
                const progress = getUnitProgress(unit.id, learnedWords, words);
                const isCompleted = progress.percentage === 100;
                const isStarted = progress.percentage > 0;

                return (
                  <div
                    key={unit.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {unit.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          单词 {unit.startIndex + 1} - {unit.endIndex} · 共{" "}
                          {unit.totalWords} 个
                        </p>
                      </div>
                      <div className="text-right">
                        {isCompleted ? (
                          <span className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full text-2xl">
                            ✓
                          </span>
                        ) : isStarted ? (
                          <div className="text-2xl font-bold text-blue-600">
                            {progress.percentage}%
                          </div>
                        ) : (
                          <div className="text-2xl text-gray-400">📚</div>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>
                          已学习 {progress.learned} / {progress.total}
                        </span>
                        <span>{progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isCompleted
                              ? "bg-green-500"
                              : isStarted
                              ? "bg-blue-500"
                              : "bg-gray-300"
                          }`}
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/unit/${unit.id}`}
                        className="col-span-2 text-center bg-gray-50 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        📖 查看单词列表
                      </Link>
                      <Link
                        to={`/learn?unit=${unit.id}`}
                        className="text-center bg-blue-50 text-blue-600 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        📚 学习
                      </Link>
                      {isStarted ? (
                        <>
                          <Link
                            to={`/review?unit=${unit.id}`}
                            className="text-center bg-purple-50 text-purple-600 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                          >
                            🔄 复习
                          </Link>
                          <Link
                            to={`/random?unit=${unit.id}`}
                            className="col-span-2 text-center bg-green-50 text-green-600 py-2.5 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                          >
                            🎲 测试
                          </Link>
                        </>
                      ) : (
                        <div className="text-center bg-gray-100 text-gray-400 py-2.5 rounded-lg text-sm font-medium cursor-not-allowed">
                          🔄 复习
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
