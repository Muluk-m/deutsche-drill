import type { Route } from "./+types/unit.$id";
import { Link, useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { getUnitWords, getUnitProgress } from "../utils/unitManager";
import { buildPluralForm } from "../utils/wordParser";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RefreshCw,
  Target,
  CheckCircle,
  Trophy,
} from "lucide-react";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `单元 ${params.id} - Deutsch Wörter` }];
}

export default function UnitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const unitId = parseInt(id || "1");

  const [allWords, setAllWords] = useState<Word[]>([]);
  const [unitWords, setUnitWords] = useState<Word[]>([]);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setAllWords(data);
        const words = getUnitWords(data, unitId);
        setUnitWords(words);

        const learned = JSON.parse(
          localStorage.getItem("learnedWords") || "[]"
        ) as string[];
        setLearnedWords(learned);
      });
  }, [unitId]);

  const progress =
    allWords.length > 0
      ? getUnitProgress(unitId, learnedWords, allWords)
      : { learned: 0, total: 0, percentage: 0 };
  const isCompleted = progress.percentage === 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            单元 {unitId}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-4 pb-24">
        {/* Progress Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-200 text-sm">学习进度</p>
              <h2 className="text-3xl font-bold">{progress.percentage}%</h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">
                {progress.learned} / {progress.total}
              </p>
              <p className="text-xs text-blue-300">已学习</p>
            </div>
          </div>

          <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Link
              to={`/learn?unit=${unitId}`}
              className="flex flex-col items-center gap-1 py-3 bg-white/20 rounded-xl text-center hover:bg-white/30 transition-colors cursor-pointer"
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs font-medium">学习</span>
            </Link>
            <Link
              to={`/review?unit=${unitId}`}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl text-center transition-colors cursor-pointer ${
                progress.learned > 0
                  ? "bg-white/20 hover:bg-white/30"
                  : "bg-white/10 opacity-50 pointer-events-none"
              }`}
            >
              <RefreshCw className="w-5 h-5" />
              <span className="text-xs font-medium">复习</span>
            </Link>
            <Link
              to={`/test-modes?unit=${unitId}`}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl text-center transition-colors cursor-pointer ${
                progress.learned > 0
                  ? "bg-white/20 hover:bg-white/30"
                  : "bg-white/10 opacity-50 pointer-events-none"
              }`}
            >
              <Target className="w-5 h-5" />
              <span className="text-xs font-medium">测试</span>
            </Link>
          </div>
        </div>

        {/* Completion Badge */}
        {isCompleted && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-green-700 dark:text-green-400">
                单元完成！
              </h3>
              <p className="text-sm text-green-600 dark:text-green-500">
                你已掌握所有单词
              </p>
            </div>
          </div>
        )}

        {/* Word List */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 px-1 mb-3">
            单词列表
          </h2>

          {unitWords.map((word, unitIndex) => {
            const isLearned = learnedWords.includes(word.word);
            // 使用 Word 对象上的新字段
            const pluralForm =
              word.plural && word.plural !== "-" && !word.singularOnly
                ? buildPluralForm(word.word, word.plural)
                : null;

            return (
              <Link
                key={unitIndex}
                to={`/learn?unit=${unitId}&index=${unitIndex}`}
                className={`block p-4 rounded-xl transition-all cursor-pointer ${
                  isLearned
                    ? "bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
                    : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isLearned
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {isLearned ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-medium">
                        {unitIndex + 1}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {word.article && (
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            word.article === "der"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : word.article === "die"
                              ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400"
                              : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                          }`}
                        >
                          {word.article}
                        </span>
                      )}
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {word.word}
                      </span>
                    </div>

                    {pluralForm && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        复数: {pluralForm}
                      </p>
                    )}

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {word.zh_cn}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
