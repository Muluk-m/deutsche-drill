import type { Route } from "./+types/test-listening";
import { Link, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { useAnswerCheck } from "../hooks/useAnswerCheck";
import { usePronunciation } from "../hooks/usePronunciation";
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

export function meta({}: Route.MetaArgs) {
  return [{ title: "听写模式 - Deutsch Wörter" }];
}

export default function TestListening() {
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
  const [attempts, setAttempts] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [startTime] = useState(Date.now());

  const currentWord = testWords[currentIndex];
  const { checkAnswer } = useAnswerCheck();
  const { pronounce } = usePronunciation();

  // 初始化测试单词
  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setAllWords(data);

        let wordsToTest: Word[];

        if (source === "mistakes") {
          // 从错题本获取
          const mistakes = getMistakesList();
          const mistakeWords = mistakes.map((m) => m.word);
          wordsToTest = data.filter((w) => mistakeWords.includes(w.word));
        } else if (unit) {
          // 从指定单元获取
          wordsToTest = getUnitWords(data, parseInt(unit));
        } else {
          // 全部单词
          wordsToTest = data;
        }

        // 随机抽取指定数量
        const shuffled = [...wordsToTest].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(count, shuffled.length));
        setTestWords(selected);
      });
  }, [unit, count, source]);

  // 自动播放当前单词
  useEffect(() => {
    if (currentWord && autoPlayEnabled && isCorrect === null) {
      // 延迟500ms后播放，给用户准备时间
      const timer = setTimeout(() => {
        pronounce(currentWord.word);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentWord, autoPlayEnabled, isCorrect]);

  const handleCheckAnswer = () => {
    if (!currentWord) return;

    const correct = checkAnswer(userInput, currentWord.word);
    setIsCorrect(correct);
    setAttempts(attempts + 1);

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
      setAttempts(0);
    } else {
      // 测试完成，保存结果
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      saveTestResult({
        mode: "listening",
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

  const handlePlayAgain = () => {
    if (currentWord) {
      pronounce(currentWord.word);
    }
  };

  const handleToggleHint = () => {
    setShowHint(!showHint);
  };

  const handleGiveUp = () => {
    setIsCorrect(false);
    setScore({ correct: score.correct, total: score.total + 1 });
    if (currentWord) {
      addMistake(currentWord.word, userInput || "(放弃)", currentWord.zh_cn);
    }
    recordStudySession(false);
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
            听写测试完成！
          </h2>
          <p className="text-gray-600 mb-6">
            {accuracy >= 90
              ? "太棒了！你的听力和拼写都很出色！"
              : accuracy >= 70
              ? "不错！继续保持练习！"
              : "继续加油！多练习就会进步！"}
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
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{
              width: `${((currentIndex + 1) / testWords.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        {/* 提示信息 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👂</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">听写模式</h2>
          <p className="text-gray-600 mb-6">听发音，输入你听到的德语单词</p>

          {/* 播放按钮 */}
          <div className="flex gap-3 justify-center mb-4">
            <button
              onClick={handlePlayAgain}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <span>🔊</span>
              <span>播放发音</span>
            </button>
            <button
              onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                autoPlayEnabled
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {autoPlayEnabled ? "🔄 自动播放" : "⏸️ 手动播放"}
            </button>
          </div>

          {/* 显示提示 */}
          {showHint && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-medium">
                💡 提示：{currentWord.zh_cn}
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
              disabled={false}
              placeholder="输入德语单词..."
              autoFocus
            />
            <div className="flex gap-2 justify-center mt-4">
              <button
                onClick={handleToggleHint}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                {showHint ? "隐藏提示" : "💡 显示提示"}
              </button>
              {attempts >= 2 && (
                <button
                  onClick={handleGiveUp}
                  className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  🏳️ 放弃本题
                </button>
              )}
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
            <div className="mt-6 text-center">
              <button
                onClick={handleNext}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                {currentIndex < testWords.length - 1 ? "下一题 →" : "查看结果"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 说明 */}
      <div className="text-center text-sm text-gray-500">
        💡 听写模式可以同时锻炼听力和拼写能力
      </div>
    </PageContainer>
  );
}
