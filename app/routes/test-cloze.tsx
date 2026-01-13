import type { Route } from "./+types/test-cloze";
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
  return [{ title: "填空练习 - Deutsch Wörter" }];
}

// 简单的例句模板（真实应用中应该从数据库或API获取）
const sentenceTemplates = [
  { pattern: "Ich habe ____ gekauft.", meaning: "我买了____。" },
  { pattern: "Das ist ____.", meaning: "这是____。" },
  { pattern: "Ich mag ____.", meaning: "我喜欢____。" },
  { pattern: "Wo ist ____?", meaning: "____在哪里？" },
  { pattern: "Ich brauche ____.", meaning: "我需要____。" },
  { pattern: "Das ist mein ____.", meaning: "这是我的____。" },
  { pattern: "Ich suche ____.", meaning: "我在找____。" },
  { pattern: "Kennst du ____?", meaning: "你认识/知道____吗？" },
];

export default function TestCloze() {
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
  const [currentSentence, setCurrentSentence] = useState({
    pattern: "",
    meaning: "",
  });
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

        // 只选择名词（有可能构成句子的单词）
        const nounWords = wordsToTest.filter((w) => {
          const parsed = parseGermanWord(w.word);
          return parsed.article !== undefined; // 有词性的通常是名词
        });

        // 如果名词不够，就用全部单词
        const finalWords = nounWords.length >= count ? nounWords : wordsToTest;

        const shuffled = [...finalWords].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(count, shuffled.length));
        setTestWords(selected);
      });
  }, [unit, count, source]);

  // 为当前单词生成句子
  useEffect(() => {
    if (currentWord) {
      generateSentence();
    }
  }, [currentIndex, currentWord]);

  const generateSentence = () => {
    // 随机选择一个句子模板
    const template =
      sentenceTemplates[Math.floor(Math.random() * sentenceTemplates.length)];
    setCurrentSentence(template);
    setUserInput("");
    setIsCorrect(null);
    setShowHint(false);
  };

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
    } else {
      // 测试完成
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      saveTestResult({
        mode: "cloze",
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
            填空练习完成！
          </h2>
          <p className="text-gray-600 mb-6">
            {accuracy >= 90
              ? "完美！你对单词的应用能力很强！"
              : accuracy >= 70
              ? "很好！继续练习语境理解！"
              : "加油！多练习会更好地理解单词用法！"}
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
            className="bg-orange-500 h-2 rounded-full transition-all"
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
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">填空练习</h2>

          {/* 句子模板 */}
          <div className="bg-orange-50 rounded-xl p-6 mb-4">
            <div className="text-sm text-gray-600 mb-2">德语句子：</div>
            <div className="text-2xl font-bold text-gray-800 mb-4 font-mono">
              {currentSentence.pattern}
            </div>
            <div className="text-sm text-gray-600 mb-2">中文意思：</div>
            <div className="text-lg text-gray-700">
              {currentSentence.meaning.replace(
                "____",
                `____（${currentWord.zh_cn}）`
              )}
            </div>
          </div>

          {/* 显示提示 */}
          {showHint && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-medium">
                💡 提示：填入「{currentWord.zh_cn}」的德语
                {parsed.article && `（${parsed.article} 词性）`}
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
              placeholder="输入德语单词（含词性）..."
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

            {/* 显示完整句子 */}
            <div className="mt-6 bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">完整句子：</div>
              <div className="text-lg font-bold text-gray-800">
                {currentSentence.pattern.replace("____", currentWord.word)}
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleNext}
                className="bg-orange-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                {currentIndex < testWords.length - 1 ? "下一题 →" : "查看结果"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 说明 */}
      <div className="text-center text-sm text-gray-500">
        💡 填空练习帮助你在语境中理解和使用单词
      </div>
    </PageContainer>
  );
}
