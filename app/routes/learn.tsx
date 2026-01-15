import type { Route } from "./+types/learn";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { buildPluralForm } from "../utils/wordParser";
import type { Word } from "../types/word";
import { useAnswerCheck } from "../hooks/useAnswerCheck";
import { usePhonetics } from "../hooks/usePhonetics";
import { usePronunciation } from "../hooks/usePronunciation";
import { getUnitWords } from "../utils/unitManager";
import { GermanKeyboardCompact } from "../components/GermanKeyboard";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Eye,
  EyeOff,
  PenTool,
  CheckCircle,
  XCircle,
  Sparkles,
  Home,
  RotateCcw,
  ArrowRight,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "学习 - Deutsch Wörter" }];
}

export default function Learn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const unitId = searchParams.get("unit");
  const indexParam = searchParams.get("index");

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showChinese, setShowChinese] = useState(false);
  const [mode, setMode] = useState<"learn" | "test">("learn");
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);

  const { checkAnswer } = useAnswerCheck();
  const currentWord = words[currentIndex];

  const { phonetic } = usePhonetics(
    currentWord?.word || "",
    currentWord?.phonetic
  );

  const { pronounce } = usePronunciation();

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        let wordsToLearn: Word[];
        if (unitId) {
          wordsToLearn = getUnitWords(data, parseInt(unitId));
        } else {
          wordsToLearn = data;
        }
        setWords(wordsToLearn);

        const learned = JSON.parse(
          localStorage.getItem("learnedWords") || "[]"
        ) as string[];
        setLearnedWords(learned);

        if (indexParam !== null) {
          const targetIndex = parseInt(indexParam);
          if (targetIndex >= 0 && targetIndex < wordsToLearn.length) {
            setCurrentIndex(targetIndex);
            return;
          }
        }

        const firstUnlearned = wordsToLearn.findIndex(
          (w: Word) => !learned.includes(w.word)
        );
        if (firstUnlearned !== -1) {
          setCurrentIndex(firstUnlearned);
        }
      });
  }, [unitId, indexParam]);

  const handleCheckAnswer = () => {
    const correct = checkAnswer(userInput, currentWord.word);
    setIsCorrect(correct);

    if (correct) {
      const updated = [...learnedWords, currentWord.word];
      setLearnedWords(updated);
      localStorage.setItem("learnedWords", JSON.stringify(updated));

      const todayDate = new Date().toDateString();
      const todayLearned = JSON.parse(
        localStorage.getItem("todayLearned") || "{}"
      );
      todayLearned[todayDate] = (todayLearned[todayDate] || 0) + 1;
      localStorage.setItem("todayLearned", JSON.stringify(todayLearned));
    }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetState();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetState();
    }
  };

  const resetState = () => {
    setShowChinese(false);
    setMode("learn");
    setUserInput("");
    setIsCorrect(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      mode === "test" &&
      userInput &&
      isCorrect === null
    ) {
      handleCheckAnswer();
    }
  };

  const progress =
    words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">加载中...</p>
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
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="text-center">
              {unitId && (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  单元 {unitId}
                </span>
              )}
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {currentIndex + 1} / {words.length}
              </div>
            </div>

            <button
              onClick={() => navigate("/")}
              className="p-2 -mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 py-6">
        {mode === "learn" ? (
          <LearnMode
            word={currentWord}
            phonetic={phonetic}
            showChinese={showChinese}
            setShowChinese={setShowChinese}
            setMode={setMode}
            speak={pronounce}
          />
        ) : (
          <TestMode
            word={currentWord}
            userInput={userInput}
            setUserInput={setUserInput}
            isCorrect={isCorrect}
            handleCheckAnswer={handleCheckAnswer}
            handleKeyPress={handleKeyPress}
            resetState={() => {
              resetState();
              setMode("learn");
            }}
            speak={pronounce}
          />
        )}
      </main>

      {/* Footer - 根据模式和状态显示不同按钮 */}
      <footer className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
        <div className="px-4 py-3">
          {mode === "learn" ? (
            // 学习模式：显示导航按钮
            <div className="flex gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-[0.98]"
              >
                <ChevronLeft className="w-5 h-5" />
                上一个
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === words.length - 1}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-[0.98]"
              >
                下一个
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : isCorrect === null ? (
            // 测试模式-未提交：显示检查按钮
            <button
              onClick={handleCheckAnswer}
              disabled={!userInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5" />
              检查答案
            </button>
          ) : (
            // 测试模式-已提交：显示操作按钮
            <div className="flex gap-3">
              <button
                onClick={() => {
                  resetState();
                  setMode("learn");
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium cursor-pointer transition-all active:scale-[0.98]"
              >
                <RotateCcw className="w-5 h-5" />
                重新学习
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === words.length - 1}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold disabled:opacity-40 cursor-pointer transition-all active:scale-[0.98]"
              >
                继续
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

interface LearnModeProps {
  word: Word;
  phonetic: string | null;
  showChinese: boolean;
  setShowChinese: (show: boolean) => void;
  setMode: (mode: "test") => void;
  speak: (text: string) => void;
}

function LearnMode({
  word,
  phonetic,
  showChinese,
  setShowChinese,
  setMode,
  speak,
}: LearnModeProps) {
  const pluralForm =
    word.plural && word.plural !== "-" && !word.singularOnly
      ? buildPluralForm(word.word, word.plural)
      : null;

  return (
    <div className="flex-1 flex flex-col">
      {/* Word Card */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Article Badge */}
        {word.article && (
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-bold text-white mb-4 ${
              word.article === "der"
                ? "bg-blue-500"
                : word.article === "die"
                ? "bg-pink-500"
                : "bg-violet-500"
            }`}
          >
            {word.article}
          </span>
        )}

        {/* Word */}
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
          {word.word}
        </h1>

        {/* Phonetic */}
        {phonetic && (
          <p className="text-base text-gray-400 dark:text-gray-500 font-mono mb-4">
            [{phonetic}]
          </p>
        )}

        {/* Plural */}
        {pluralForm && (
          <div className="px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg mb-4">
            <span className="text-sm text-violet-600 dark:text-violet-400">
              复数: <span className="font-medium">{pluralForm}</span>
            </span>
          </div>
        )}

        {/* Pronunciation Button */}
        <button
          onClick={() => speak(word.word)}
          className="w-14 h-14 rounded-full flex items-center justify-center mb-8 cursor-pointer transition-all active:scale-90 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        >
          <Volume2 className="w-6 h-6" />
        </button>

        {/* Chinese Meaning Toggle */}
        <div className="w-full max-w-sm">
          <button
            onClick={() => setShowChinese(!showChinese)}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-medium cursor-pointer transition-all active:scale-[0.98] ${
              showChinese
                ? "bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
          >
            {showChinese ? (
              <>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {word.zh_cn}
                </span>
                <EyeOff className="w-4 h-4 text-gray-400 ml-2" />
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                点击查看中文释义
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={() => setMode("test")}
        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-semibold cursor-pointer transition-all active:scale-[0.98] mt-6"
      >
        <PenTool className="w-5 h-5" />
        开始拼写测试
      </button>
    </div>
  );
}

interface TestModeProps {
  word: Word;
  userInput: string;
  setUserInput: (value: string) => void;
  isCorrect: boolean | null;
  handleCheckAnswer: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  resetState: () => void;
  speak: (text: string) => void;
}

function TestMode({
  word,
  userInput,
  setUserInput,
  isCorrect,
  handleKeyPress,
  speak,
}: TestModeProps) {
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex-1 flex flex-col">
      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Chinese Meaning Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-6 w-full max-w-sm text-center border border-blue-100 dark:border-blue-800/30">
          <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mb-2 uppercase tracking-wide">
            请输入德语单词
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {word.zh_cn}
          </p>
        </div>

        {/* Pronunciation */}
        <button
          onClick={() => speak(word.word)}
          className="w-12 h-12 rounded-full flex items-center justify-center mb-6 cursor-pointer transition-all active:scale-90 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
        >
          <Volume2 className="w-5 h-5" />
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isCorrect !== null}
          placeholder="输入德语单词..."
          autoFocus
          className={`w-full max-w-sm h-14 px-4 text-center text-xl font-medium bg-white dark:bg-gray-800 border-2 rounded-xl outline-none transition-all ${
            isCorrect === null
              ? "border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
              : isCorrect
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
              : "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
          }`}
        />

        {/* German Keyboard */}
        {isCorrect === null && (
          <GermanKeyboardCompact onInsert={handleInsertChar} className="mt-4" />
        )}

        {/* Feedback */}
        {isCorrect !== null && (
          <div
            className={`mt-6 p-4 rounded-xl w-full max-w-sm ${
              isCorrect
                ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    isCorrect
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {isCorrect ? "正确！" : "错误"}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    正确答案:{" "}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {word.word}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
