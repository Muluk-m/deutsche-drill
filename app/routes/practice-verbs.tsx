import type { Route } from "./+types/practice-verbs";
import { Link, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import type { Word, VerbConjugation } from "../types/word";
import { recordStudySession, saveTestResult, addFavorite, removeFavorite, isFavorite } from "../utils/storageManager";
import { GermanKeyboardCompact } from "../components/GermanKeyboard";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trophy,
  Home,
  RotateCcw,
  Lightbulb,
  ClipboardList,
  CheckCircle,
  XCircle,
  Sparkles,
  SkipForward,
  AlertCircle,
  Star,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "动词变位练习 - Deutsch Wörter" }];
}

const sampleVerbs: Array<Word & { verbConjugation: VerbConjugation }> = [
  {
    word: "sein",
    zh_cn: "是，在",
    wordType: "verb",
    verbConjugation: {
      infinitive: "sein",
      present: { ich: "bin", du: "bist", er: "ist", wir: "sind", ihr: "seid", sie: "sind" },
    },
  },
  {
    word: "haben",
    zh_cn: "有",
    wordType: "verb",
    verbConjugation: {
      infinitive: "haben",
      present: { ich: "habe", du: "hast", er: "hat", wir: "haben", ihr: "habt", sie: "haben" },
    },
  },
  {
    word: "gehen",
    zh_cn: "去，走",
    wordType: "verb",
    verbConjugation: {
      infinitive: "gehen",
      present: { ich: "gehe", du: "gehst", er: "geht", wir: "gehen", ihr: "geht", sie: "gehen" },
    },
  },
  {
    word: "machen",
    zh_cn: "做，制作",
    wordType: "verb",
    verbConjugation: {
      infinitive: "machen",
      present: { ich: "mache", du: "machst", er: "macht", wir: "machen", ihr: "macht", sie: "machen" },
    },
  },
  {
    word: "kommen",
    zh_cn: "来",
    wordType: "verb",
    verbConjugation: {
      infinitive: "kommen",
      present: { ich: "komme", du: "kommst", er: "kommt", wir: "kommen", ihr: "kommt", sie: "kommen" },
    },
  },
];

const pronouns: Array<keyof VerbConjugation["present"]> = ["ich", "du", "er", "wir", "ihr", "sie"];
const pronounLabels: Record<keyof VerbConjugation["present"], string> = {
  ich: "ich (我)",
  du: "du (你)",
  er: "er/sie/es (他/她/它)",
  wir: "wir (我们)",
  ihr: "ihr (你们)",
  sie: "sie/Sie (他们/您)",
};

