import type { Route } from "./+types/random";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import type { Word } from "../types/word";
import { useAnswerCheck } from "../hooks/useAnswerCheck";
import { usePhonetics } from "../hooks/usePhonetics";
import { getUnitWords } from "../utils/unitManager";
import { PageContainer } from "../components/PageContainer";
import { BackButton } from "../components/BackButton";
import { PronunciationButtons } from "../components/PronunciationButtons";
import { AnswerInput } from "../components/AnswerInput";
import { AnswerFeedback } from "../components/AnswerFeedback";
import { StatsCard } from "../components/StatsCard";

export function meta({}: Route.MetaArgs) {
  return [{ title: "随机抽查 - Deutsch Wörter" }];
}

export default function Random() {
  const [searchParams] = useSearchParams();
  const unitId = searchParams.get("unit");

  const [allWords, setAllWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());

  const { checkAnswer } = useAnswerCheck();
  const { phonetic } = usePhonetics(
    currentWord?.word || "",
    currentWord?.phonetic
  );

  const pickRandomWord = (words: Word[], used: Set<number>) => {
    if (words.length === 0) return;

    if (used.size === words.length) {
      used = new Set();
      setUsedIndices(new Set());
    }

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
        // 根据是否有 unitId 参数来决定测试哪些单词
        let wordsToTest: Word[];
        if (unitId) {
          wordsToTest = getUnitWords(data, parseInt(unitId));
        } else {
          wordsToTest = data;
        }

        setAllWords(wordsToTest);
        pickRandomWord(wordsToTest, new Set());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  const handleCheckAnswer = () => {
    if (!currentWord) return;

    const correct = checkAnswer(userInput, currentWord.word);
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
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-4xl mb-4">🎲</div>
            <div className="text-gray-600">加载中...</div>
          </div>
        </div>
      </PageContainer>
    );
  }

  const accuracy =
    score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <div className="text-right">
          {unitId && (
            <div className="text-xs text-gray-500 mb-1">单元 {unitId}</div>
          )}
          <div className="text-sm font-medium text-gray-700">随机抽查</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard value={score.correct} label="正确" color="green" />
        <StatsCard value={score.total} label="总计" color="blue" />
        <StatsCard value={`${accuracy}%`} label="正确率" color="purple" />
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="mb-8">
          {/* 中文释义 */}
          <div className="text-center mb-6">
            <div className="bg-green-50 rounded-xl px-6 py-4">
              <div className="text-2xl text-gray-800 font-medium">
                {currentWord.zh_cn}
              </div>
            </div>
          </div>

          {/* 音标 */}
          {phonetic && (
            <div className="text-center mb-4">
              <div className="text-base text-gray-500 font-mono">
                {phonetic}
              </div>
            </div>
          )}

          {/* 发音按钮 */}
          <div className="mb-6">
            <PronunciationButtons
              word={currentWord.word}
              singularColor="green"
              pluralColor="emerald"
            />
          </div>

          {/* 输入框 */}
          <AnswerInput
            value={userInput}
            onChange={setUserInput}
            onKeyPress={handleKeyPress}
            disabled={isCorrect !== null}
            borderColor="green"
          />

          {/* 答案反馈 */}
          {isCorrect !== null && (
            <AnswerFeedback
              isCorrect={isCorrect}
              correctWord={currentWord.word}
            />
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
    </PageContainer>
  );
}
