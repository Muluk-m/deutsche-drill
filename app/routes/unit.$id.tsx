import type { Route } from "./+types/unit.$id";
import { Link, useParams } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { getUnitWords, getUnitProgress } from "../utils/unitManager";
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

  const progress = getUnitProgress(unitId, learnedWords, allWords);
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
        
        <div className="grid gap-2">
          {unitWords.map((word, index) => {
            const isLearned = learnedWords.includes(word.word);
            const globalIndex = allWords.findIndex((w) => w.word === word.word);
            
            return (
              <Link
                key={index}
                to={`/learn?unit=${unitId}&index=${index}`}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  isLearned
                    ? "bg-green-50 hover:bg-green-100 border border-green-200"
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0 w-8 text-center">
                    {isLearned ? (
                      <span className="text-green-600 text-lg">✓</span>
                    ) : (
                      <span className="text-gray-400 text-sm">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{word.word}</div>
                    <div className="text-sm text-gray-600">{word.zh_cn}</div>
                    {word.phonetic && (
                      <div className="text-xs text-gray-500 font-mono mt-1">
                        {word.phonetic}
                      </div>
                    )}
                  </div>
                </div>
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

