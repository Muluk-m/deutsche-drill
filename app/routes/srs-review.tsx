import type { Route } from "./+types/srs-review";
import { Link, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import type { Word, WordSRSProgress } from "../types/word";
import { useAnswerCheck } from "../hooks/useAnswerCheck";
import { usePhonetics } from "../hooks/usePhonetics";
import { usePronunciation } from "../hooks/usePronunciation";
import {
  getSRSProgress,
  updateWordSRSProgress,
  addMistake,
  recordStudySession,
  needsMigration,
  migrateData,
  isFavorite,
  addFavorite,
  removeFavorite,
} from "../utils/storageManager";
import {
  getDueWords,
  updateSRSProgress,
  formatNextReview,
} from "../utils/srsAlgorithm";
import {
  ChevronLeft,
  Home,
  Trophy,
  Volume2,
  SkipForward,
  CheckCircle,
  XCircle,
  Sparkles,
  RotateCcw,
  Brain,
  Frown,
  Meh,
  Smile,
  Laugh,
  Star,
} from "lucide-react";
import { GermanKeyboardCompact } from "../components/GermanKeyboard";

export function meta({}: Route.MetaArgs) {
  return [{ title: "智能复习 - Deutsch Wörter" }];
}

export default function SRSReview() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [dueWords, setDueWords] = useState<WordSRSProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showQualityRating, setShowQualityRating] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isWordFavorite, setIsWordFavorite] = useState(false);

  // 德语特殊字符插入处理
  const handleInsertChar = (char: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? userInput.length;
    const end = input.selectionEnd ?? userInput.length;

    const newValue = userInput.slice(0, start) + char + userInput.slice(end);
    setUserInput(newValue);

    requestAnimationFrame(() => {
      input.focus();
      const newPos = start + char.length;
      input.setSelectionRange(newPos, newPos);
    });
  };

  const currentProgress = dueWords[currentIndex];
  const currentWord = currentProgress
    ? allWords.find((w) => w.word === currentProgress.word)
    : null;

  // 检查当前单词是否在生词本中
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

  const { checkAnswer } = useAnswerCheck();
  const { phonetic } = usePhonetics(
    currentWord?.word || "",
    currentWord?.phonetic
  );
  const { pronounce } = usePronunciation();

  useEffect(() => {
    if (needsMigration()) migrateData();

    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setAllWords(data);
        const srsProgress = getSRSProgress();
        const due = getDueWords(srsProgress);
        setDueWords(due);
      });
  }, []);

  const handleCheckAnswer = () => {
    if (!currentWord) return;
    const correct = checkAnswer(userInput, currentWord.word);
    setIsCorrect(correct);
    if (!correct) addMistake(currentWord.word, userInput, currentWord.zh_cn);
    setShowQualityRating(true);
  };

  const handleQualityRating = (quality: number) => {
    if (!currentProgress) return;
    let adjustedQuality = quality;
    if (!isCorrect && quality >= 3) adjustedQuality = Math.min(quality, 2);

    const newProgress = updateSRSProgress(currentProgress, adjustedQuality);
    updateWordSRSProgress(newProgress);
    recordStudySession(isCorrect || false);

    setReviewedCount(reviewedCount + 1);
    if (isCorrect) setCorrectCount(correctCount + 1);
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < dueWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput("");
      setIsCorrect(null);
      setShowQualityRating(false);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    if (!currentProgress) return;
    const newProgress = updateSRSProgress(currentProgress, 1);
    updateWordSRSProgress(newProgress);
    handleNext();
  };

  const progress =
    dueWords.length > 0 ? ((currentIndex + 1) / dueWords.length) * 100 : 0;

  // Empty State
  if (allWords.length > 0 && dueWords.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 safe-area-top">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-500 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              智能复习
            </h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <Trophy className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            太棒了！
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
            暂时没有需要复习的单词
          </p>
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium cursor-pointer"
          >
            <Home className="w-5 h-5" />
            返回首页
          </Link>
        </main>
      </div>
    );
  }

  // Completion State
  if (currentIndex >= dueWords.length && dueWords.length > 0) {
    const accuracy =
      reviewedCount > 0 ? Math.round((correctCount / reviewedCount) * 100) : 0;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 safe-area-top">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="p-2 -ml-2 text-gray-500 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              复习完成
            </h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            复习完成！
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            今天的复习任务已完成
          </p>

          <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {reviewedCount}
              </div>
              <div className="text-xs text-gray-500 mt-1">已复习</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {correctCount}
              </div>
              <div className="text-xs text-gray-500 mt-1">正确</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {accuracy}%
              </div>
              <div className="text-xs text-gray-500 mt-1">正确率</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-semibold cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              继续复习
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
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-500 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {currentIndex + 1} / {dueWords.length}
              </div>
            </div>
            {reviewedCount > 0 ? (
              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                {Math.round((correctCount / reviewedCount) * 100)}%
              </div>
            ) : (
              <div className="w-10" />
            )}
          </div>

          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 py-6">
        {/* SRS Info */}
        <div className="flex items-center justify-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Brain className="w-4 h-4" />
            <span>熟练度 {currentProgress.repetitions}</span>
          </div>
          <div>间隔 {currentProgress.interval}天</div>
        </div>

        {!showQualityRating ? (
          /* Question View */
          <div className="flex-1 flex flex-col">
            {/* Question Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium text-center mb-2">
                请输入德语单词
              </p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
                {currentWord.zh_cn}
              </h2>

              <div className="flex justify-center">
                <button
                  onClick={() => pronounce(currentWord.word)}
                  className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 active:scale-90"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Input */}
            <div className="flex-1 flex flex-col justify-center space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && userInput.trim() && handleCheckAnswer()
                }
                placeholder="输入德语单词..."
                autoFocus
                className="w-full h-14 px-4 text-center text-xl font-medium bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-2xl outline-none transition-all"
              />
              {/* 德语特殊字符键盘 */}
              <GermanKeyboardCompact onInsert={handleInsertChar} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSkip}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-medium cursor-pointer"
              >
                <SkipForward className="w-5 h-5" />
                跳过
              </button>
              <button
                onClick={handleCheckAnswer}
                disabled={!userInput.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-semibold disabled:opacity-40 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                检查
              </button>
            </div>
          </div>
        ) : (
          /* Answer & Rating View */
          <div className="flex-1 flex flex-col">
            {/* Feedback */}
            <div
              className={`p-4 rounded-2xl mb-4 ${
                isCorrect
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1">
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
                {/* 生词本按钮 */}
                <button
                  onClick={toggleFavorite}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isWordFavorite
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-500"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-amber-500"
                  }`}
                >
                  <Star
                    className={`w-5 h-5 ${
                      isWordFavorite ? "fill-current" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Quality Rating */}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
                这个单词对你来说有多难？
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleQualityRating(0)}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl text-left cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Frown className="w-6 h-6 text-red-500 mb-2" />
                  <div className="font-semibold text-red-700 dark:text-red-400">
                    完全忘了
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-500">
                    1分钟后
                  </div>
                </button>

                <button
                  onClick={() => handleQualityRating(2)}
                  className="p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-2xl text-left cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                >
                  <Meh className="w-6 h-6 text-orange-500 mb-2" />
                  <div className="font-semibold text-orange-700 dark:text-orange-400">
                    有点难
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-500">
                    1天后
                  </div>
                </button>

                <button
                  onClick={() => handleQualityRating(4)}
                  className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl text-left cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <Smile className="w-6 h-6 text-green-500 mb-2" />
                  <div className="font-semibold text-green-700 dark:text-green-400">
                    还不错
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-500">
                    正常间隔
                  </div>
                </button>

                <button
                  onClick={() => handleQualityRating(5)}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl text-left cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Laugh className="w-6 h-6 text-blue-500 mb-2" />
                  <div className="font-semibold text-blue-700 dark:text-blue-400">
                    很简单
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-500">
                    延长间隔
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
