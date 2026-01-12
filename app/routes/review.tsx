import type { Route } from "./+types/review";
import { Link } from "react-router";
import { useState, useEffect } from "react";

interface Word {
  word: string;
  zh_cn: string;
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "复习模式 - Deutsch Wörter" }];
}

export default function Review() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    // 加载已学习的单词
    fetch("/words.json")
      .then((res) => res.json())
      .then((data) => {
        const learnedWords = JSON.parse(
          localStorage.getItem("learnedWords") || "[]"
        );
        const learned = data.filter((w: Word) => learnedWords.includes(w.word));

        if (learned.length === 0) {
          return;
        }

        // 随机打乱顺序
        const shuffled = learned.sort(() => Math.random() - 0.5);
        setWords(shuffled);
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

  const handleCheckAnswer = () => {
    const normalizedInput = userInput.trim().toLowerCase();
    const normalizedAnswer = currentWord.word.toLowerCase();
    const correct = normalizedInput === normalizedAnswer;
    setIsCorrect(correct);

    if (correct) {
      setCorrectCount(correctCount + 1);
    } else {
      setWrongCount(wrongCount + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput("");
      setIsCorrect(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && userInput && isCorrect === null) {
      handleCheckAnswer();
    }
  };

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
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

          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              还没有学习过的单词
            </h2>
            <p className="text-gray-600 mb-6">请先去学习一些单词吧</p>
            <Link
              to="/learn"
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              开始学习
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return null;
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

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {correctCount}
            </div>
            <div className="text-sm text-gray-600">正确</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{wrongCount}</div>
            <div className="text-sm text-gray-600">错误</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-2xl text-gray-600 mb-4">
              {currentWord.zh_cn}
            </div>
            <button
              onClick={handlePronounce}
              className="mb-6 w-14 h-14 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center mx-auto transition-all active:scale-95"
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
              className="w-full text-center text-3xl font-bold border-2 border-gray-300 rounded-xl py-4 px-6 focus:outline-none focus:border-purple-500 disabled:bg-gray-50 text-gray-900 disabled:text-gray-500"
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
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              检查答案
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={currentIndex === words.length - 1}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentIndex === words.length - 1 ? "复习完成" : "下一个单词"}
            </button>
          )}
        </div>

        {/* Completion Message */}
        {currentIndex === words.length - 1 && isCorrect !== null && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">复习完成！</h3>
            <p className="text-gray-600 mb-4">
              正确率：
              {Math.round((correctCount / (correctCount + wrongCount)) * 100)}%
            </p>
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              返回首页
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
