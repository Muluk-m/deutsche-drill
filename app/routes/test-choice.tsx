import type { Route } from "./+types/test-choice";
import { Link, useSearchParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { usePronunciation } from "../hooks/usePronunciation";
import { getUnitWords } from "../utils/unitManager";
import {
  getMistakesList,
  addMistake,
  recordStudySession,
  saveTestResult,
} from "../utils/storageManager";
import { 
  Trophy, 
  Target, 
  ChevronLeft,
  ChevronRight,
  Volume2, 
  Home,
  RotateCcw,
  CheckCircle,
  XCircle,
  Sparkles,
  Clock
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "选择题 - Deutsch Wörter" }];
}

interface Choice {
  word: Word;
  isCorrect: boolean;
}

export default function TestChoice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const unit = searchParams.get("unit");
  const count = parseInt(searchParams.get("count") || "20");
  const source = searchParams.get("source");

  const [allWords, setAllWords] = useState<Word[]>([]);
  const [testWords, setTestWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [startTime] = useState(Date.now());

  const currentWord = testWords[currentIndex];
  const { pronounce } = usePronunciation();

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setAllWords(data);
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
        const selected = shuffled.slice(0, Math.min(count, shuffled.length));
        setTestWords(selected);
      });
  }, [unit, count, source]);

  useEffect(() => {
    if (currentWord && allWords.length > 0) {
      generateChoices(currentWord);
    }
  }, [currentIndex, currentWord, allWords]);

  const generateChoices = (correctWord: Word) => {
    // 使用 Word 对象上的 article 字段
    let potentialDistractions = allWords.filter((w) => {
      if (w.word === correctWord.word) return false;
      // 如果正确答案有冠词，尽量找相同冠词的干扰项
      if (correctWord.article) {
        return w.article === correctWord.article;
      }
      return true;
    });

    if (potentialDistractions.length < 3) {
      potentialDistractions = allWords.filter((w) => w.word !== correctWord.word);
    }

    const shuffled = [...potentialDistractions].sort(() => Math.random() - 0.5);
    const distractions = shuffled.slice(0, 3);

    const allChoices: Choice[] = [
      { word: correctWord, isCorrect: true },
      ...distractions.map((w) => ({ word: w, isCorrect: false })),
    ];

    setChoices(allChoices.sort(() => Math.random() - 0.5));
    setSelectedChoice(null);
    setIsCorrect(null);
  };

  const handleSelectChoice = (index: number) => {
    if (selectedChoice !== null) return;

    setSelectedChoice(index);
    const correct = choices[index].isCorrect;
    setIsCorrect(correct);

    if (correct) {
      setScore({ correct: score.correct + 1, total: score.total + 1 });
      recordStudySession(true);
    } else {
      setScore({ correct: score.correct, total: score.total + 1 });
      addMistake(currentWord.word, choices[index].word.word, currentWord.zh_cn);
      recordStudySession(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < testWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      saveTestResult({
        mode: "choice",
        date: new Date().toISOString(),
        correct: score.correct + (isCorrect ? 1 : 0),
        total: score.total + 1,
        accuracy: ((score.correct + (isCorrect ? 1 : 0)) / (score.total + 1)) * 100,
        timeSpent,
      });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const progress = testWords.length > 0 ? ((currentIndex + 1) / testWords.length) * 100 : 0;

  // Completion Screen
  if (currentIndex >= testWords.length && testWords.length > 0) {
    const accuracy = Math.round((score.correct / score.total) * 100);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate("/test-modes")}
              className="p-2 -ml-2 text-gray-500 dark:text-gray-400 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">测试完成</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          {/* Trophy Icon */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
            accuracy >= 90 ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
            accuracy >= 70 ? "bg-gradient-to-br from-blue-400 to-purple-500" :
            "bg-gradient-to-br from-orange-400 to-red-500"
          }`}>
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {accuracy >= 90 ? "太棒了！" : accuracy >= 70 ? "做得好！" : "继续加油！"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {accuracy >= 90 ? "你对这些单词掌握得很好" : accuracy >= 70 ? "再接再厉！" : "多练习会有提高"}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{score.correct}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">正确</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{score.total - score.correct}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">错误</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{accuracy}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">正确率</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">用时</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              再测一次
            </button>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-medium cursor-pointer transition-all active:scale-95"
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
  if (!currentWord || choices.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">准备题目中...</p>
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
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-500 dark:text-gray-400 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {currentIndex + 1} / {testWords.length}
              </div>
            </div>

            {/* Score Badge */}
            {score.total > 0 && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                (score.correct / score.total) >= 0.8
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : (score.correct / score.total) >= 0.6
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              }`}>
                {Math.round((score.correct / score.total) * 100)}%
              </div>
            )}
            {score.total === 0 && <div className="w-12" />}
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 py-6">
        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium text-center mb-2">
            选择正确的德语单词
          </p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
            {currentWord.zh_cn}
          </h2>
          
          {/* Pronunciation Button */}
          <div className="flex justify-center">
            <button
              onClick={() => pronounce(currentWord.word)}
              className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Choices */}
        <div className="flex-1 space-y-3">
          {choices.map((choice, index) => {
            const isSelected = selectedChoice === index;
            const showResult = selectedChoice !== null;
            const letters = ["A", "B", "C", "D"];

            return (
              <button
                key={index}
                onClick={() => handleSelectChoice(index)}
                disabled={showResult}
                className={`w-full p-4 rounded-2xl text-left transition-all cursor-pointer active:scale-98 ${
                  showResult
                    ? choice.isCorrect
                      ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-500"
                      : isSelected
                      ? "bg-red-50 dark:bg-red-900/20 border-2 border-red-500"
                      : "bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 opacity-50"
                    : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    showResult && choice.isCorrect
                      ? "bg-green-500 text-white"
                      : showResult && isSelected
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}>
                    {showResult && choice.isCorrect ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : showResult && isSelected ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      letters[index]
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {choice.word.word}
                    </div>
                    {showResult && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {choice.word.zh_cn}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      {selectedChoice !== null && (
        <footer className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
          <div className="px-4 py-3">
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold cursor-pointer transition-all active:scale-95"
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