export default function PracticeVerbs() {
  const navigate = useNavigate();
  const [verbs, setVerbs] = useState<Array<Word & { verbConjugation: VerbConjugation }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPronoun, setCurrentPronoun] = useState<keyof VerbConjugation["present"]>("ich");
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showHint, setShowHint] = useState(false);
  const [showConjugationTable, setShowConjugationTable] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [totalQuestions] = useState(30);
  const [isWordFavorite, setIsWordFavorite] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentVerb = verbs[currentIndex];

  // 检查当前单词是否已收藏
  useEffect(() => {
    if (currentVerb) {
      setIsWordFavorite(isFavorite(currentVerb.word));
    }
  }, [currentVerb]);

  // 切换生词本状态
  const toggleFavorite = () => {
    if (!currentVerb) return;
    if (isWordFavorite) {
      removeFavorite(currentVerb.word);
      setIsWordFavorite(false);
    } else {
      addFavorite(currentVerb.word, currentVerb.zh_cn);
      setIsWordFavorite(true);
    }
  };
  const correctAnswer = currentVerb?.verbConjugation.present[currentPronoun];

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        const verbsWithConjugation = data.filter(
          (w): w is Word & { verbConjugation: VerbConjugation } =>
            w.wordType === "verb" && w.verbConjugation !== undefined
        );
        setVerbs(verbsWithConjugation.length > 0 ? verbsWithConjugation : sampleVerbs);
      })
      .catch(() => setVerbs(sampleVerbs));
  }, []);

  const generateQuestion = () => {
    if (verbs.length === 0) return;
    setCurrentIndex(Math.floor(Math.random() * verbs.length));
    setCurrentPronoun(pronouns[Math.floor(Math.random() * pronouns.length)]);
    setUserInput("");
    setIsCorrect(null);
    setShowHint(false);
    setShowConjugationTable(false);
  };

  useEffect(() => {
    if (verbs.length > 0) generateQuestion();
  }, [verbs]);

  const handleCheckAnswer = () => {
    if (!correctAnswer) return;
    const correct = userInput.trim().toLowerCase() === correctAnswer.toLowerCase();
    setIsCorrect(correct);

    if (correct) {
      setScore({ correct: score.correct + 1, total: score.total + 1 });
      recordStudySession(true);
    } else {
      setScore({ correct: score.correct, total: score.total + 1 });
      recordStudySession(false);
    }
    setQuestionsAnswered(questionsAnswered + 1);
  };

  const handleNext = () => {
    if (questionsAnswered < totalQuestions) {
      generateQuestion();
    } else {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      saveTestResult({
        mode: "verb",
        date: new Date().toISOString(),
        correct: score.correct + (isCorrect ? 1 : 0),
        total: score.total + 1,
        accuracy: ((score.correct + (isCorrect ? 1 : 0)) / (score.total + 1)) * 100,
        timeSpent,
      });
      setQuestionsAnswered(questionsAnswered + 1);
    }
  };

  const handleSkip = () => {
    setIsCorrect(false);
    setScore({ correct: score.correct, total: score.total + 1 });
    recordStudySession(false);
    setQuestionsAnswered(questionsAnswered + 1);
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

  const progress = (questionsAnswered / totalQuestions) * 100;

  // Completion State
  if (questionsAnswered > totalQuestions) {
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
            accuracy >= 70 ? "bg-gradient-to-br from-rose-400 to-pink-500" :
            "bg-gradient-to-br from-orange-400 to-red-500"
          }`}>
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {accuracy >= 90 ? "优秀！" : accuracy >= 70 ? "不错！" : "继续加油！"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">动词变位掌握得更好了</p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
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

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 py-4 bg-rose-600 text-white rounded-2xl font-semibold cursor-pointer">
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
  if (!currentVerb) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
              {questionsAnswered} / {totalQuestions}
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
            <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      {/* Sample Data Notice */}
      {verbs.length === sampleVerbs.length && (
        <div className="mx-4 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>使用示例数据（{sampleVerbs.length}个动词）</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 py-6">
        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 text-center">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">填写正确的动词变位</h2>

          {/* Verb Info */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl p-6 mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">动词不定式：</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{currentVerb.word}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{currentVerb.zh_cn}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">人称：</p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{pronounLabels[currentPronoun]}</p>
          </div>

          {/* Hint */}
          {showHint && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 justify-center text-amber-700 dark:text-amber-400">
                <Lightbulb className="w-4 h-4" />
                <span className="font-medium">提示：答案以 "{correctAnswer?.[0]}" 开头</span>
              </div>
            </div>
          )}

          {/* Conjugation Table */}
          {showConjugationTable && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">完整变位表：</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {pronouns.map((p) => (
                  <div key={p} className={`flex justify-between px-2 py-1 rounded ${p === currentPronoun ? "bg-blue-100 dark:bg-blue-800 font-bold text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"}`}>
                    <span>{p}:</span>
                    <span>{currentVerb.verbConjugation.present[p]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Answer Section */}
        <div className="flex-1 flex flex-col">
          {isCorrect === null ? (
            <>
              <div className="mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{currentPronoun} _______</p>
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && userInput.trim() && handleCheckAnswer()}
                  placeholder="输入变位形式..."
                  autoFocus
                  className="w-full h-14 px-4 text-center text-xl font-medium bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-rose-500 rounded-2xl outline-none transition-all"
                />
                <GermanKeyboardCompact onInsert={handleInsertChar} className="mt-2" />
              </div>
              <div className="flex gap-4 justify-center text-sm mt-2">
                <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-1 text-gray-500 hover:text-rose-600 cursor-pointer">
                  <Lightbulb className="w-4 h-4" />
                  {showHint ? "隐藏提示" : "显示提示"}
                </button>
                <button onClick={() => setShowConjugationTable(!showConjugationTable)} className="flex items-center gap-1 text-gray-500 hover:text-blue-600 cursor-pointer">
                  <ClipboardList className="w-4 h-4" />
                  {showConjugationTable ? "隐藏变位表" : "查看变位表"}
                </button>
                <button onClick={handleSkip} className="flex items-center gap-1 text-gray-500 hover:text-orange-600 cursor-pointer">
                  <SkipForward className="w-4 h-4" />
                  跳过
                </button>
              </div>
            </>
          ) : (
            <div className={`p-4 rounded-2xl mb-4 ${
              isCorrect ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {isCorrect ? <CheckCircle className="w-8 h-8 text-green-500" /> : <XCircle className="w-8 h-8 text-red-500" />}
                  <div>
                    <p className={`font-semibold ${isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                      {isCorrect ? "正确！" : "错误"}
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
                  <Star className={`w-5 h-5 ${isWordFavorite ? "fill-current" : ""}`} />
                </button>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">正确答案：</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{currentPronoun} {correctAnswer}</p>
              </div>
              {!isCorrect && userInput && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mt-2">
                  <p className="text-sm text-gray-500 mb-1">你的答案：</p>
                  <p className="text-lg text-red-600">{currentPronoun} {userInput}</p>
                </div>
              )}
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
              className="w-full flex items-center justify-center gap-2 py-4 bg-rose-600 text-white rounded-2xl font-semibold disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              检查答案
            </button>
          </div>
        </footer>
      ) : (
        <footer className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
          <div className="px-4 py-3">
            <button onClick={handleNext} className="w-full flex items-center justify-center gap-2 py-4 bg-rose-600 text-white rounded-2xl font-semibold cursor-pointer">
              {questionsAnswered < totalQuestions ? "下一题" : "查看结果"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </footer>
      )}

      {/* Tips */}
      <div className="px-4 pb-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p><span className="font-bold">规则动词</span>: 词干 + -e/-st/-t/-en/-t/-en</p>
              <p><span className="font-bold">sein/haben</span>: 不规则变位，需要特别记忆</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
