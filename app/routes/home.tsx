import type { Route } from "./+types/home";
import { Link } from "react-router";
import { useState, useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "德语单词练习 - Deutsch Wörter" },
    { name: "description", content: "德语单词发音、拼写练习应用" },
  ];
}

export default function Home() {
  const [stats, setStats] = useState({
    learned: 0,
    total: 0,
    todayCount: 0,
  });

  useEffect(() => {
    // 从 localStorage 加载统计数据
    const learnedWords = JSON.parse(
      localStorage.getItem("learnedWords") || "[]"
    );
    const todayDate = new Date().toDateString();
    const todayLearned = JSON.parse(
      localStorage.getItem("todayLearned") || "{}"
    );

    setStats({
      learned: learnedWords.length,
      total: 2060, // words.json 中的单词总数
      todayCount: todayLearned[todayDate] || 0,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🇩🇪 Deutsch Wörter
          </h1>
          <p className="text-gray-600">德语单词练习助手</p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {stats.learned}
            </div>
            <div className="text-sm text-gray-600 mt-1">已学习</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {stats.todayCount}
            </div>
            <div className="text-sm text-gray-600 mt-1">今日学习</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 mt-1">词库总数</div>
          </div>
        </div>

        {/* Learning Modes */}
        <div className="space-y-4">
          <Link
            to="/learn"
            className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border-2 border-transparent hover:border-blue-400"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  📚
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">顺序学习</h3>
                  <p className="text-sm text-gray-600">
                    按顺序学习新单词，支持发音和拼写
                  </p>
                </div>
              </div>
              <svg
                className="w-6 h-6 text-gray-400"
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

          <Link
            to="/review"
            className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border-2 border-transparent hover:border-purple-400"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                  🔄
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">复习模式</h3>
                  <p className="text-sm text-gray-600">
                    复习已学过的单词，巩固记忆
                  </p>
                </div>
              </div>
              <svg
                className="w-6 h-6 text-gray-400"
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

          <Link
            to="/random"
            className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border-2 border-transparent hover:border-green-400"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                  🎲
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">随机抽查</h3>
                  <p className="text-sm text-gray-600">随机抽取单词进行测试</p>
                </div>
              </div>
              <svg
                className="w-6 h-6 text-gray-400"
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
        </div>

        {/* Progress Bar */}
        {stats.total > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                学习进度
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round((stats.learned / stats.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(stats.learned / stats.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
