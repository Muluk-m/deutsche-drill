import type { Route } from "./+types/mistakes";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import type { MistakeRecord } from "../types/word";
import { PageContainer } from "../components/PageContainer";
import { BackButton } from "../components/BackButton";
import { getMistakesList, removeMistake } from "../utils/storageManager";

export function meta({}: Route.MetaArgs) {
  return [{ title: "错题本 - Deutsch Wörter" }];
}

export default function Mistakes() {
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'frequent'>('all');

  useEffect(() => {
    loadMistakes();
  }, []);

  const loadMistakes = () => {
    const allMistakes = getMistakesList();
    setMistakes(allMistakes);
  };

  const handleRemove = (word: string) => {
    if (confirm(`确定要从错题本中移除「${word}」吗？`)) {
      removeMistake(word);
      loadMistakes();
    }
  };

  const filteredMistakes = filter === 'frequent'
    ? mistakes.filter(m => m.wrongCount >= 3)
    : mistakes;

  if (mistakes.length === 0) {
    return (
      <PageContainer>
        <BackButton />
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            错题本是空的
          </h2>
          <p className="text-gray-600 mb-6">
            你还没有答错过任何单词，继续保持！
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton />

      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">错题本</h1>
        <p className="text-gray-600">
          总共 {mistakes.length} 个易错单词
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {mistakes.length}
          </div>
          <div className="text-sm text-gray-600">错题总数</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {mistakes.filter(m => m.wrongCount >= 3).length}
          </div>
          <div className="text-sm text-gray-600">高频错误</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.max(...mistakes.map(m => m.wrongCount), 0)}
          </div>
          <div className="text-sm text-gray-600">最多错误</div>
        </div>
      </div>

      {/* 筛选按钮 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部 ({mistakes.length})
        </button>
        <button
          onClick={() => setFilter('frequent')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'frequent'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          高频错误 ({mistakes.filter(m => m.wrongCount >= 3).length})
        </button>
      </div>

      {/* 错题列表 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="space-y-4">
          {filteredMistakes.map((mistake) => (
            <div
              key={mistake.word}
              className="border-2 border-red-100 rounded-xl p-4 hover:border-red-200 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      {mistake.word}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      mistake.wrongCount >= 5
                        ? 'bg-red-100 text-red-700'
                        : mistake.wrongCount >= 3
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      错误 {mistake.wrongCount} 次
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{mistake.zh_cn}</p>
                  
                  {/* 错误答案历史 */}
                  {mistake.wrongAnswers.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-500 mb-2">常见错误：</div>
                      <div className="flex flex-wrap gap-2">
                        {mistake.wrongAnswers.slice(0, 5).map((wrongAnswer, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-mono"
                          >
                            {wrongAnswer || '(空)'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-2">
                    最后错误时间: {new Date(mistake.lastWrongDate).toLocaleDateString('zh-CN')}
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(mistake.word)}
                  className="ml-4 text-gray-400 hover:text-red-600 transition-colors"
                  title="从错题本移除"
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Link
          to="/test-modes?source=mistakes"
          className="flex-1 text-center bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
        >
          🎯 专项练习错题
        </Link>
        <Link
          to="/"
          className="flex-1 text-center bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </PageContainer>
  );
}

