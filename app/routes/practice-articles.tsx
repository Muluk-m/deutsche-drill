import type { Route } from "./+types/practice-articles";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { PageContainer } from "../components/PageContainer";
import { BackButton } from "../components/BackButton";
import { parseGermanWord } from "../utils/wordParser";
import { recordStudySession, saveTestResult } from "../utils/storageManager";

export function meta({}: Route.MetaArgs) {
  return [{ title: "冠词练习 - Deutsch Wörter" }];
}

const articles = ['der', 'die', 'das'];

export default function PracticeArticles() {
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [nounWords, setNounWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [stats, setStats] = useState({ der: { correct: 0, total: 0 }, die: { correct: 0, total: 0 }, das: { correct: 0, total: 0 } });
  const [startTime] = useState(Date.now());

  const currentWord = nounWords[currentIndex];
  const parsed = currentWord ? parseGermanWord(currentWord.word) : null;

  // 初始化数据
  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setAllWords(data);

        // 只选择有冠词的名词
        const nouns = data.filter(w => {
          const p = parseGermanWord(w.word);
          return p.article && ['der', 'die', 'das'].includes(p.article);
        });

        // 随机打乱并选择50个
        const shuffled = [...nouns].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 50);
        setNounWords(selected);
      });
  }, []);

  const handleSelectArticle = (article: string) => {
    if (!parsed || selectedArticle !== null) return;

    setSelectedArticle(article);
    const correct = article === parsed.article;
    setIsCorrect(correct);

    // 更新统计
    if (correct) {
      setScore({ correct: score.correct + 1, total: score.total + 1 });
    } else {
      setScore({ correct: score.correct, total: score.total + 1 });
    }

    // 更新各冠词统计
    const newStats = { ...stats };
    if (parsed.article === 'der' || parsed.article === 'die' || parsed.article === 'das') {
      newStats[parsed.article].total++;
      if (correct) {
        newStats[parsed.article].correct++;
      }
    }
    setStats(newStats);

    recordStudySession(correct);
  };

  const handleNext = () => {
    if (currentIndex < nounWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedArticle(null);
      setIsCorrect(null);
    } else {
      // 练习完成
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      saveTestResult({
        mode: 'article',
        date: new Date().toISOString(),
        correct: score.correct + (isCorrect ? 1 : 0),
        total: score.total + 1,
        accuracy: ((score.correct + (isCorrect ? 1 : 0)) / (score.total + 1)) * 100,
        timeSpent,
      });
      setCurrentIndex(currentIndex + 1);
    }
  };

  // 练习完成
  if (currentIndex >= nounWords.length && nounWords.length > 0) {
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
            冠词练习完成！
          </h2>
          <p className="text-gray-600 mb-6">
            {accuracy >= 90
              ? '太棒了！你对德语冠词掌握得很好！'
              : accuracy >= 70
              ? '不错！继续练习会更好！'
              : '继续加油！多练习记忆规律！'}
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
              <div className="text-sm text-gray-600">总正确率</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-3xl font-bold text-purple-600">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600">用时</div>
            </div>
          </div>

          {/* 各冠词统计 */}
          <div className="bg-white rounded-xl shadow-md p-6 max-w-md mx-auto mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">各冠词正确率</h3>
            <div className="space-y-3">
              {(['der', 'die', 'das'] as const).map((article) => {
                const s = stats[article];
                const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                return (
                  <div key={article} className="flex items-center justify-between">
                    <span className={`font-bold text-lg ${
                      article === 'der' ? 'text-blue-600' :
                      article === 'die' ? 'text-pink-600' :
                      'text-purple-600'
                    }`}>
                      {article}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            article === 'der' ? 'bg-blue-500' :
                            article === 'die' ? 'bg-pink-500' :
                            'bg-purple-500'
                          }`}
                          style={{ width: `${acc}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {s.correct}/{s.total} ({acc}%)
                    </span>
                  </div>
                );
              })}
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
  if (!currentWord || !parsed) {
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
            进度: {currentIndex + 1} / {nounWords.length}
          </span>
          <span>
            正确率: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / nounWords.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        {/* 题目 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            选择正确的冠词
          </h2>
          
          {/* 单词 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-4">
            <div className="text-sm text-gray-600 mb-2">请为这个名词选择正确的冠词：</div>
            <div className="text-5xl font-bold text-gray-800 mb-3">
              {parsed.word}
            </div>
            <div className="text-xl text-gray-600">
              {currentWord.zh_cn}
            </div>
          </div>
        </div>

        {/* 冠词选项 */}
        {selectedArticle === null ? (
          <div className="grid grid-cols-3 gap-4">
            {articles.map((article) => (
              <button
                key={article}
                onClick={() => handleSelectArticle(article)}
                className={`py-6 rounded-xl border-2 font-bold text-2xl transition-all hover:scale-105 ${
                  article === 'der'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                    : article === 'die'
                    ? 'bg-pink-50 border-pink-300 text-pink-700 hover:bg-pink-100'
                    : 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
                }`}
              >
                {article}
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* 结果显示 */}
            <div className={`rounded-xl p-6 mb-6 ${
              isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">{isCorrect ? '✓' : '✗'}</div>
                <div className={`text-2xl font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect ? '正确！' : '错误！'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg text-gray-700 mb-2">
                  正确答案：
                  <span className={`font-bold text-2xl ml-2 ${
                    parsed.article === 'der' ? 'text-blue-700' :
                    parsed.article === 'die' ? 'text-pink-700' :
                    'text-purple-700'
                  }`}>
                    {parsed.article}
                  </span>
                  <span className="ml-2 text-2xl">{parsed.word}</span>
                </div>
                
                {!isCorrect && (
                  <div className="text-sm text-gray-600 mt-2">
                    你选择的是：<span className="font-bold">{selectedArticle}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 下一题按钮 */}
            <div className="text-center">
              <button
                onClick={handleNext}
                className="bg-indigo-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-600 transition-colors"
              >
                {currentIndex < nounWords.length - 1 ? '下一题 →' : '查看结果'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 记忆提示 */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">💡 记忆小技巧</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• <span className="font-bold text-blue-600">der</span>: 多为阳性，如职业、季节、方向</p>
          <p>• <span className="font-bold text-pink-600">die</span>: 多为阴性，如 -ung, -heit, -keit 结尾的词</p>
          <p>• <span className="font-bold text-purple-600">das</span>: 多为中性，如 -chen, -lein 结尾的词</p>
        </div>
      </div>
    </PageContainer>
  );
}

