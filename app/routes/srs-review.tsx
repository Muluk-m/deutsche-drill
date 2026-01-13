import type { Route } from "./+types/srs-review";
import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import type { Word, WordSRSProgress } from "../types/word";
import { useAnswerCheck } from "../hooks/useAnswerCheck";
import { usePhonetics } from "../hooks/usePhonetics";
import { PageContainer } from "../components/PageContainer";
import { BackButton } from "../components/BackButton";
import { PronunciationButtons } from "../components/PronunciationButtons";
import { AnswerInput } from "../components/AnswerInput";
import { AnswerFeedback } from "../components/AnswerFeedback";
import {
  getSRSProgress,
  updateWordSRSProgress,
  addMistake,
  recordStudySession,
  needsMigration,
  migrateData,
} from "../utils/storageManager";
import { getDueWords, updateSRSProgress, formatNextReview } from "../utils/srsAlgorithm";

export function meta({}: Route.MetaArgs) {
  return [{ title: "智能复习 - Deutsch Wörter" }];
}

export default function SRSReview() {
  const navigate = useNavigate();
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [dueWords, setDueWords] = useState<WordSRSProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showQualityRating, setShowQualityRating] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const currentProgress = dueWords[currentIndex];
  const currentWord = currentProgress
    ? allWords.find((w) => w.word === currentProgress.word)
    : null;

  const { checkAnswer } = useAnswerCheck();
  const { phonetic } = usePhonetics(
    currentWord?.word || "",
    currentWord?.phonetic
  );

  // 初始化数据
  useEffect(() => {
    // 检查是否需要迁移旧数据
    if (needsMigration()) {
      migrateData();
    }

    // 加载单词数据
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setAllWords(data);

        // 获取到期单词
        const srsProgress = getSRSProgress();
        const due = getDueWords(srsProgress);
        setDueWords(due);

        if (due.length === 0) {
          // 没有到期单词
        }
      });
  }, []);

  const handleCheckAnswer = () => {
    if (!currentWord) return;

    const correct = checkAnswer(userInput, currentWord.word);
    setIsCorrect(correct);

    if (!correct) {
      // 记录错误
      addMistake(currentWord.word, userInput, currentWord.zh_cn);
    }

    // 答题后显示质量评分界面
    setShowQualityRating(true);
  };

  const handleQualityRating = (quality: number) => {
    if (!currentProgress) return;

    // 根据答案正确性调整质量分数
    let adjustedQuality = quality;
    if (!isCorrect && quality >= 3) {
      // 如果答错但评分为 Good/Easy，自动降低为 Hard
      adjustedQuality = Math.min(quality, 2);
    }

    // 更新 SRS 进度
    const newProgress = updateSRSProgress(currentProgress, adjustedQuality);
    updateWordSRSProgress(newProgress);

    // 记录统计
    recordStudySession(isCorrect || false);

    // 更新计数
    setReviewedCount(reviewedCount + 1);
    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }

    // 进入下一个单词
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < dueWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput("");
      setIsCorrect(null);
      setShowQualityRating(false);
    } else {
      // 全部复习完成
      setCurrentIndex(currentIndex + 1); // 触发完成状态
    }
  };

  const handleSkip = () => {
    if (!currentProgress) return;

    // 跳过等同于"困难"评分
    const newProgress = updateSRSProgress(currentProgress, 1);
    updateWordSRSProgress(newProgress);

    handleNext();
  };

  // 没有到期单词
  if (allWords.length > 0 && dueWords.length === 0) {
    return (
      <PageContainer>
        <BackButton />
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            太棒了！
          </h2>
          <p className="text-gray-600 mb-6">
            暂时没有需要复习的单词
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </PageContainer>
    );
  }

  // 复习完成
  if (currentIndex >= dueWords.length && dueWords.length > 0) {
    const accuracy = reviewedCount > 0
      ? Math.round((correctCount / reviewedCount) * 100)
      : 0;

    return (
      <PageContainer>
        <BackButton />
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            复习完成！
          </h2>
          <p className="text-gray-600 mb-6">
            今天的复习任务已完成
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-blue-600">
                {reviewedCount}
              </div>
              <div className="text-sm text-gray-600">已复习</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-green-600">
                {correctCount}
              </div>
              <div className="text-sm text-gray-600">正确</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-2xl font-bold text-purple-600">
                {accuracy}%
              </div>
              <div className="text-sm text-gray-600">正确率</div>
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
              继续复习
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
          <div className="text-gray-600">加载中...</div>
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
            复习进度: {currentIndex + 1} / {dueWords.length}
          </span>
          <span>正确率: {reviewedCount > 0 ? Math.round((correctCount / reviewedCount) * 100) : 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / dueWords.length) * 100}%` }}
          />
        </div>
      </div>

      {/* SRS 信息 */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            <span className="font-medium">熟练度:</span> {currentProgress.repetitions} 次
          </div>
          <div className="text-gray-600">
            <span className="font-medium">间隔:</span> {currentProgress.interval} 天
          </div>
          <div className="text-blue-600 font-medium">
            {formatNextReview(currentProgress.nextReview)}
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        {/* 中文释义 */}
        <div className="text-center mb-8">
          <div className="text-gray-500 text-sm mb-2">请输入德语单词</div>
          <div className="text-3xl font-bold text-gray-800 mb-4">
            {currentWord.zh_cn}
          </div>

          {/* 发音按钮 */}
          {!showQualityRating && (
            <PronunciationButtons
              word={currentWord.word}
              phonetic={phonetic}
              onPronounce={() => {}}
            />
          )}
        </div>

        {/* 答题区域 */}
        {!showQualityRating ? (
          <AnswerInput
            value={userInput}
            onChange={setUserInput}
            onSubmit={handleCheckAnswer}
            onSkip={handleSkip}
            disabled={isCorrect !== null}
            placeholder="输入德语单词..."
          />
        ) : (
          <>
            {/* 显示答案 */}
            <div className="mb-6">
              <AnswerFeedback
                isCorrect={isCorrect || false}
                correctAnswer={currentWord.word}
                userAnswer={userInput}
                phonetic={phonetic}
              />
            </div>

            {/* 质量评分 */}
            <div className="border-t pt-6">
              <h3 className="text-center text-lg font-bold text-gray-800 mb-4">
                这个单词对你来说有多难？
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleQualityRating(0)}
                  className="bg-red-50 text-red-700 py-4 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors border-2 border-red-200"
                >
                  <div className="text-lg font-bold">😵 完全忘了</div>
                  <div className="text-sm opacity-75">Again - 1分钟后</div>
                </button>
                <button
                  onClick={() => handleQualityRating(2)}
                  className="bg-orange-50 text-orange-700 py-4 px-4 rounded-lg font-medium hover:bg-orange-100 transition-colors border-2 border-orange-200"
                >
                  <div className="text-lg font-bold">🤔 有点难</div>
                  <div className="text-sm opacity-75">Hard - 1天后</div>
                </button>
                <button
                  onClick={() => handleQualityRating(4)}
                  className="bg-green-50 text-green-700 py-4 px-4 rounded-lg font-medium hover:bg-green-100 transition-colors border-2 border-green-200"
                >
                  <div className="text-lg font-bold">👍 还不错</div>
                  <div className="text-sm opacity-75">Good - 正常间隔</div>
                </button>
                <button
                  onClick={() => handleQualityRating(5)}
                  className="bg-blue-50 text-blue-700 py-4 px-4 rounded-lg font-medium hover:bg-blue-100 transition-colors border-2 border-blue-200"
                >
                  <div className="text-lg font-bold">😄 很简单</div>
                  <div className="text-sm opacity-75">Easy - 延长间隔</div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 提示信息 */}
      {!showQualityRating && (
        <div className="text-center text-sm text-gray-500">
          💡 提示：根据难度评分，系统会智能安排下次复习时间
        </div>
      )}
    </PageContainer>
  );
}

