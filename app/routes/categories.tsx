import type { Route } from "./+types/categories";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useState, useEffect, useMemo } from "react";
import type { Word } from "../types/word";
import { getLearnedWords } from "../utils/storageManager";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  BookOpen,
  FileText,
  Sparkles,
  CheckCircle,
  Home,
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "词汇分类 - Deutsch Wörter" }];
}

type WordType = "all" | "noun" | "verb" | "adjective" | "other";
type ArticleType = "all" | "der" | "die" | "das";

interface CategoryStats {
  noun: number;
  verb: number;
  adjective: number;
  other: number;
  der: number;
  die: number;
  das: number;
}

export default function Categories() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [words, setWords] = useState<Word[]>([]);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Filter states from URL
  const wordType = (searchParams.get("type") as WordType) || "all";
  const articleType = (searchParams.get("article") as ArticleType) || "all";

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json() as Promise<Word[]>)
      .then((data) => {
        setWords(data);
        setLearnedWords(getLearnedWords());
        setLoading(false);
      });
  }, []);

  // Calculate stats
  const stats: CategoryStats = useMemo(() => {
    return {
      noun: words.filter((w) => w.wordType === "noun").length,
      verb: words.filter((w) => w.wordType === "verb").length,
      adjective: words.filter((w) => w.wordType === "adjective").length,
      other: words.filter((w) => w.wordType === "other" || !w.wordType).length,
      der: words.filter((w) => w.article === "der").length,
      die: words.filter((w) => w.article === "die").length,
      das: words.filter((w) => w.article === "das").length,
    };
  }, [words]);

  // Filter words
  const filteredWords = useMemo(() => {
    let result = words;

    // Filter by word type
    if (wordType !== "all") {
      result = result.filter((w) => {
        if (wordType === "other") {
          return w.wordType === "other" || !w.wordType;
        }
        return w.wordType === wordType;
      });
    }

    // Filter by article (only for nouns)
    if (articleType !== "all") {
      result = result.filter((w) => w.article === articleType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (w) =>
          w.word.toLowerCase().includes(query) ||
          w.zh_cn.toLowerCase().includes(query)
      );
    }

    return result;
  }, [words, wordType, articleType, searchQuery]);

  const setFilter = (type: "type" | "article", value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete(type);
    } else {
      newParams.set(type, value);
    }
    setSearchParams(newParams);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-500 dark:text-gray-400 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              词汇分类
            </h1>
            <Link
              to="/"
              className="p-2 -mr-2 text-gray-500 dark:text-gray-400 cursor-pointer"
            >
              <Home className="w-5 h-5" />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索单词..."
              className="w-full h-10 pl-10 pr-10 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Word Type Filter */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
            按词性筛选
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <CategoryCard
              icon={BookOpen}
              label="全部"
              count={words.length}
              active={wordType === "all"}
              onClick={() => setFilter("type", "all")}
              color="gray"
            />
            <CategoryCard
              icon={FileText}
              label="名词"
              count={stats.noun}
              active={wordType === "noun"}
              onClick={() => setFilter("type", "noun")}
              color="blue"
            />
            <CategoryCard
              icon={Sparkles}
              label="动词"
              count={stats.verb}
              active={wordType === "verb"}
              onClick={() => setFilter("type", "verb")}
              color="green"
            />
            <CategoryCard
              icon={FileText}
              label="其他"
              count={stats.other}
              active={wordType === "other"}
              onClick={() => setFilter("type", "other")}
              color="purple"
            />
          </div>
        </section>

        {/* Article Filter (only show when noun is selected or all) */}
        {(wordType === "all" || wordType === "noun") && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
              按冠词筛选
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <ArticleChip
                label="全部"
                count={stats.der + stats.die + stats.das}
                active={articleType === "all"}
                onClick={() => setFilter("article", "all")}
              />
              <ArticleChip
                label="der"
                count={stats.der}
                active={articleType === "der"}
                onClick={() => setFilter("article", "der")}
                color="blue"
              />
              <ArticleChip
                label="die"
                count={stats.die}
                active={articleType === "die"}
                onClick={() => setFilter("article", "die")}
                color="pink"
              />
              <ArticleChip
                label="das"
                count={stats.das}
                active={articleType === "das"}
                onClick={() => setFilter("article", "das")}
                color="violet"
              />
            </div>
          </section>
        )}

        {/* Results */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              单词列表
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredWords.length} 个单词
            </span>
          </div>

          {filteredWords.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[60vh] overflow-y-auto">
                {filteredWords.slice(0, 100).map((word) => {
                  const isLearned = learnedWords.includes(word.word);
                  return (
                    <Link
                      key={word.word}
                      to={`/word/${encodeURIComponent(word.word)}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      {/* Article Badge */}
                      {word.article ? (
                        <span
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white ${
                            word.article === "der"
                              ? "bg-blue-500"
                              : word.article === "die"
                              ? "bg-pink-500"
                              : "bg-violet-500"
                          }`}
                        >
                          {word.article}
                        </span>
                      ) : (
                        <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                          <FileText className="w-5 h-5 text-gray-400" />
                        </span>
                      )}

                      {/* Word Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {word.word}
                          </span>
                          {isLearned && (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {word.zh_cn}
                        </p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
              {filteredWords.length > 100 && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-center text-sm text-gray-500 dark:text-gray-400">
                  显示前 100 个结果，请使用搜索缩小范围
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">未找到匹配的单词</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Category Card Component
interface CategoryCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: "gray" | "blue" | "green" | "purple";
}

function CategoryCard({
  icon: Icon,
  label,
  count,
  active,
  onClick,
  color,
}: CategoryCardProps) {
  const colorClasses = {
    gray: {
      bg: active
        ? "bg-gray-900 dark:bg-gray-100"
        : "bg-white dark:bg-gray-800",
      icon: active
        ? "bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-900"
        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
      text: active
        ? "text-white dark:text-gray-900"
        : "text-gray-900 dark:text-gray-100",
      count: active
        ? "text-gray-300 dark:text-gray-600"
        : "text-gray-500 dark:text-gray-400",
    },
    blue: {
      bg: active
        ? "bg-blue-600 dark:bg-blue-500"
        : "bg-white dark:bg-gray-800",
      icon: active
        ? "bg-blue-500 dark:bg-blue-400 text-white"
        : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      text: active ? "text-white" : "text-gray-900 dark:text-gray-100",
      count: active
        ? "text-blue-200"
        : "text-gray-500 dark:text-gray-400",
    },
    green: {
      bg: active
        ? "bg-green-600 dark:bg-green-500"
        : "bg-white dark:bg-gray-800",
      icon: active
        ? "bg-green-500 dark:bg-green-400 text-white"
        : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      text: active ? "text-white" : "text-gray-900 dark:text-gray-100",
      count: active
        ? "text-green-200"
        : "text-gray-500 dark:text-gray-400",
    },
    purple: {
      bg: active
        ? "bg-purple-600 dark:bg-purple-500"
        : "bg-white dark:bg-gray-800",
      icon: active
        ? "bg-purple-500 dark:bg-purple-400 text-white"
        : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
      text: active ? "text-white" : "text-gray-900 dark:text-gray-100",
      count: active
        ? "text-purple-200"
        : "text-gray-500 dark:text-gray-400",
    },
  };

  const classes = colorClasses[color];

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
        classes.bg
      } ${
        active
          ? "border-transparent shadow-lg"
          : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${classes.icon}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-left">
        <div className={`font-semibold ${classes.text}`}>{label}</div>
        <div className={`text-sm ${classes.count}`}>{count} 个</div>
      </div>
    </button>
  );
}

// Article Chip Component
interface ArticleChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: "blue" | "pink" | "violet";
}

function ArticleChip({ label, count, active, onClick, color }: ArticleChipProps) {
  let bgClass = "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
  let activeBgClass = "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900";

  if (color === "blue") {
    bgClass = "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
    activeBgClass = "bg-blue-600 text-white";
  } else if (color === "pink") {
    bgClass = "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400";
    activeBgClass = "bg-pink-600 text-white";
  } else if (color === "violet") {
    bgClass = "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400";
    activeBgClass = "bg-violet-600 text-white";
  }

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
        active ? activeBgClass : bgClass
      }`}
    >
      {label}{" "}
      <span className={`text-sm ${active ? "opacity-80" : "opacity-60"}`}>
        ({count})
      </span>
    </button>
  );
}


