import type { Route } from "./+types/test-choice";
import { Link, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { usePronunciation } from "../hooks/usePronunciation";
import { PageContainer } from "../components/PageContainer";
import { BackButton } from "../components/BackButton";
import { getUnitWords } from "../utils/unitManager";
import {
  getMistakesList,
  addMistake,
  recordStudySession,
  saveTestResult,
} from "../utils/storageManager";
import { parseGermanWord } from "../utils/wordParser";

export function meta({}: Route.MetaArgs) {
  return [{ title: "选择题模式 - Deutsch Wörter" }];
}

interface Choice {
  word: Word;
  isCorrect: boolean;
}

export default function TestChoice() {
  const [searchParams] = useSearchParams();
  const unit = searchParams.get("unit");
  const count = parseInt(searchParams.get("count") || "20");
  const source = searchParams.get("source");

  const [allWords, setAllWords] = useState<Word[]>([]);
  const [testWords, setTestWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [startTime] = useState(Date.now());

  const currentWord = testWords[currentIndex];
  const { pronounce } = usePronunciation();

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

  // 为当前单词生成选项
  useEffect(() => {
    if (currentWord && allWords.length > 0) {
      generateChoices(currentWord);
    }
  }, [currentIndex, currentWord, allWords]);

  const generateChoices = (correctWord: Word) => {
    const parsed = parseGermanWord(correctWord.word);

    // 获取同词性的单词作为干扰项（如果有词性）
    let potentialDistractions = allWords.filter((w) => {
      if (w.word === correctWord.word) return false;

      // 如果有词性，优先选择同词性的
      if (parsed.article) {
        const wParsed = parseGermanWord(w.word);
        return wParsed.article === parsed.article;
      }

      return true;
    });

    // 如果同词性的不够，就从所有单词中选
    if (potentialDistractions.length < 3) {
      potentialDistractions = allWords.filter(
        (w) => w.word !== correctWord.word
      );
    }

    // 随机选择3个干扰项
    const shuffled = [...potentialDistractions].sort(() => Math.random() - 0.5);
    const distractions = shuffled.slice(0, 3);

    // 组合正确答案和干扰项
    const allChoices: Choice[] = [
      { word: correctWord, isCorrect: true },
      ...distractions.map((w) => ({ word: w, isCorrect: false })),
    ];

    // 打乱顺序
    setChoices(allChoices.sort(() => Math.random() - 0.5));
    setSelectedChoice(null);
    setIsCorrect(null);
  };

  const handleSelectChoice = (index: number) => {
    if (selectedChoice !== null) return; // 已经选择过了

    setSelectedChoice(index);
    const correct = choices[index].isCorrect;
    setIsCorrect(correct);

    if (correct) {
      setScore({ correct: score.correct + 1, total: score.total + 1 });
      recordStudySession(true);
    } else {
      setScore({ correct: score.correct, total: score.total + 1 });
      addMistake(currentWord.word, choices[index].word.word, currentWord.zh_cn);
      recordStudySession(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < testWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 测试完成
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      saveTestResult({
        mode: "choice",
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

  const handlePronounce = () => {
    if (currentWord) {
      pronounce(currentWord.word);
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
            选择题测试完成！
          </h2>
          <p className="text-gray-600 mb-6">
            {accuracy >= 90
              ? "完美！你对单词的理解非常到位！"
              : accuracy >= 70
              ? "很好！继续保持！"
              : "加油！多复习会更好！"}
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
  if (!currentWord || choices.length === 0) {
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
            className="bg-green-500 h-2 rounded-full transition-all"
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
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            选择正确的德语单词
          </h2>

          {/* 中文释义 */}
          <div className="bg-blue-50 rounded-xl p-6 mb-4">
            <div className="text-3xl font-bold text-gray-800">
              {currentWord.zh_cn}
            </div>
          </div>

          {/* 发音按钮 */}
          <button
            onClick={handlePronounce}
            className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
          >
            🔊 播放发音
          </button>
        </div>

        {/* 选项 */}
        <div className="grid gap-3 mb-6">
          {choices.map((choice, index) => {
            const isSelected = selectedChoice === index;
            const showResult = selectedChoice !== null;

            let bgColor = "bg-gray-50 hover:bg-gray-100 border-gray-200";
            if (showResult) {
              if (choice.isCorrect) {
                bgColor = "bg-green-100 border-green-500";
              } else if (isSelected) {
                bgColor = "bg-red-100 border-red-500";
              } else {
                bgColor = "bg-gray-100 border-gray-200";
              }
            } else if (isSelected) {
              bgColor = "bg-blue-100 border-blue-500";
            }

            return (
              <button
                key={index}
                onClick={() => handleSelectChoice(index)}
                disabled={selectedChoice !== null}
                className={`p-4 rounded-xl border-2 transition-all text-left ${bgColor} ${
                  selectedChoice === null ? "hover:scale-102" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xl font-bold text-gray-800 mb-1">
                      {choice.word.word}
                    </div>
                    {showResult && (
                      <div className="text-sm text-gray-600">
                        {choice.word.zh_cn}
                      </div>
                    )}
                  </div>
                  {showResult && choice.isCorrect && (
                    <span className="text-2xl">✓</span>
                  )}
                  {showResult && isSelected && !choice.isCorrect && (
                    <span className="text-2xl">✗</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 下一题按钮 */}
        {selectedChoice !== null && (
          <div className="text-center">
            <button
              onClick={handleNext}
              className="bg-green-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              {currentIndex < testWords.length - 1 ? "下一题 →" : "查看结果"}
            </button>
          </div>
        )}
      </div>

      {/* 说明 */}
      <div className="text-center text-sm text-gray-500">
        💡 选择题模式可以快速测试单词理解能力
      </div>
    </PageContainer>
  );
}
