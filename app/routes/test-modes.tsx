import type { Route } from "./+types/test-modes";
import { Link, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { PageContainer } from "../components/PageContainer";
import { BackButton } from "../components/BackButton";
import { createUnits } from "../utils/unitManager";
import { getMistakesList } from "../utils/storageManager";

export function meta({}: Route.MetaArgs) {
  return [{ title: "测试模式 - Deutsch Wörter" }];
}

interface TestMode {
  id: string;
  name: string;
  icon: string;
  description: string;
  path: string;
  color: string;
}

const testModes: TestMode[] = [
  {
    id: "listening",
    name: "听写模式",
    icon: "👂",
    description: "听发音写单词，锻炼听力和拼写",
    path: "/test-listening",
    color: "blue",
  },
  {
    id: "choice",
    name: "选择题模式",
    icon: "✅",
    description: "四选一，快速测试理解能力",
    path: "/test-choice",
    color: "green",
  },
  {
    id: "cn-to-de",
    name: "中译德模式",
    icon: "🇨🇳➡️🇩🇪",
    description: "看中文写德语，完整拼写",
    path: "/test-cn-to-de",
    color: "purple",
  },
  {
    id: "cloze",
    name: "填空练习",
    icon: "📝",
    description: "句子中填入正确单词",
    path: "/test-cloze",
    color: "orange",
  },
];

export default function TestModes() {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source"); // 'mistakes' 或 null

  const [words, setWords] = useState<Word[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<number | "all">("all");
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [questionCount, setQuestionCount] = useState(20);

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setWords(data);
      });
  }, []);

  const units = createUnits(words);
  const mistakes = getMistakesList();

  const getTestUrl = (mode: TestMode) => {
    const params = new URLSearchParams();

    if (source === "mistakes") {
      params.set("source", "mistakes");
    } else if (selectedUnit !== "all") {
      params.set("unit", selectedUnit.toString());
    }

    params.set("count", questionCount.toString());

    return `${mode.path}?${params.toString()}`;
  };

  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700",
    green: "bg-green-50 border-green-200 hover:bg-green-100 text-green-700",
    purple:
      "bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700",
    orange:
      "bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700",
  };

  return (
    <PageContainer>
      <BackButton />

      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {source === "mistakes" ? "错题专项练习" : "选择测试模式"}
        </h1>
        <p className="text-gray-600">
          {source === "mistakes"
            ? `共 ${mistakes.length} 个错题可供练习`
            : "选择适合你的测试方式"}
        </p>
      </div>

      {/* 测试范围选择 */}
      {source !== "mistakes" && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">测试范围</h2>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setSelectedUnit("all")}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                selectedUnit === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              全部单词
            </button>
            <button
              onClick={() => setSelectedUnit(1)}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                selectedUnit !== "all" && selectedUnit !== "mistakes"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              指定单元
            </button>
          </div>

          {selectedUnit !== "all" && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择单元
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(parseInt(e.target.value))}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800 bg-white"
              >
                {units.map((unit) => (
                  <option
                    key={unit.id}
                    value={unit.id}
                    className="text-gray-800"
                  >
                    单元 {unit.id} ({unit.totalWords} 个单词)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* 题目数量选择 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">题目数量</h2>

        <div className="grid grid-cols-4 gap-2">
          {[10, 20, 30, 50].map((count) => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                questionCount === count
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* 测试模式选择 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">选择测试模式</h2>

        <div className="grid gap-4">
          {testModes.map((mode) => (
            <Link
              key={mode.id}
              to={getTestUrl(mode)}
              className={`block p-6 rounded-xl border-2 transition-all ${
                colorClasses[mode.color as keyof typeof colorClasses]
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{mode.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{mode.name}</h3>
                  <p className="text-sm opacity-80">{mode.description}</p>
                </div>
                <svg
                  className="w-6 h-6 opacity-50"
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
            </Link>
          ))}
        </div>
      </div>

      {/* 语法练习入口 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-2">🎓 德语语法专项练习</h2>
        <p className="text-sm opacity-90 mb-4">
          专门练习冠词、复数、动词变位等德语特色语法
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Link
            to="/practice-articles"
            className="text-center bg-white text-indigo-700 py-3 rounded-lg text-sm font-medium hover:bg-opacity-95 transition-colors font-bold"
          >
            der/die/das
          </Link>
          <Link
            to="/practice-plural"
            className="text-center bg-white text-purple-700 py-3 rounded-lg text-sm font-medium hover:bg-opacity-95 transition-colors font-bold"
          >
            复数练习
          </Link>
          <Link
            to="/practice-verbs"
            className="text-center bg-white text-indigo-700 py-3 rounded-lg text-sm font-medium hover:bg-opacity-95 transition-colors font-bold"
          >
            动词变位
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
