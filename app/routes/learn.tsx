import type { Route } from "./+types/learn";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { parseGermanWord, buildPluralForm } from "../utils/wordParser";
import type { Word } from "../types/word";
import { useAnswerCheck } from "../hooks/useAnswerCheck";
import { usePhonetics } from "../hooks/usePhonetics";
import { getUnitWords } from "../utils/unitManager";
import { PageContainer } from "../components/PageContainer";
import { BackButton } from "../components/BackButton";
import { ProgressBar } from "../components/ProgressBar";
import { PronunciationButtons } from "../components/PronunciationButtons";
import { AnswerInput } from "../components/AnswerInput";
import { AnswerFeedback } from "../components/AnswerFeedback";

export function meta({}: Route.MetaArgs) {
  return [{ title: "顺序学习 - Deutsch Wörter" }];
}

export default function Learn() {
  const [searchParams] = useSearchParams();
  const unitId = searchParams.get("unit");
  const indexParam = searchParams.get("index");

  const [allWords, setAllWords] = useState<Word[]>([]);
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

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setAllWords(data);

        // 根据是否有 unitId 参数来决定显示哪些单词
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

        // 如果有 index 参数，直接跳转到该单词
        if (indexParam !== null) {
          const targetIndex = parseInt(indexParam);
          if (targetIndex >= 0 && targetIndex < wordsToLearn.length) {
            setCurrentIndex(targetIndex);
            return;
          }
        }

        // 否则跳转到第一个未学习的单词
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

  if (!currentWord) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-4xl mb-4">📚</div>
            <div className="text-gray-600">加载中...</div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <div className="text-right">
          {unitId && (
            <div className="text-xs text-gray-500 mb-1">单元 {unitId}</div>
          )}
          <div className="text-sm text-gray-600">
            {currentIndex + 1} / {words.length}
          </div>
        </div>
      </div>

      <ProgressBar
        current={currentIndex + 1}
        total={words.length}
        colorFrom="from-blue-500"
        colorTo="to-purple-500"
      />

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        {mode === "learn" ? (
          <>
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-gray-800 mb-2">
                {currentWord.word}
              </div>

              {phonetic && (
                <div className="text-lg text-gray-500 mb-3 font-mono">
                  {phonetic}
                </div>
              )}

              {(() => {
                const parsed = parseGermanWord(currentWord.word);
                if (parsed.plural && parsed.plural !== "-") {
                  const pluralForm = buildPluralForm(
                    parsed.word,
                    parsed.plural
                  );
                  return (
                    <div className="text-sm text-gray-500 mb-4">
                      复数: {pluralForm}
                    </div>
                  );
                }
                return null;
              })()}

              <PronunciationButtons
                word={currentWord.word}
                singularColor="blue"
                pluralColor="purple"
              />

              <div className="min-h-[60px] mb-6">
                {showChinese ? (
                  <div className="text-2xl text-gray-600 animate-fadeIn">
                    {currentWord.zh_cn}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowChinese(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    点击显示中文释义
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setMode("test");
                setUserInput("");
                setIsCorrect(null);
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
            >
              开始拼写测试
            </button>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="text-2xl text-gray-600 mb-4">
                {currentWord.zh_cn}
              </div>

              <PronunciationButtons
                word={currentWord.word}
                singularColor="blue"
                pluralColor="purple"
              />

              <AnswerInput
                value={userInput}
                onChange={setUserInput}
                onKeyPress={handleKeyPress}
                disabled={isCorrect !== null}
                borderColor="blue"
              />

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
    </PageContainer>
  );
}
