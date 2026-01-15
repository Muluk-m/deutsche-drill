import type { Route } from "./+types/flashcard";
import { useNavigate, useSearchParams, Link } from "react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Word } from "../types/word";
import { usePronunciation } from "../hooks/usePronunciation";
import { getUnitWords } from "../utils/unitManager";
import {
  getFavoritesList,
  getMistakesList,
  getLearnedWords,
  recordStudySession,
} from "../utils/storageManager";
import {
  ChevronLeft,
  Volume2,
  X,
  Check,
  RotateCcw,
  Home,
  Settings,
  Shuffle,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "闪卡模式 - Deutsch Wörter" }];
}

interface FlashcardStats {
  known: number;
  unknown: number;
  total: number;
}

export default function Flashcard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pronounce } = usePronunciation();

  const source = searchParams.get("source") || "all"; // all, unit, favorites, mistakes
  const unitId = searchParams.get("unit");
  const countParam = searchParams.get("count");

  const [allWords, setAllWords] = useState<Word[]>([]);
  const [cards, setCards] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState<FlashcardStats>({ known: 0, unknown: 0, total: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Touch handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setAllWords(data);
        initializeCards(data);
        setLoading(false);
      });
  }, []);

  const initializeCards = useCallback(
    (wordsData: Word[]) => {
      let selectedWords: Word[] = [];
      const count = countParam ? parseInt(countParam) : 20;

      if (source === "unit" && unitId) {
        selectedWords = getUnitWords(wordsData, parseInt(unitId));
      } else if (source === "favorites") {
        const favorites = getFavoritesList();
        selectedWords = wordsData.filter((w) =>
          favorites.some((f) => f.word === w.word)
        );
      } else if (source === "mistakes") {
        const mistakes = getMistakesList();
        selectedWords = wordsData.filter((w) =>
          mistakes.some((m) => m.word === w.word)
        );
      } else {
        // All words - shuffle and take count
        selectedWords = [...wordsData].sort(() => Math.random() - 0.5);
      }

      // Limit to count
      selectedWords = selectedWords.slice(0, count);

      // Shuffle
      selectedWords = selectedWords.sort(() => Math.random() - 0.5);

      setCards(selectedWords);
      setStats({ known: 0, unknown: 0, total: selectedWords.length });
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsComplete(false);
    },
    [source, unitId, countParam]
  );

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped && currentCard) {
      pronounce(currentCard.word);
    }
  };

  const handleKnown = () => {
    recordStudySession(true);
    setStats((prev) => ({ ...prev, known: prev.known + 1 }));
    nextCard();
  };

  const handleUnknown = () => {
    recordStudySession(false);
    setStats((prev) => ({ ...prev, unknown: prev.unknown + 1 }));
    nextCard();
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    initializeCards(allWords);
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ known: 0, unknown: 0, total: shuffled.length });
    setIsComplete(false);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX.current;
    const diffY = touchEndY - touchStartY.current;

    // Only handle horizontal swipes (not vertical scrolling)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swipe right = known
        handleKnown();
      } else {
        // Swipe left = unknown
        handleUnknown();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            没有可用的单词
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {source === "favorites"
              ? "生词本为空"
              : source === "mistakes"
              ? "错题本为空"
              : "请选择其他词源"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium cursor-pointer hover:bg-blue-700 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  // Completion Screen
  if (isComplete) {
    const accuracy = stats.total > 0 ? Math.round((stats.known / stats.total) * 100) : 0;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
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
              练习完成
            </h1>
            <Link to="/" className="p-2 -mr-2 text-gray-500 dark:text-gray-400 cursor-pointer">
              <Home className="w-5 h-5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Result Card */}
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 text-center mb-8">
            {/* Score Circle */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - accuracy / 100)}`}
                  strokeLinecap="round"
                  className={`${
                    accuracy >= 80
                      ? "text-green-500"
                      : accuracy >= 60
                      ? "text-amber-500"
                      : "text-red-500"
                  } transition-all duration-1000`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {accuracy}%
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {accuracy >= 80 ? "太棒了！" : accuracy >= 60 ? "继续加油！" : "需要多练习"}
            </h2>

            <div className="flex justify-center gap-8 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.known}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">认识</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.unknown}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">不认识</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">总计</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={handleRestart}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold cursor-pointer transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              再练一次
            </button>
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              返回首页
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Main Flashcard View
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-500 dark:text-gray-400 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {currentIndex + 1} / {cards.length}
              </span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 -mr-2 text-gray-500 dark:text-gray-400 cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>

          {/* Mini Stats */}
          <div className="flex justify-center gap-6 mt-2 text-xs">
            <span className="text-green-600 dark:text-green-400">
              ✓ {stats.known}
            </span>
            <span className="text-red-600 dark:text-red-400">
              ✗ {stats.unknown}
            </span>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="px-4 pb-4 animate-slideInDown">
            <button
              onClick={handleShuffle}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              重新洗牌
            </button>
          </div>
        )}
      </header>

      {/* Card Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Flashcard */}
        <div
          ref={cardRef}
          onClick={handleFlip}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full max-w-sm aspect-[3/4] perspective-1000 cursor-pointer"
        >
          <div
            className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front - German Word */}
            <div
              className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-8"
              style={{ backfaceVisibility: "hidden" }}
            >
              {currentCard?.article && (
                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-bold text-white mb-4 ${
                    currentCard.article === "der"
                      ? "bg-blue-500"
                      : currentCard.article === "die"
                      ? "bg-pink-500"
                      : "bg-violet-500"
                  }`}
                >
                  {currentCard.article}
                </span>
              )}
              <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
                {currentCard?.word}
              </h2>
              {currentCard?.phonetic && (
                <p className="text-gray-400 dark:text-gray-500 font-mono text-sm mb-6">
                  [{currentCard.phonetic}]
                </p>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentCard) pronounce(currentCard.word);
                }}
                className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Volume2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-6">
                点击翻转查看释义
              </p>
            </div>

            {/* Back - Chinese Meaning */}
            <div
              className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <h2 className="text-3xl font-bold text-white text-center mb-4">
                {currentCard?.zh_cn}
              </h2>
              {currentCard?.plural && !currentCard?.singularOnly && (
                <p className="text-blue-200 text-sm">
                  复数: {currentCard.plural}
                </p>
              )}
              <p className="text-sm text-blue-200 mt-6">
                点击翻转返回
              </p>
            </div>
          </div>
        </div>

        {/* Swipe Hints */}
        <div className="flex items-center justify-center gap-8 mt-6 text-sm text-gray-400 dark:text-gray-500">
          <span>← 不认识</span>
          <span>认识 →</span>
        </div>
      </main>

      {/* Action Buttons */}
      <footer className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
        <div className="px-4 py-4 flex gap-4">
          <button
            onClick={handleUnknown}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-semibold cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors active:scale-95"
          >
            <X className="w-6 h-6" />
            不认识
          </button>
          <button
            onClick={handleKnown}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl font-semibold cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors active:scale-95"
          >
            <Check className="w-6 h-6" />
            认识
          </button>
        </div>
      </footer>
    </div>
  );
}


