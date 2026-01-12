import type { Route } from "./+types/random";
import { Link } from "react-router";
import { useState, useEffect } from "react";

interface Word {
  word: string;
  zh_cn: string;
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "随机抽查 - Deutsch Wörter" }];
}

export default function Random() {
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());

  const pickRandomWord = (words: Word[], used: Set<number>) => {
    if (words.length === 0) return;

    // 如果所有单词都用过了，重置
    if (used.size === words.length) {
      used = new Set();
      setUsedIndices(new Set());
    }

    // 随机选择一个未使用的单词
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * words.length);
    } while (used.has(randomIndex));

    setCurrentWord(words[randomIndex]);
    setUsedIndices(new Set([...used, randomIndex]));
  };

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setAllWords(data);
        pickRandomWord(data, new Set());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePronounce = () => {
    if (!currentWord) return;
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = "de-DE";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleCheckAnswer = () => {
    if (!currentWord) return;

    const normalizedInput = userInput.trim().toLowerCase();
    const normalizedAnswer = currentWord.word.toLowerCase();
    const correct = normalizedInput === normalizedAnswer;
    setIsCorrect(correct);

    setScore({
      correct: score.correct + (correct ? 1 : 0),
      total: score.total + 1,
    });
  };

  const handleNext = () => {
    pickRandomWord(allWords, usedIndices);
    setUserInput("");
    setIsCorrect(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && userInput && isCorrect === null) {
      handleCheckAnswer();
    }
  };

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎲</div>
          <div className="text-gray-600">加载中...</div>
        </div>
      </div>
    );
  }

  const accuracy =
    score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

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
          <div className="text-sm font-medium text-gray-700">随机抽查</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {score.correct}
            </div>
            <div className="text-xs text-gray-600">正确</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {score.total}
            </div>
            <div className="text-xs text-gray-600">总计</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {accuracy}%
            </div>
            <div className="text-xs text-gray-600">正确率</div>
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
              className="mb-6 w-14 h-14 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto transition-all active:scale-95"
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
              className="w-full text-center text-3xl font-bold border-2 border-gray-300 rounded-xl py-4 px-6 focus:outline-none focus:border-green-500 disabled:bg-gray-50 text-gray-900 disabled:text-gray-500"
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
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              检查答案
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
            >
              下一个单词
            </button>
          )}
        </div>

        {/* Random Tip */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="text-xl">🎲</div>
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">随机抽查模式</p>
              <p>从词库中随机抽取单词进行测试，帮助你检验学习效果</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
