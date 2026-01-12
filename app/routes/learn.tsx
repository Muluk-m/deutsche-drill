import type { Route } from "./+types/learn";
import { Link } from "react-router";
import { useState, useEffect } from "react";

interface Word {
  word: string;
  zh_cn: string;
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "顺序学习 - Deutsch Wörter" }];
}

export default function Learn() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showChinese, setShowChinese] = useState(false);
  const [mode, setMode] = useState<"learn" | "test">("learn");
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);

  useEffect(() => {
    // 加载单词数据
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setWords(data);
        // 加载已学习的单词
        const learned = JSON.parse(
          localStorage.getItem("learnedWords") || "[]"
        ) as string[];
        setLearnedWords(learned);
        // 找到第一个未学习的单词
        const firstUnlearned = data.findIndex(
          (w: Word) => !learned.includes(w.word)
        );
        if (firstUnlearned !== -1) {
          setCurrentIndex(firstUnlearned);
        }
      });
  }, []);

  const currentWord = words[currentIndex];

  const handlePronounce = () => {
    if (!currentWord) return;
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = "de-DE";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleShowChinese = () => {
    setShowChinese(!showChinese);
  };

  const handleSwitchToTest = () => {
    setMode("test");
    setUserInput("");
    setIsCorrect(null);
  };

  const handleCheckAnswer = () => {
    const normalizedInput = userInput.trim().toLowerCase();
    const normalizedAnswer = currentWord.word.toLowerCase();
    const correct = normalizedInput === normalizedAnswer;
    setIsCorrect(correct);

    if (correct) {
      // 标记为已学习
      const updated = [...learnedWords, currentWord.word];
      setLearnedWords(updated);
      localStorage.setItem("learnedWords", JSON.stringify(updated));

      // 更新今日学习数
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
      setShowChinese(false);
      setMode("learn");
      setUserInput("");
      setIsCorrect(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowChinese(false);
      setMode("learn");
      setUserInput("");
      setIsCorrect(null);
    }
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

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <div className="text-gray-600">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>返回</span>
          </Link>
          <div className="text-sm text-gray-600">
            {currentIndex + 1} / {words.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {mode === "learn" ? (
            <>
              {/* Learn Mode */}
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-gray-800 mb-6">
                  {currentWord.word}
                </div>

                <button
                  onClick={handlePronounce}
                  className="mb-6 w-16 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                </button>

                <div className="min-h-[60px] mb-6">
                  {showChinese ? (
                    <div className="text-2xl text-gray-600 animate-fadeIn">
                      {currentWord.zh_cn}
                    </div>
                  ) : (
                    <button
                      onClick={handleShowChinese}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      点击显示中文释义
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSwitchToTest}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
                >
                  开始拼写测试
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Test Mode */}
              <div className="text-center mb-8">
                <div className="text-2xl text-gray-600 mb-4">
                  {currentWord.zh_cn}
                </div>
                <button
                  onClick={handlePronounce}
                  className="mb-6 w-14 h-14 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center mx-auto transition-all active:scale-95"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                </button>

                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="请输入德语单词..."
                  disabled={isCorrect !== null}
                  className="w-full text-center text-3xl font-bold border-2 border-gray-300 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500 disabled:bg-gray-50 text-gray-900 disabled:text-gray-500"
                  autoFocus
                />

                {isCorrect !== null && (
                  <div
                    className={`mt-4 text-lg font-medium animate-fadeIn ${
                      isCorrect ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isCorrect ? (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl">✓</span>
                        <span>正确！</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <span className="text-2xl">✗</span>
                          <span>答错了</span>
                        </div>
                        <div className="text-gray-600">
                          正确答案：
                          <span className="font-bold text-gray-800">
                            {currentWord.word}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isCorrect === null ? (
                <button
                  onClick={handleCheckAnswer}
                  disabled={!userInput.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  检查答案
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
                >
                  下一个单词
                </button>
              )}
            </>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 bg-white text-gray-700 py-3 rounded-xl font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一个
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === words.length - 1}
            className="flex-1 bg-white text-gray-700 py-3 rounded-xl font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一个
          </button>
        </div>

        {/* Learning Tip */}
        {mode === "learn" && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="text-xl">💡</div>
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">学习建议</p>
                <p>1. 先听发音，模仿读几遍</p>
                <p>2. 理解中文意思</p>
                <p>3. 尝试拼写测试，加深记忆</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
