import type { Route } from "./+types/practice-plural";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { PageContainer } from "../components/PageContainer";
import { BackButton } from "../components/BackButton";
import { AnswerInput } from "../components/AnswerInput";
import { parseGermanWord, buildPluralForm } from "../utils/wordParser";
import { recordStudySession, saveTestResult } from "../utils/storageManager";

export function meta({}: Route.MetaArgs) {
  return [{ title: "复数练习 - Deutsch Wörter" }];
}

export default function PracticePlural() {
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [pluralWords, setPluralWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());

  const currentWord = pluralWords[currentIndex];
  const parsed = currentWord ? parseGermanWord(currentWord.word) : null;
  const correctPlural = parsed?.pluralWord;

  // 初始化数据
  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setAllWords(data);

        // 只选择有复数形式的名词
        const wordsWithPlural = data.filter(w => {
          const p = parseGermanWord(w.word);
          return p.plural && p.plural !== '-' && !p.note?.includes('nur Sg');
        });

        // 随机打乱并选择40个
        const shuffled = [...wordsWithPlural].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 40);
        setPluralWords(selected);
      });
  }, []);

  const handleCheckAnswer = () => {
    if (!correctPlural) return;

    // 检查答案（忽略大小写，忽略前面的 die）
    const normalized = userInput.trim().toLowerCase();
    const correctNormalized = correctPlural.toLowerCase();
    const correctWithDie = `die ${correctPlural}`.toLowerCase();

    const correct = normalized === correctNormalized || normalized === correctWithDie;
    setIsCorrect(correct);

    if (correct) {
      setScore({ correct: score.correct + 1, total: score.total + 1 });
      recordStudySession(true);
    } else {
      setScore({ correct: score.correct, total: score.total + 1 });
      recordStudySession(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < pluralWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput("");
      setIsCorrect(null);
      setShowHint(false);
    } else {
      // 练习完成
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      saveTestResult({
        mode: 'plural',
        date: new Date().toISOString(),
        correct: score.correct + (isCorrect ? 1 : 0),
        total: score.total + 1,
        accuracy: ((score.correct + (isCorrect ? 1 : 0)) / (score.total + 1)) * 100,
        timeSpent,
      });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    setIsCorrect(false);
    setScore({ correct: score.correct, total: score.total + 1 });
    recordStudySession(false);
  };

  const getHint = () => {
    if (!parsed || !parsed.plural) return '';
    return `变化规则：${parsed.plural}`;
  };

  // 练习完成
  if (currentIndex >= pluralWords.length && pluralWords.length > 0) {
    const accuracy = Math.round((score.correct / score.total) * 100);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    return (
      <PageContainer>
        <BackButton />
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {accuracy >= 90 ? '🏆' : accuracy >= 70 ? '🎉' : '💪'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            复数练习完成！
          </h2>
          <p className="text-gray-600 mb-6">
            {accuracy >= 90
              ? '优秀！你对德语复数规则掌握得很好！'
              : accuracy >= 70
              ? '不错！继续练习！'
              : '加油！复数变化需要多练习！'}
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-3xl font-bold text-green-600">
                {score.correct}
              </div>
              <div className="text-sm text-gray-600">正确</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-3xl font-bold text-red-600">
                {score.total - score.correct}
              </div>
              <div className="text-sm text-gray-600">错误</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-3xl font-bold text-blue-600">
                {accuracy}%
              </div>
              <div className="text-sm text-gray-600">正确率</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-3xl font-bold text-purple-600">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600">用时</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              to="/"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              返回首页
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              再练一次
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // 加载中
  if (!currentWord || !parsed || !correctPlural) {
    return (
      <PageContainer>
        <BackButton />
        <div className="text-center py-12">
          <div className="text-gray-600">准备中...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton />

      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            进度: {currentIndex + 1} / {pluralWords.length}
          </span>
          <span>
            正确率: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / pluralWords.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        {/* 题目 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔢</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            写出复数形式
          </h2>
          
          {/* 单数形式 */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-8 mb-4">
            <div className="text-sm text-gray-600 mb-2">单数：</div>
            <div className="text-4xl font-bold text-gray-800 mb-3">
              {currentWord.word}
            </div>
            <div className="text-lg text-gray-600">
              {currentWord.zh_cn}
            </div>
          </div>

          {/* 显示提示 */}
          {showHint && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-medium">
                💡 {getHint()}
              </p>
            </div>
          )}
        </div>

        {/* 答题区域 */}
        {isCorrect === null ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                输入复数形式（可以不加 die）：
              </label>
              <AnswerInput
                value={userInput}
                onChange={setUserInput}
                onSubmit={handleCheckAnswer}
                onSkip={handleSkip}
                disabled={false}
                placeholder="例如：Bücher 或 die Bücher"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                {showHint ? '隐藏提示' : '💡 显示提示'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 结果显示 */}
            <div className={`rounded-xl p-6 mb-6 ${
              isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">{isCorrect ? '✓' : '✗'}</div>
                <div className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect ? '正确！' : '错误！'}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">正确答案：</div>
                  <div className="text-2xl font-bold text-gray-800">
                    die {correctPlural}
                  </div>
                </div>
                
                {!isCorrect && userInput && (
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">你的答案：</div>
                    <div className="text-xl text-red-600 font-mono">
                      {userInput}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">变化规则：</div>
                  <div className="text-lg text-gray-800">
                    {parsed.word} <span className="text-blue-600 font-bold">+ {parsed.plural}</span> = {correctPlural}
                  </div>
                </div>
              </div>
            </div>

            {/* 下一题按钮 */}
            <div className="text-center">
              <button
                onClick={handleNext}
                className="bg-teal-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-teal-600 transition-colors"
              >
                {currentIndex < pluralWords.length - 1 ? '下一题 →' : '查看结果'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 复数规则提示 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">💡 常见复数规则</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• <span className="font-bold">-e</span>: 加 -e（如 Tag → Tage）</p>
          <p>• <span className="font-bold">-er</span>: 加 -er（如 Kind → Kinder）</p>
          <p>• <span className="font-bold">-en/-n</span>: 加 -en 或 -n（如 Frau → Frauen）</p>
          <p>• <span className="font-bold">¨-e/¨-er</span>: 元音变音 + 加后缀（如 Buch → Bücher）</p>
          <p>• <span className="font-bold">-s</span>: 加 -s（多为外来词，如 Auto → Autos）</p>
        </div>
      </div>
    </PageContainer>
  );
}

