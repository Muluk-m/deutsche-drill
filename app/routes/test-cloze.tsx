import type { Route } from "./+types/test-cloze";
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
import { parseGermanWord } from "../utils/wordParser";
import { GermanKeyboardCompact } from "../components/GermanKeyboard";
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  Home,
  RotateCcw,
  Lightbulb,
  CheckCircle,
  XCircle,
  Sparkles,
  SkipForward,
  FileText,
  Star,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "填空练习 - Deutsch Wörter" }];
}

// 简单的例句模板
const sentenceTemplates = [
  { pattern: "Ich habe ____ gekauft.", meaning: "我买了____。" },
  { pattern: "Das ist ____.", meaning: "这是____。" },
  { pattern: "Ich mag ____.", meaning: "我喜欢____。" },
  { pattern: "Wo ist ____?", meaning: "____在哪里？" },
  { pattern: "Ich brauche ____.", meaning: "我需要____。" },
  { pattern: "Das ist mein ____.", meaning: "这是我的____。" },
  { pattern: "Ich suche ____.", meaning: "我在找____。" },
  { pattern: "Kennst du ____?", meaning: "你认识/知道____吗？" },
];

export default function TestCloze() {
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
  const [currentSentence, setCurrentSentence] = useState({
    pattern: "",
    meaning: "",
  });
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

  // 初始化测试单词
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

        // 只选择名词（有可能构成句子的单词）
        const nounWords = wordsToTest.filter((w) => {
          const parsed = parseGermanWord(w.word);
          return parsed.article !== undefined;
        });

        const finalWords = nounWords.length >= count ? nounWords : wordsToTest;
        const shuffled = [...finalWords].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(count, shuffled.length));
        setTestWords(selected);
      });
  }, [unit, count, source]);

  // 为当前单词生成句子
  useEffect(() => {
    if (currentWord) {
      const template =
        sentenceTemplates[Math.floor(Math.random() * sentenceTemplates.length)];
      setCurrentSentence(template);
      setUserInput("");
      setIsCorrect(null);
      setShowHint(false);
    }
  }, [currentIndex, currentWord]);

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
    } else {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      saveTestResult({
        mode: "cloze",
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
    if (currentWord) {
      addMistake(currentWord.word, userInput || "(跳过)", currentWord.zh_cn);
    }
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
              填空完成
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
                ? "bg-gradient-to-br from-indigo-400 to-purple-500"
                : "bg-gradient-to-br from-orange-400 to-red-500"
            }`}
          >
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {accuracy >= 90
              ? "太棒了！"
              : accuracy >= 70
              ? "做得不错！"
              : "继续加油！"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
            {accuracy >= 90
              ? "你的语境理解能力很强！"
              : accuracy >= 70
              ? "再多练习几次会更好"
              : "多练习语境能更好理解单词"}
          </p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {score.correct}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                正确
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-red-500">
                {score.total - score.correct}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                错误
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">
                {accuracy}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                正确率
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                用时
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full max-w-sm">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              再测一次
            </button>
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-600 text-white rounded-xl font-medium cursor-pointer"
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
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  const parsed = parseGermanWord(currentWord.word);

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
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : score.correct / score.total >= 0.6
                    ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {Math.round((score.correct / score.total) * 100)}%
              </div>
            )}
            {score.total === 0 && <div className="w-10" />}
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 py-6">
        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 text-center">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            填空练习
          </h2>

          {/* Sentence Template */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 mb-4">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-2">
              德语句子
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono mb-4">
              {currentSentence.pattern}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-2">
              中文意思
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              {currentSentence.meaning.replace(
                "____",
                `____（${currentWord.zh_cn}）`
              )}
            </p>
          </div>

          {/* Hint */}
          {showHint && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 justify-center text-amber-700 dark:text-amber-400">
                <Lightbulb className="w-4 h-4" />
                <span className="font-medium">
                  提示：填入「{currentWord.zh_cn}」的德语
                  {parsed.article && `（${parsed.article} 词性）`}
                </span>
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
                className="w-full h-14 px-4 text-center text-xl font-medium bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500 rounded-2xl outline-none transition-all mb-2"
              />
              <GermanKeyboardCompact
                onInsert={handleInsertChar}
                className="mb-4"
              />
              <div className="flex gap-4 justify-center text-sm">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1 text-gray-500 hover:text-orange-600 cursor-pointer"
                >
                  <Lightbulb className="w-4 h-4" />
                  {showHint ? "隐藏提示" : "显示提示"}
                </button>
                <button
                  onClick={handleSkip}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-600 cursor-pointer"
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
              <div className="flex items-center justify-between mb-3">
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
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-2">
                <p className="text-sm text-gray-500 mb-1">正确答案：</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {currentWord.word}
                </p>
              </div>
              {!isCorrect && userInput && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-2">
                  <p className="text-sm text-gray-500 mb-1">你的答案：</p>
                  <p className="text-lg text-red-600">{userInput}</p>
                </div>
              )}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">完整句子：</p>
                <p className="text-lg text-gray-700 dark:text-gray-300 font-mono">
                  {currentSentence.pattern.replace("____", currentWord.word)}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      {isCorrect === null ? (
        <footer
          className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="px-4 py-3">
            <button
              onClick={handleCheckAnswer}
              disabled={!userInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-orange-600 text-white rounded-2xl font-semibold disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              检查答案
            </button>
          </div>
        </footer>
      ) : (
        <footer
          className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="px-4 py-3">
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 py-4 bg-orange-600 text-white rounded-2xl font-semibold cursor-pointer"
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
