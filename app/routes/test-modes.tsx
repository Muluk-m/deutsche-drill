import type { Route } from "./+types/test-modes";
import { Link, useSearchParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import type { Word } from "../types/word";
import { createUnits } from "../utils/unitManager";
import { getMistakesList } from "../utils/storageManager";
import { 
  ChevronLeft, 
  Headphones, 
  CheckSquare, 
  Languages, 
  FileText,
  BookOpen,
  Zap,
  ChevronRight,
  Settings,
  Home,
  Sparkles,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "测试模式 - Deutsch Wörter" }];
}

interface TestMode {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  path: string;
  gradient: string;
}

const testModes: TestMode[] = [
  {
    id: "listening",
    name: "听写模式",
    icon: Headphones,
    description: "听发音写单词",
    path: "/test-listening",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "choice",
    name: "选择题",
    icon: CheckSquare,
    description: "四选一测试",
    path: "/test-choice",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "cn-to-de",
    name: "中译德",
    icon: Languages,
    description: "看中文写德语",
    path: "/test-cn-to-de",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    id: "cloze",
    name: "填空题",
    icon: FileText,
    description: "句子填空练习",
    path: "/test-cloze",
    gradient: "from-orange-500 to-amber-500",
  },
];

export default function TestModes() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const source = searchParams.get("source");

  const [words, setWords] = useState<Word[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<number | "all">("all");
  const [questionCount, setQuestionCount] = useState(20);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => setWords(data));
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {source === "mistakes" ? "错题练习" : "测试模式"}
          </h1>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 -mr-2 cursor-pointer transition-colors ${
              showSettings ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="px-4 py-4 pb-24">
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 animate-scaleIn">
            {/* Unit Selection */}
            {source !== "mistakes" && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                  测试范围
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedUnit("all")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      selectedUnit === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    全部
                  </button>
                  <select
                    value={selectedUnit === "all" ? "" : selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value ? parseInt(e.target.value) : "all")}
                    className="flex-1 py-2.5 px-3 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0 cursor-pointer"
                  >
                    <option value="">选择单元</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        单元 {unit.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Question Count */}
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                题目数量
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      questionCount === count
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Info Banner */}
        {source === "mistakes" && (
          <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
              共 {mistakes.length} 个错题可供练习
            </p>
          </div>
        )}

        {/* Test Modes Grid */}
        <div className="space-y-3 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 px-1">
            选择测试方式
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {testModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <Link
                  key={mode.id}
                  to={getTestUrl(mode)}
                  className="group bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                    {mode.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {mode.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Grammar Practice Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              语法专练
            </h2>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <Link
              to="/practice-articles"
              className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">冠词练习</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">der / die / das</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
            </Link>

            <Link
              to="/practice-plural"
              className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Languages className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">复数练习</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Plural</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
            </Link>

            <Link
              to="/practice-verbs"
              className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">动词变位</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Konjugation</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
            </Link>

            <Link
              to="/practice-confusables"
              className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">形近词练习</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Confusables</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-center h-16 px-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            返回首页
          </Link>
        </div>
      </nav>
    </div>
  );
}
