import type { Route } from "./+types/test-cn-to-de";
import { Link, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { useAnswerCheck } from "../hooks/useAnswerCheck";
import { PageContainer } from "../components/PageContainer";
import { BackButton } from "../components/BackButton";
import { AnswerInput } from "../components/AnswerInput";
import { AnswerFeedback } from "../components/AnswerFeedback";
import { getUnitWords } from "../utils/unitManager";
import {
  getMistakesList,
  addMistake,
  recordStudySession,
  saveTestResult,
} from "../utils/storageManager";
import { parseGermanWord } from "../utils/wordParser";

export function meta({}: Route.MetaArgs) {
  return [{ title: "中译德模式 - Deutsch Wörter" }];
}

export default function TestCnToDe() {
  const [searchParams] = useSearchParams();
  const unit = searchParams.get("unit");
  const count = parseInt(searchParams.get("count") || "20");
  const source = searchParams.get("source");

  const [allWords, setAllWords] = useState<Word[]>([]);
  const [testWords, setTestWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());

  const currentWord = testWords[currentIndex];
  const { checkAnswer } = useAnswerCheck();

  // 初始化测试单词
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
      setUserInput("");
      setIsCorrect(null);
      setShowHint(false);
    } else {
      // 测试完成
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      saveTestResult({
        mode: "cn-to-de",
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

  // 获取提示（显示单词的首字母）
  const getHint = () => {
    if (!currentWord) return "";
    const parsed = parseGermanWord(currentWord.word);

    if (parsed.article) {
      // 有词性的，显示词性和首字母
      return `${parsed.article} ${parsed.word[0]}...`;
    } else {
      // 没有词性的，只显示首字母
      return `${parsed.word[0]}...`;
    }
  };

  // 测试完成
  if (currentIndex >= testWords.length && testWords.length > 0) {
    const accuracy = Math.round((score.correct / score.total) * 100);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    return (
      <PageContainer>
        <BackButton />
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {accuracy >= 90 ? "🏆" : accuracy >= 70 ? "🎉" : "💪"}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            中译德测试完成！
          </h2>
          <p className="text-gray-600 mb-6">
            {accuracy >= 90
              ? "优秀！你的德语拼写非常准确！"
              : accuracy >= 70
              ? "不错！继续练习！"
              : "加油！多记忆单词拼写会更好！"}
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
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
              <div className="text-sm text-gray-600">用时</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              to="/test-modes"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              返回测试模式
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              再测一次
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // 加载中
  if (!currentWord) {
    return (
      <PageContainer>
        <BackButton />
        <div className="text-center py-12">
          <div className="text-gray-600">准备中...</div>
        </div>
      </PageContainer>
    );
  }

  const parsed = parseGermanWord(currentWord.word);

  return (
    <PageContainer>
      <BackButton />

      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            进度: {currentIndex + 1} / {testWords.length}
          </span>
          <span>
            正确率:{" "}
            {score.total > 0
              ? Math.round((score.correct / score.total) * 100)
              : 0}
            %
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all"
            style={{
              width: `${((currentIndex + 1) / testWords.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        {/* 题目 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🇨🇳➡️🇩🇪</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">中译德模式</h2>

          {/* 中文释义 */}
          <div className="bg-purple-50 rounded-xl p-6 mb-6">
            <div className="text-gray-600 text-sm mb-2">请输入德语单词</div>
            <div className="text-3xl font-bold text-gray-800">
              {currentWord.zh_cn}
            </div>
          </div>

          {/* 提示信息 */}
          {parsed.article && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="text-sm text-blue-800">
                💡 这是一个
                <span
                  className={`font-bold mx-1 ${
                    parsed.article === "der"
                      ? "text-blue-700"
                      : parsed.article === "die"
                      ? "text-pink-700"
                      : "text-purple-700"
                  }`}
                >
                  {parsed.article}
                </span>
                词性的名词，请输入完整形式（含冠词）
              </div>
            </div>
          )}

          {/* 显示提示 */}
          {showHint && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-medium">
                💡 提示：{getHint()}
              </p>
            </div>
          )}
        </div>

        {/* 答题区域 */}
        {isCorrect === null ? (
          <>
            <AnswerInput
              value={userInput}
              onChange={setUserInput}
              onSubmit={handleCheckAnswer}
              onSkip={handleSkip}
              disabled={false}
              placeholder="输入德语单词（含词性，如 der Hund）..."
              autoFocus
            />
            <div className="flex gap-2 justify-center mt-4">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                {showHint ? "隐藏提示" : "💡 显示提示"}
              </button>
            </div>
          </>
        ) : (
          <>
            <AnswerFeedback
              isCorrect={isCorrect}
              correctAnswer={currentWord.word}
              userAnswer={userInput}
              phonetic={currentWord.phonetic}
            />

            {/* 显示详细信息 */}
            {!isCorrect && (
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">记忆提示：</div>
                {parsed.article && (
                  <div className="text-gray-700 mb-1">
                    • 词性：<span className="font-bold">{parsed.article}</span>
                  </div>
                )}
                {parsed.plural && parsed.plural !== "-" && (
                  <div className="text-gray-700">• 复数：{parsed.plural}</div>
                )}
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={handleNext}
                className="bg-purple-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
              >
                {currentIndex < testWords.length - 1 ? "下一题 →" : "查看结果"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 说明 */}
      <div className="text-center text-sm text-gray-500">
        💡 中译德模式需要完整输入德语单词，包括词性（der/die/das）
      </div>
    </PageContainer>
  );
}
