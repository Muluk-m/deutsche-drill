import type { Route } from "./+types/practice-confusables";
import { useNavigate, Link } from "react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import type { Word } from "../types/word";
import { usePronunciation } from "../hooks/usePronunciation";
import { recordStudySession, addMistake } from "../utils/storageManager";
import {
  ChevronLeft,
  Volume2,
  Home,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "形近词练习 - Deutsch Wörter" }];
}

interface ConfusablePair {
  word1: Word;
  word2: Word;
  similarity: number;
}

interface Question {
  targetWord: Word;
  options: Word[];
  correctIndex: number;
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity score (0-1)
function calculateSimilarity(word1: string, word2: string): number {
  const maxLen = Math.max(word1.length, word2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(word1.toLowerCase(), word2.toLowerCase());
  return 1 - distance / maxLen;
}

// Find confusable pairs from word list
function findConfusablePairs(words: Word[], minSimilarity = 0.6): ConfusablePair[] {
  const pairs: ConfusablePair[] = [];

  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const word1 = words[i];
      const word2 = words[j];

      // Skip if same word or too different in length
      if (Math.abs(word1.word.length - word2.word.length) > 3) continue;

      const similarity = calculateSimilarity(word1.word, word2.word);

      if (similarity >= minSimilarity && similarity < 1) {
        pairs.push({ word1, word2, similarity });
      }
    }
  }

  // Sort by similarity (highest first)
  return pairs.sort((a, b) => b.similarity - a.similarity);
}

// Generate a question from a confusable pair
function generateQuestion(pair: ConfusablePair): Question {
  const isFirst = Math.random() > 0.5;
  const targetWord = isFirst ? pair.word1 : pair.word2;
  const confusableWord = isFirst ? pair.word2 : pair.word1;

  return {
    targetWord,
    options: Math.random() > 0.5
      ? [targetWord, confusableWord]
      : [confusableWord, targetWord],
    correctIndex: Math.random() > 0.5 ? 0 : 1,
  };
}

