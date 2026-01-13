import type { Route } from "./+types/practice-verbs";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import type { Word, VerbConjugation } from "../types/word";
import { PageContainer } from "../components/PageContainer";
import { BackButton } from "../components/BackButton";
import { AnswerInput } from "../components/AnswerInput";
import { recordStudySession, saveTestResult } from "../utils/storageManager";

export function meta({}: Route.MetaArgs) {
  return [{ title: "动词变位练习 - Deutsch Wörter" }];
}

// 临时示例数据（实际应该从 words.json 中获取）
const sampleVerbs: Array<Word & { verbConjugation: VerbConjugation }> = [
  {
    word: "sein",
    zh_cn: "是，在",
    wordType: "verb",
    verbConjugation: {
      infinitive: "sein",
      present: {
        ich: "bin",
        du: "bist",
        er: "ist",
        wir: "sind",
        ihr: "seid",
        sie: "sind",
      },
    },
  },
  {
    word: "haben",
    zh_cn: "有",
    wordType: "verb",
    verbConjugation: {
      infinitive: "haben",
      present: {
        ich: "habe",
        du: "hast",
        er: "hat",
        wir: "haben",
        ihr: "habt",
        sie: "haben",
      },
    },
  },
  {
    word: "gehen",
    zh_cn: "去，走",
    wordType: "verb",
    verbConjugation: {
      infinitive: "gehen",
      present: {
        ich: "gehe",
        du: "gehst",
        er: "geht",
        wir: "gehen",
        ihr: "geht",
        sie: "gehen",
      },
    },
  },
  {
    word: "machen",
    zh_cn: "做，制作",
    wordType: "verb",
    verbConjugation: {
      infinitive: "machen",
      present: {
        ich: "mache",
        du: "machst",
        er: "macht",
        wir: "machen",
        ihr: "macht",
        sie: "machen",
      },
    },
  },
  {
    word: "kommen",
    zh_cn: "来",
    wordType: "verb",
    verbConjugation: {
      infinitive: "kommen",
      present: {
        ich: "komme",
        du: "kommst",
        er: "kommt",
        wir: "kommen",
        ihr: "kommt",
        sie: "kommen",
      },
    },
  },
];

const pronouns: Array<keyof VerbConjugation['present']> = ['ich', 'du', 'er', 'wir', 'ihr', 'sie'];
const pronounLabels: Record<keyof VerbConjugation['present'], string> = {
  ich: 'ich (我)',
  du: 'du (你)',
  er: 'er/sie/es (他/她/它)',
  wir: 'wir (我们)',
  ihr: 'ihr (你们)',
  sie: 'sie/Sie (他们/您)',
};

