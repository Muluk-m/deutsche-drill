import type { Route } from "./+types/unit.$id";
import { Link, useParams } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { getUnitWords, getUnitProgress } from "../utils/unitManager";
import { parseGermanWord, buildPluralForm } from "../utils/wordParser";
import { PageContainer } from "../components/PageContainer";
import { BackButton } from "../components/BackButton";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `单元 ${params.id} - Deutsch Wörter` }];
}

export default function UnitDetail() {
  const { id } = useParams();
  const unitId = parseInt(id || "1");
  
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [unitWords, setUnitWords] = useState<Word[]>([]);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setAllWords(data);
        const words = getUnitWords(data, unitId);
        setUnitWords(words);
        
        const learned = JSON.parse(
          localStorage.getItem("learnedWords") || "[]"
        ) as string[];
        setLearnedWords(learned);
      });
  }, [unitId]);

  const progress = allWords.length > 0 ? getUnitProgress(unitId, learnedWords, allWords) : { learned: 0, total: 0, percentage: 0 };
  const isCompleted = progress.percentage === 100;

  return (
    <PageContainer>
      <BackButton />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg p-6 text-white mb-6">
        <h1 className="text-3xl font-bold mb-2">单元 {unitId}</h1>
        <p className="text-sm opacity-90 mb-4">
          共 {unitWords.length} 个单词 · 已学习 {progress.learned} 个
        </p>
        
        <div className="w-full bg-white bg-opacity-30 rounded-full h-3 mb-4">
          <div
            className="bg-white h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        <div className="flex gap-2">
          <Link
            to={`/learn?unit=${unitId}`}
            className="flex-1 text-center bg-white text-blue-600 py-2.5 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            📚 开始学习
          </Link>
          {progress.learned > 0 && (
            <>
              <Link
                to={`/review?unit=${unitId}`}
                className="flex-1 text-center bg-white bg-opacity-20 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-opacity-30 transition-colors"
              >
                🔄 复习
              </Link>
              <Link
                to={`/random?unit=${unitId}`}
                className="flex-1 text-center bg-white bg-opacity-20 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-opacity-30 transition-colors"
              >
                🎲 测试
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Word List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">单词列表</h2>
        
        <div className="grid gap-3">
          {unitWords.map((word, unitIndex) => {
            const isLearned = learnedWords.includes(word.word);
            const parsed = parseGermanWord(word.word);
            
            // 构建复数形式
            let pluralForm = null;
            if (parsed.plural && parsed.plural !== "-") {
              pluralForm = buildPluralForm(parsed.word, parsed.plural);
            }
            
            return (
              <Link
                key={unitIndex}
                to={`/learn?unit=${unitId}&index=${unitIndex}`}
                className={`block p-4 rounded-xl transition-all ${
                  isLearned
                    ? "bg-green-50 hover:bg-green-100 border-2 border-green-200"
                    : "bg-white hover:bg-gray-50 border-2 border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 序号/状态 */}
                  <div className="flex-shrink-0 w-8 pt-1">
                    {isLearned ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-green-500 text-white rounded-full text-sm font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-200 text-gray-600 rounded-full text-sm font-medium">
                        {unitIndex + 1}
                      </span>
                    )}
                  </div>

                  {/* 内容区域 */}
                  <div className="flex-1 min-w-0">
                    {/* 词性标签 */}
                    {parsed.article && (
                      <div className="mb-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            parsed.article === "der"
                              ? "bg-blue-100 text-blue-700"
                              : parsed.article === "die"
                              ? "bg-pink-100 text-pink-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {parsed.article}
                        </span>
                      </div>
                    )}

                    {/* 单词 */}
                    <div className="text-xl font-bold text-gray-800 mb-1">
                      {parsed.word}
                    </div>

                    {/* 复数形式 */}
                    {pluralForm && (
                      <div className="text-sm text-gray-500 mb-2">
                        <span className="font-medium">复数：</span>
                        {pluralForm}
                      </div>
                    )}

                    {/* 音标 */}
                    {word.phonetic && (
                      <div className="text-sm text-gray-500 font-mono mb-2">
                        {word.phonetic}
                      </div>
                    )}

                    {/* 中文释义 */}
                    <div className="text-base text-gray-700 bg-gray-50 rounded-lg px-3 py-2 mt-2">
                      {word.zh_cn}
                    </div>
                  </div>

                  {/* 箭头 */}
                  <div className="flex-shrink-0 pt-1">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Completion Badge */}
      {isCompleted && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">单元完成！</h3>
          <p className="text-gray-600 text-sm">
            你已经学完了这个单元的所有单词
          </p>
        </div>
      )}
    </PageContainer>
  );
}