export default function PracticeConfusables() {
  const navigate = useNavigate();
  const { pronounce } = usePronunciation();

  const [words, setWords] = useState<Word[]>([]);
  const [confusablePairs, setConfusablePairs] = useState<ConfusablePair[]>([]);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  const questionCount = 20;

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setWords(data);

        // Find confusable pairs
        const pairs = findConfusablePairs(data, 0.5);

        // Shuffle and limit
        const shuffled = pairs.sort(() => Math.random() - 0.5).slice(0, questionCount);
        setConfusablePairs(shuffled);

        if (shuffled.length > 0) {
          const q = generateQuestion(shuffled[0]);
          // Fix the question so correctIndex matches targetWord position
          const correctIdx = q.options.findIndex(o => o.word === q.targetWord.word);
          setQuestion({ ...q, correctIndex: correctIdx });
        }

        setLoading(false);
      });
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      if (selectedIndex !== null || !question) return;

      setSelectedIndex(index);
      const correct = question.options[index].word === question.targetWord.word;
      setIsCorrect(correct);

      recordStudySession(correct);

      if (correct) {
        setStats((prev) => ({
          ...prev,
          correct: prev.correct + 1,
          total: prev.total + 1,
        }));
      } else {
        setStats((prev) => ({
          ...prev,
          wrong: prev.wrong + 1,
          total: prev.total + 1,
        }));
        addMistake(
          question.targetWord.word,
          question.options[index].word,
          question.targetWord.zh_cn
        );
      }
    },
    [selectedIndex, question]
  );

  const handleNext = useCallback(() => {
    const nextIndex = currentPairIndex + 1;

    if (nextIndex >= confusablePairs.length) {
      setIsComplete(true);
      return;
    }

    setCurrentPairIndex(nextIndex);
    const pair = confusablePairs[nextIndex];
    const q = generateQuestion(pair);
    const correctIdx = q.options.findIndex(o => o.word === q.targetWord.word);
    setQuestion({ ...q, correctIndex: correctIdx });
    setSelectedIndex(null);
    setIsCorrect(null);
  }, [currentPairIndex, confusablePairs]);

  const handleRestart = useCallback(() => {
    const shuffled = [...confusablePairs].sort(() => Math.random() - 0.5);
    setConfusablePairs(shuffled);
    setCurrentPairIndex(0);

    if (shuffled.length > 0) {
      const q = generateQuestion(shuffled[0]);
      const correctIdx = q.options.findIndex(o => o.word === q.targetWord.word);
      setQuestion({ ...q, correctIndex: correctIdx });
    }

    setSelectedIndex(null);
    setIsCorrect(null);
    setStats({ correct: 0, wrong: 0, total: 0 });
    setIsComplete(false);
  }, [confusablePairs]);

  // Example confusable pairs for display
  const examplePairs = useMemo(() => {
    return confusablePairs.slice(0, 5).map((pair) => ({
      word1: pair.word1.word,
      word2: pair.word2.word,
      zh1: pair.word1.zh_cn,
      zh2: pair.word2.zh_cn,
    }));
  }, [confusablePairs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">正在分析形近词...</p>
        </div>
      </div>
    );
  }

  if (confusablePairs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            未找到形近词
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            词库中没有足够相似的单词对
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
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

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
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 text-center mb-8">
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
              {accuracy >= 80 ? "形近词达人！" : accuracy >= 60 ? "继续加油！" : "需要多练习"}
            </h2>

            <div className="flex justify-center gap-8 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.correct}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">正确</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.wrong}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">错误</div>
              </div>
            </div>
          </div>

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

  if (!question) return null;

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
              <span className="text-xs text-gray-500 dark:text-gray-400">形近词练习</span>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {currentPairIndex + 1} / {confusablePairs.length}
              </div>
            </div>
            <Link to="/" className="p-2 -mr-2 text-gray-500 dark:text-gray-400 cursor-pointer">
              <Home className="w-5 h-5" />
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{
                width: `${((currentPairIndex + 1) / confusablePairs.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 py-6">
        {/* Question Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 mb-6 border border-purple-100 dark:border-purple-800/30">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2 text-center">
            哪个单词的意思是：
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
            {question.targetWord.zh_cn}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 flex-1">
          {question.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrectOption = option.word === question.targetWord.word;
            const showResult = selectedIndex !== null;

            let bgClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
            let textClass = "text-gray-900 dark:text-gray-100";

            if (showResult) {
              if (isCorrectOption) {
                bgClass = "bg-green-50 dark:bg-green-900/20 border-green-500";
                textClass = "text-green-700 dark:text-green-400";
              } else if (isSelected && !isCorrectOption) {
                bgClass = "bg-red-50 dark:bg-red-900/20 border-red-500";
                textClass = "text-red-700 dark:text-red-400";
              }
            }

            return (
              <button
                key={option.word}
                onClick={() => handleSelect(index)}
                disabled={selectedIndex !== null}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${bgClass} ${
                  !showResult ? "hover:border-purple-400 dark:hover:border-purple-500" : ""
                } disabled:cursor-default`}
              >
                {/* Article Badge */}
                {option.article && (
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      option.article === "der"
                        ? "bg-blue-500"
                        : option.article === "die"
                        ? "bg-pink-500"
                        : "bg-violet-500"
                    }`}
                  >
                    {option.article}
                  </span>
                )}

                <div className="flex-1 text-left">
                  <span className={`text-xl font-semibold ${textClass}`}>
                    {option.word}
                  </span>
                  {showResult && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {option.zh_cn}
                    </p>
                  )}
                </div>

                {/* Result Icon */}
                {showResult && isCorrectOption && (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                )}
                {showResult && isSelected && !isCorrectOption && (
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                )}

                {/* Pronunciation Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    pronounce(option.word);
                  }}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {selectedIndex !== null && (
          <div
            className={`mt-4 p-4 rounded-xl ${
              isCorrect
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              )}
              <div>
                <p
                  className={`font-semibold ${
                    isCorrect
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {isCorrect ? "正确！" : "错误"}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    正确答案是：{question.targetWord.word}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3">
          {selectedIndex !== null ? (
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold cursor-pointer transition-colors"
            >
              {currentPairIndex < confusablePairs.length - 1 ? (
                <>
                  下一题
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  查看结果
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
              选择正确的单词
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}


