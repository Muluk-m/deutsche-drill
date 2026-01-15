import type { Route } from "./+types/practice-articles";
import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { recordStudySession, saveTestResult } from "../utils/storageManager";
import {
  ChevronLeft,
  ChevronRight,
  Tags,
  Trophy,
  Home,
  RotateCcw,
  Lightbulb,
  CheckCircle,
  XCircle
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "冠词练习 - Deutsch Wörter" }];
}

const articles = ["der", "die", "das"];

export default function PracticeArticles() {
  const navigate = useNavigate();
  const [nounWords, setNounWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [stats, setStats] = useState({
    der: { correct: 0, total: 0 },
    die: { correct: 0, total: 0 },
    das: { correct: 0, total: 0 },
  });
  const [startTime] = useState(Date.now());

  const currentWord = nounWords[currentIndex];

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        // 直接使用 Word 对象上的 article 字段
        const nouns = data.filter((w) => w.article && ["der", "die", "das"].includes(w.article));
        const shuffled = [...nouns].sort(() => Math.random() - 0.5);
        setNounWords(shuffled.slice(0, 50));
      });
  }, []);

  const handleSelectArticle = (article: string) => {
    if (!currentWord || selectedArticle !== null) return;
    setSelectedArticle(article);
    const correct = article === currentWord.article;
    setIsCorrect(correct);

    if (correct) {
      setScore({ correct: score.correct + 1, total: score.total + 1 });
    } else {
      setScore({ correct: score.correct, total: score.total + 1 });
    }

    const newStats = { ...stats };
    if (currentWord.article === "der" || currentWord.article === "die" || currentWord.article === "das") {
      newStats[currentWord.article].total++;
      if (correct) newStats[currentWord.article].correct++;
    }
    setStats(newStats);
    recordStudySession(correct);
  };

  const handleNext = () => {
    if (currentIndex < nounWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedArticle(null);
      setIsCorrect(null);
    } else {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      saveTestResult({
        mode: "article",
        date: new Date().toISOString(),
        correct: score.correct + (isCorrect ? 1 : 0),
        total: score.total + 1,
        accuracy: ((score.correct + (isCorrect ? 1 : 0)) / (score.total + 1)) * 100,
        timeSpent,
      });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const progress = nounWords.length > 0 ? ((currentIndex + 1) / nounWords.length) * 100 : 0;

  // Completion State
  if (currentIndex >= nounWords.length && nounWords.length > 0) {
    const accuracy = Math.round((score.correct / score.total) * 100);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="p-2 -ml-2 text-gray-500 cursor-pointer">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">练习完成</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
            accuracy >= 90 ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
            accuracy >= 70 ? "bg-gradient-to-br from-indigo-400 to-purple-500" :
            "bg-gradient-to-br from-orange-400 to-red-500"
          }`}>
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {accuracy >= 90 ? "太棒了！" : accuracy >= 70 ? "不错！" : "继续加油！"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">冠词掌握得更好了</p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{score.correct}</div>
              <div className="text-xs text-gray-500 mt-1">正确</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{score.total - score.correct}</div>
              <div className="text-xs text-gray-500 mt-1">错误</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
              <div className="text-xs text-gray-500 mt-1">正确率</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{minutes}:{seconds.toString().padStart(2, "0")}</div>
              <div className="text-xs text-gray-500 mt-1">用时</div>
            </div>
          </div>

          {/* Article Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 w-full max-w-xs mb-8">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">各冠词正确率</p>
            <div className="space-y-3">
              {(["der", "die", "das"] as const).map((article) => {
                const s = stats[article];
                const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                return (
                  <div key={article} className="flex items-center gap-3">
                    <span className={`w-10 font-bold text-sm ${
                      article === "der" ? "text-blue-600" :
                      article === "die" ? "text-pink-600" :
                      "text-purple-600"
                    }`}>{article}</span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        article === "der" ? "bg-blue-500" :
                        article === "die" ? "bg-pink-500" :
                        "bg-purple-500"
                      }`} style={{ width: `${acc}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right">{s.correct}/{s.total}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-semibold cursor-pointer">
              <RotateCcw className="w-5 h-5" />
              再练一次
            </button>
            <Link to="/" className="flex items-center justify-center gap-2 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-medium cursor-pointer">
              <Home className="w-5 h-5" />
              返回首页
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Loading State
  if (!currentWord) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">准备中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 cursor-pointer">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {currentIndex + 1} / {nounWords.length}
            </div>
            {score.total > 0 && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                (score.correct / score.total) >= 0.8 ? "bg-green-100 text-green-600" :
                (score.correct / score.total) >= 0.6 ? "bg-orange-100 text-orange-600" :
                "bg-red-100 text-red-600"
              }`}>
                {Math.round((score.correct / score.total) * 100)}%
              </div>
            )}
            {score.total === 0 && <div className="w-10" />}
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 py-6">
        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tags className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">选择正确的冠词</h2>

          {/* Word */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 mb-6">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-2">请为这个名词选择正确的冠词：</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{currentWord.word}</p>
            <p className="text-gray-600 dark:text-gray-400">{currentWord.zh_cn}</p>
          </div>

          {/* Article Options */}
          {selectedArticle === null ? (
            <div className="grid grid-cols-3 gap-3">
              {articles.map((article) => (
                <button
                  key={article}
                  onClick={() => handleSelectArticle(article)}
                  className={`py-5 rounded-xl border-2 font-bold text-2xl transition-all active:scale-95 cursor-pointer ${
                    article === "der"
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                      : article === "die"
                      ? "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400"
                      : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400"
                  }`}
                >
                  {article}
                </button>
              ))}
            </div>
          ) : (
            <div className={`p-4 rounded-2xl ${
              isCorrect ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}>
              <div className="flex items-center justify-center gap-2 mb-3">
                {isCorrect ? <CheckCircle className="w-8 h-8 text-green-500" /> : <XCircle className="w-8 h-8 text-red-500" />}
                <span className={`text-xl font-bold ${isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                  {isCorrect ? "正确！" : "错误"}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                正确答案：
                <span className={`font-bold text-2xl ml-2 ${
                  currentWord.article === "der" ? "text-blue-600" :
                  currentWord.article === "die" ? "text-pink-600" :
                  "text-purple-600"
                }`}>{currentWord.article}</span>
                <span className="ml-2 text-2xl font-semibold">{currentWord.word}</span>
              </p>
              {!isCorrect && (
                <p className="text-sm text-gray-500 mt-2">你选择的是：<span className="font-bold">{selectedArticle}</span></p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      {selectedArticle !== null && (
        <footer className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
          <div className="px-4 py-3">
            <button onClick={handleNext} className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-semibold cursor-pointer">
              {currentIndex < nounWords.length - 1 ? "下一题" : "查看结果"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </footer>
      )}

      {/* Tips */}
      <div className="px-4 pb-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p><span className="font-bold text-blue-600">der</span>: 阳性，如职业、季节、方向</p>
              <p><span className="font-bold text-pink-600">die</span>: 阴性，-ung/-heit/-keit 结尾</p>
              <p><span className="font-bold text-purple-600">das</span>: 中性，-chen/-lein 结尾</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
