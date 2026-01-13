import type { Route } from "./+types/home";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { createUnits, getUnitProgress } from "../utils/unitManager";

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

  useEffect(() => {
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
      });
  }, []);

  const units = createUnits(words.length);

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

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
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

        {/* Units List */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">学习单元</h2>
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
      </div>
    </div>
  );
}
