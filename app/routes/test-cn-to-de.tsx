import type { Route } from "./+types/test-cn-to-de";
import { Link, useSearchParams, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import type { Word } from "../types/word";
import { useAnswerCheck } from "../hooks/useAnswerCheck";
import { getUnitWords } from "../utils/unitManager";
import {
  getMistakesList,
  addMistake,
  recordStudySession,
  saveTestResult,
  addFavorite,
  removeFavorite,
  isFavorite,
} from "../utils/storageManager";
import { GermanKeyboardCompact } from "../components/GermanKeyboard";
import {
  ChevronLeft,
  ChevronRight,
  Languages,
  Trophy,
  Home,
  RotateCcw,
  Lightbulb,
  CheckCircle,
  XCircle,
  Sparkles,
  SkipForward,
  Star,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "中译德模式 - Deutsch Wörter" }];
}

export default function TestCnToDe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const unit = searchParams.get("unit");
  const count = parseInt(searchParams.get("count") || "20");
  const source = searchParams.get("source");

  const [testWords, setTestWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());
  const [isWordFavorite, setIsWordFavorite] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = testWords[currentIndex];
  const { checkAnswer } = useAnswerCheck();

  // 检查当前单词是否已收藏
  useEffect(() => {
    if (currentWord) {
      setIsWordFavorite(isFavorite(currentWord.word));
    }
  }, [currentWord]);

  // 切换生词本状态
  const toggleFavorite = () => {
    if (!currentWord) return;
    if (isWordFavorite) {
      removeFavorite(currentWord.word);
      setIsWordFavorite(false);
    } else {
      addFavorite(currentWord.word, currentWord.zh_cn);
      setIsWordFavorite(true);
    }
  };

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        let wordsToTest: Word[];

        if (source === "mistakes") {
          const mistakes = getMistakesList();
          const mistakeWords = mistakes.map((m) => m.word);
          wordsToTest = data.filter((w) => mistakeWords.includes(w.word));
        } else if (unit) {
          wordsToTest = getUnitWords(data, parseInt(unit));
        } else {
          wordsToTest = data;
        }

        const shuffled = [...wordsToTest].sort(() => Math.random() - 0.5);
        setTestWords(shuffled.slice(0, Math.min(count, shuffled.length)));
      });
  }, [unit, count, source]);

  const handleCheckAnswer = () => {
    if (!currentWord) return;
    const correct = checkAnswer(userInput, currentWord.word);
    setIsCorrect(correct);

    if (correct) {
      setScore({ correct: score.correct + 1, total: score.total + 1 });
      recordStudySession(true);
    } else {
      setScore({ correct: score.correct, total: score.total + 1 });
      addMistake(currentWord.word, userInput, currentWord.zh_cn);
      recordStudySession(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < testWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput("");
      setIsCorrect(null);
      setShowHint(false);
    } else {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      saveTestResult({
        mode: "cn-to-de",
        date: new Date().toISOString(),
        correct: score.correct + (isCorrect ? 1 : 0),
        total: score.total + 1,
        accuracy:
          ((score.correct + (isCorrect ? 1 : 0)) / (score.total + 1)) * 100,
        timeSpent,
      });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    setIsCorrect(false);
    setScore({ correct: score.correct, total: score.total + 1 });
    if (currentWord)
      addMistake(currentWord.word, userInput || "(跳过)", currentWord.zh_cn);
    recordStudySession(false);
  };

  const handleInsertChar = (char: string) => {
    const input = inputRef.current;
    if (!input) {
      setUserInput(userInput + char);
      return;
    }
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newValue = userInput.slice(0, start) + char + userInput.slice(end);
    setUserInput(newValue);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  };

  const getHint = () => {
    if (!currentWord) return "";
    // 使用 Word 对象上的新字段
    return currentWord.article
      ? `${currentWord.article} ${currentWord.word[0]}...`
      : `${currentWord.word[0]}...`;
  };

  const progress =
    testWords.length > 0 ? ((currentIndex + 1) / testWords.length) * 100 : 0;

  // Completion State
  if (currentIndex >= testWords.length && testWords.length > 0) {
    const accuracy = Math.round((score.correct / score.total) * 100);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <header
          className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate("/test-modes")}
              className="p-2 -ml-2 text-gray-500 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              测试完成
            </h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
              accuracy >= 90
                ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                : accuracy >= 70
                ? "bg-gradient-to-br from-blue-400 to-purple-500"
                : "bg-gradient-to-br from-orange-400 to-red-500"
            }`}
          >
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {accuracy >= 90
              ? "优秀！"
              : accuracy >= 70
              ? "不错！"
              : "继续加油！"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            德语拼写能力有提升
          </p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {score.correct}
              </div>
              <div className="text-xs text-gray-500 mt-1">正确</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-red-600">
                {score.total - score.correct}
              </div>
              <div className="text-xs text-gray-500 mt-1">错误</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {accuracy}%
              </div>
              <div className="text-xs text-gray-500 mt-1">正确率</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
              <div className="text-xs text-gray-500 mt-1">用时</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-2xl font-semibold cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              再测一次
            </button>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-medium cursor-pointer"
            >
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
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">准备中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-500 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {currentIndex + 1} / {testWords.length}
            </div>
            {score.total > 0 && (
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  score.correct / score.total >= 0.8
                    ? "bg-green-100 text-green-600"
                    : score.correct / score.total >= 0.6
                    ? "bg-orange-100 text-orange-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {Math.round((score.correct / score.total) * 100)}%
              </div>
            )}
            {score.total === 0 && <div className="w-10" />}
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 py-6">
        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Languages className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            中译德模式
          </h2>

          {/* Chinese Word */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 mb-4">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-2">
              请输入德语单词
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {currentWord.zh_cn}
            </p>
          </div>

          {/* Article Hint */}
          {currentWord.article && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                这是一个
                <span
                  className={`font-bold mx-1 ${
                    currentWord.article === "der"
                      ? "text-blue-600"
                      : currentWord.article === "die"
                      ? "text-pink-600"
                      : "text-purple-600"
                  }`}
                >
                  {currentWord.article}
                </span>
                词性的名词，请输入完整形式
              </p>
            </div>
          )}

          {/* Hint */}
          {showHint && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 justify-center text-amber-700 dark:text-amber-400">
                <Lightbulb className="w-4 h-4" />
                <span className="font-medium">提示：{getHint()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Answer Section */}
        <div className="flex-1 flex flex-col">
          {isCorrect === null ? (
            <>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && userInput.trim() && handleCheckAnswer()
                }
                placeholder="输入德语单词（含词性）..."
                autoFocus
                className="w-full h-14 px-4 text-center text-xl font-medium bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 rounded-2xl outline-none transition-all mb-2"
              />
              <GermanKeyboardCompact
                onInsert={handleInsertChar}
                className="mb-4"
              />
              <div className="flex gap-4 justify-center text-sm">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1 text-gray-500 hover:text-purple-600 cursor-pointer"
                >
                  <Lightbulb className="w-4 h-4" />
                  {showHint ? "隐藏提示" : "显示提示"}
                </button>
                <button
                  onClick={handleSkip}
                  className="flex items-center gap-1 text-gray-500 hover:text-orange-600 cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                  跳过
                </button>
              </div>
            </>
          ) : (
            <div
              className={`p-4 rounded-2xl mb-4 ${
                isCorrect
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isCorrect ? (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500" />
                  )}
                  <div>
                    <p
                      className={`font-semibold ${
                        isCorrect
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {isCorrect ? "回答正确！" : "回答错误"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      正确答案:{" "}
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {currentWord.word}
                      </span>
                    </p>
                  </div>
                </div>
                {/* 生词本按钮 */}
                <button
                  onClick={toggleFavorite}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isWordFavorite
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-500"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-amber-500"
                  }`}
                  title={isWordFavorite ? "从生词本移除" : "加入生词本"}
                >
                  <Star
                    className={`w-5 h-5 ${
                      isWordFavorite ? "fill-current" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      {isCorrect === null ? (
        <footer className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
          <div className="px-4 py-3">
            <button
              onClick={handleCheckAnswer}
              disabled={!userInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-2xl font-semibold disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              检查答案
            </button>
          </div>
        </footer>
      ) : (
        <footer className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
          <div className="px-4 py-3">
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-2xl font-semibold cursor-pointer"
            >
              {currentIndex < testWords.length - 1 ? "下一题" : "查看结果"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