export default function PracticeVerbs() {
  const [verbs, setVerbs] = useState<Array<Word & { verbConjugation: VerbConjugation }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPronoun, setCurrentPronoun] = useState<keyof VerbConjugation['present']>('ich');
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showHint, setShowHint] = useState(false);
  const [showConjugationTable, setShowConjugationTable] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [totalQuestions] = useState(30);

  const currentVerb = verbs[currentIndex];
  const correctAnswer = currentVerb?.verbConjugation.present[currentPronoun];

  // 初始化数据
  useEffect(() => {
    // 尝试从 words.json 加载动词数据
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        const verbsWithConjugation = data.filter(
          (w): w is Word & { verbConjugation: VerbConjugation } =>
            w.wordType === 'verb' && w.verbConjugation !== undefined
        );

        if (verbsWithConjugation.length > 0) {
          // 如果有动词数据，使用真实数据
          setVerbs(verbsWithConjugation);
        } else {
          // 否则使用示例数据
          setVerbs(sampleVerbs);
        }
      })
      .catch(() => {
        // 如果加载失败，使用示例数据
        setVerbs(sampleVerbs);
      });
  }, []);

  // 为每道题随机选择动词和人称
  const generateQuestion = () => {
    if (verbs.length === 0) return;

    const randomVerb = Math.floor(Math.random() * verbs.length);
    const randomPronoun = pronouns[Math.floor(Math.random() * pronouns.length)];

    setCurrentIndex(randomVerb);
    setCurrentPronoun(randomPronoun);
    setUserInput("");
    setIsCorrect(null);
    setShowHint(false);
    setShowConjugationTable(false);
  };

  useEffect(() => {
    if (verbs.length > 0) {
      generateQuestion();
    }
  }, [verbs]);

  const handleCheckAnswer = () => {
    if (!correctAnswer) return;

    const normalized = userInput.trim().toLowerCase();
    const correctNormalized = correctAnswer.toLowerCase();
    const correct = normalized === correctNormalized;

    setIsCorrect(correct);

    if (correct) {
      setScore({ correct: score.correct + 1, total: score.total + 1 });
      recordStudySession(true);
    } else {
      setScore({ correct: score.correct, total: score.total + 1 });
      recordStudySession(false);
    }

    setQuestionsAnswered(questionsAnswered + 1);
  };

  const handleNext = () => {
    if (questionsAnswered < totalQuestions) {
      generateQuestion();
    } else {
      // 练习完成
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      saveTestResult({
        mode: 'verb',
        date: new Date().toISOString(),
        correct: score.correct + (isCorrect ? 1 : 0),
        total: score.total + 1,
        accuracy: ((score.correct + (isCorrect ? 1 : 0)) / (score.total + 1)) * 100,
        timeSpent,
      });
      setQuestionsAnswered(questionsAnswered + 1);
    }
  };

  const handleSkip = () => {
    setIsCorrect(false);
    setScore({ correct: score.correct, total: score.total + 1 });
    recordStudySession(false);
    setQuestionsAnswered(questionsAnswered + 1);
  };

  // 练习完成
  if (questionsAnswered > totalQuestions) {
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
            动词变位练习完成！
          </h2>
          <p className="text-gray-600 mb-6">
            {accuracy >= 90
              ? '优秀！你对动词变位掌握得很好！'
              : accuracy >= 70
              ? '不错！继续练习！'
              : '加油！多练习动词变位规则！'}
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
  if (!currentVerb) {
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

      {/* 数据提示 */}
      {verbs.length === sampleVerbs.length && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-bold text-gray-800 mb-1">使用示例数据</h3>
              <p className="text-sm text-gray-700">
                目前使用{sampleVerbs.length}个示例动词。
                若要添加更多动词，请在 words.json 中为动词添加 verbConjugation 字段。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            进度: {questionsAnswered} / {totalQuestions}
          </span>
          <span>
            正确率: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-rose-500 h-2 rounded-full transition-all"
            style={{ width: `${(questionsAnswered / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        {/* 题目 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔄</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            填写正确的动词变位
          </h2>
          
          {/* 动词和人称 */}
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-8 mb-4">
            <div className="text-sm text-gray-600 mb-2">动词不定式：</div>
            <div className="text-4xl font-bold text-gray-800 mb-2">
              {currentVerb.word}
            </div>
            <div className="text-lg text-gray-600 mb-6">
              {currentVerb.zh_cn}
            </div>
            
            <div className="text-sm text-gray-600 mb-2">人称：</div>
            <div className="text-3xl font-bold text-rose-600">
              {pronounLabels[currentPronoun]}
            </div>
          </div>

          {/* 显示提示 */}
          {showHint && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-medium">
                💡 提示：答案以 "{correctAnswer?.[0]}" 开头
              </p>
            </div>
          )}

          {/* 显示变位表 */}
          {showConjugationTable && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
              <div className="text-sm font-bold text-gray-800 mb-3">完整变位表：</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {pronouns.map(p => (
                  <div key={p} className={`flex justify-between ${p === currentPronoun ? 'font-bold text-blue-700' : 'text-gray-700'}`}>
                    <span>{p}:</span>
                    <span>{currentVerb.verbConjugation.present[p]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 答题区域 */}
        {isCorrect === null ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentPronoun} _______
              </label>
              <AnswerInput
                value={userInput}
                onChange={setUserInput}
                onSubmit={handleCheckAnswer}
                onSkip={handleSkip}
                disabled={false}
                placeholder="输入变位形式..."
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
              <button
                onClick={() => setShowConjugationTable(!showConjugationTable)}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                {showConjugationTable ? '隐藏变位表' : '📋 查看变位表'}
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
                    {currentPronoun} {correctAnswer}
                  </div>
                </div>
                
                {!isCorrect && userInput && (
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">你的答案：</div>
                    <div className="text-xl text-red-600 font-mono">
                      {currentPronoun} {userInput}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 下一题按钮 */}
            <div className="text-center">
              <button
                onClick={handleNext}
                className="bg-rose-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-rose-600 transition-colors"
              >
                {questionsAnswered < totalQuestions ? '下一题 →' : '查看结果'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 规则提示 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">💡 常见变位规则</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• <span className="font-bold">规则动词</span>: 词干 + -e/-st/-t/-en/-t/-en</p>
          <p>• <span className="font-bold">sein/haben</span>: 不规则变位，需要特别记忆</p>
          <p>• <span className="font-bold">强变化动词</span>: du/er 人称元音可能变化（如 geben → gibt）</p>
        </div>
      </div>
    </PageContainer>
  );
}

