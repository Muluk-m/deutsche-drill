import type { Route } from "./+types/word.$word";
import { useParams, useNavigate, Link } from "react-router";
import { useState, useEffect } from "react";
import type { Word, VerbConjugation } from "../types/word";
import { parseWord, buildPluralForm } from "../utils/wordParser";
import { usePronunciation } from "../hooks/usePronunciation";
import {
  getLearnedWords,
  isFavorite,
  addFavorite,
  removeFavorite,
  getWordSRSProgress,
} from "../utils/storageManager";
import {
  ChevronLeft,
  Volume2,
  Star,
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  Target,
  ArrowRight,
} from "lucide-react";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `${params.word || "单词"} - Deutsch Wörter` }];
}

export default function WordDetail() {
  const { word: wordParam } = useParams();
  const navigate = useNavigate();
  const { pronounce } = usePronunciation();

  const [wordData, setWordData] = useState<Word | null>(null);
  const [isLearned, setIsLearned] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [srsInfo, setSrsInfo] = useState<{
    nextReview: string | null;
    interval: number;
    repetitions: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wordParam) return;

    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        const found = data.find(
          (w) => w.word.toLowerCase() === decodeURIComponent(wordParam).toLowerCase()
        );
        setWordData(found || null);

        if (found) {
          const learned = getLearnedWords();
          setIsLearned(learned.includes(found.word));
          setIsFav(isFavorite(found.word));

          const srs = getWordSRSProgress(found.word);
          if (srs) {
            setSrsInfo({
              nextReview: srs.nextReview,
              interval: srs.interval,
              repetitions: srs.repetitions,
            });
          }
        }
        setLoading(false);
      });
  }, [wordParam]);

  const handleToggleFavorite = () => {
    if (!wordData) return;

    if (isFav) {
      removeFavorite(wordData.word);
      setIsFav(false);
    } else {
      addFavorite(wordData.word, wordData.zh_cn);
      setIsFav(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!wordData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            未找到单词
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            "{wordParam}" 不在词库中
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium cursor-pointer hover:bg-blue-700 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  const parsed = parseWord(wordData);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            单词详情
          </h1>
          <button
            onClick={handleToggleFavorite}
            className={`p-2 -mr-2 cursor-pointer transition-colors ${
              isFav
                ? "text-amber-500"
                : "text-gray-400 dark:text-gray-500 hover:text-amber-500"
            }`}
          >
            <Star className={`w-6 h-6 ${isFav ? "fill-current" : ""}`} />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Word Card */}
        <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700">
          {/* Article Badge */}
          {wordData.article && (
            <div className="flex justify-center mb-4">
              <span
                className={`px-5 py-2 rounded-full text-sm font-bold text-white ${
                  wordData.article === "der"
                    ? "bg-blue-500"
                    : wordData.article === "die"
                    ? "bg-pink-500"
                    : "bg-violet-500"
                }`}
              >
                {wordData.article}
              </span>
            </div>
          )}

          {/* Word */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
            {wordData.word}
          </h1>

          {/* Phonetic */}
          {wordData.phonetic && (
            <p className="text-center text-gray-400 dark:text-gray-500 font-mono mb-4">
              [{wordData.phonetic}]
            </p>
          )}

          {/* Chinese */}
          <p className="text-xl text-center text-gray-600 dark:text-gray-300 mb-6">
            {wordData.zh_cn}
          </p>

          {/* Pronunciation Buttons */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => pronounce(parsed.singularForPronunciation)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-medium cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Volume2 className="w-5 h-5" />
              发音
            </button>
            {parsed.pluralForPronunciation && (
              <button
                onClick={() => pronounce(parsed.pluralForPronunciation!)}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-xl font-medium cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
              >
                <Volume2 className="w-5 h-5" />
                复数发音
              </button>
            )}
          </div>
        </section>

        {/* Word Info */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {/* Word Type */}
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">词性</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {wordData.wordType === "noun"
                  ? "名词"
                  : wordData.wordType === "verb"
                  ? "动词"
                  : wordData.wordType === "adjective"
                  ? "形容词"
                  : "其他"}
              </span>
            </div>

            {/* Unit */}
            {wordData.unitId && (
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">所属单元</span>
                <Link
                  to={`/unit/${wordData.unitId}`}
                  className="font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                >
                  单元 {wordData.unitId}
                </Link>
              </div>
            )}

            {/* Article */}
            {wordData.article && (
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">冠词</span>
                <span
                  className={`font-medium ${
                    wordData.article === "der"
                      ? "text-blue-600 dark:text-blue-400"
                      : wordData.article === "die"
                      ? "text-pink-600 dark:text-pink-400"
                      : "text-violet-600 dark:text-violet-400"
                  }`}
                >
                  {wordData.article} ({wordData.article === "der" ? "阳性" : wordData.article === "die" ? "阴性" : "中性"})
                </span>
              </div>
            )}

            {/* Plural */}
            {wordData.plural && !wordData.singularOnly && (
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">复数形式</span>
                <div className="text-right">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {buildPluralForm(wordData.word, wordData.plural)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                    ({wordData.plural})
                  </span>
                </div>
              </div>
            )}

            {/* Singular Only */}
            {wordData.singularOnly && (
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">数量形式</span>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-medium rounded">
                  只有单数
                </span>
              </div>
            )}

            {/* Plural Only */}
            {wordData.pluralOnly && (
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">数量形式</span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium rounded">
                  只有复数
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Verb Conjugation */}
        {wordData.verbConjugation && (
          <VerbConjugationTable conjugation={wordData.verbConjugation} />
        )}

        {/* Learning Status */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              学习状态
            </h3>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isLearned
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  <CheckCircle
                    className={`w-4 h-4 ${
                      isLearned
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  学习状态
                </span>
              </div>
              <span
                className={`font-medium ${
                  isLearned
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {isLearned ? "已学习" : "未学习"}
              </span>
            </div>

            {srsInfo && (
              <>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      复习间隔
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {srsInfo.interval} 天
                  </span>
                </div>

                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      连续正确
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {srsInfo.repetitions} 次
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link
            to={`/learn?unit=${wordData.unitId || 1}&index=0`}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium cursor-pointer transition-colors"
          >
            <Play className="w-5 h-5" />
            开始学习
          </Link>
          <Link
            to="/test-modes"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Target className="w-5 h-5" />
            测试模式
          </Link>
        </div>
      </main>
    </div>
  );
}

// Verb Conjugation Table Component
function VerbConjugationTable({ conjugation }: { conjugation: VerbConjugation }) {
  const { pronounce } = usePronunciation();
  const persons = ["ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie"] as const;
  const personKeys = ["ich", "du", "er", "wir", "ihr", "sie"] as const;

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          动词变位
        </h3>
      </div>

      {/* Present Tense */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          现在时 Präsens
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {persons.map((person, i) => (
            <button
              key={person}
              onClick={() => pronounce(`${person.split("/")[0]} ${conjugation.present[personKeys[i]]}`)}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {person}
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {conjugation.present[personKeys[i]]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Perfect */}
      {conjugation.perfect && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            完成时 Perfekt
          </h4>
          <button
            onClick={() =>
              pronounce(
                `ich ${conjugation.perfect!.auxiliary === "haben" ? "habe" : "bin"} ${conjugation.perfect!.participle}`
              )
            }
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
          >
            <div className="flex-1 text-left">
              <span className="text-sm text-gray-500 dark:text-gray-400 block">
                助动词 + 过去分词
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {conjugation.perfect.auxiliary} + {conjugation.perfect.participle}
              </span>
            </div>
            <Volume2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}
    </section>
  );
}


