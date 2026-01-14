import type { Route } from "./+types/favorites";
import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  Star,
  Trash2,
  Volume2,
  BookOpen,
  Target,
  Search,
  X,
} from "lucide-react";
import {
  getFavoritesList,
  removeFavorite,
} from "../utils/storageManager";
import { usePronunciation } from "../hooks/usePronunciation";
import type { FavoriteWord } from "../types/word";

export function meta({}: Route.MetaArgs) {
  return [{ title: "生词本 - Deutsch Wörter" }];
}

export default function Favorites() {
  const navigate = useNavigate();
  const { pronounce } = usePronunciation();
  const [favorites, setFavorites] = useState<FavoriteWord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    setFavorites(getFavoritesList());
  };

  const handleRemove = (word: string) => {
    removeFavorite(word);
    loadFavorites();
    setShowConfirmDelete(null);
  };

  const filteredFavorites = favorites.filter(
    (fav) =>
      fav.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.zh_cn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-gray-500 dark:text-gray-400 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              生词本
            </h1>
            <div className="w-10" />
          </div>

          {/* 搜索框 */}
          {favorites.length > 0 && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索生词..."
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
          )}
        </div>
      </header>

      <main className="px-4 py-4">
        {favorites.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
              <Star className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              生词本为空
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-xs">
              在学习过程中点击"加入生词本"，将难词收藏到这里
            </p>
            <Link
              to="/learn"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium cursor-pointer"
            >
              <BookOpen className="w-5 h-5" />
              开始学习
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 统计信息 */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                共 {favorites.length} 个生词
              </span>
              {favorites.length >= 5 && (
                <Link
                  to="/test-modes?source=favorites"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium cursor-pointer"
                >
                  <Target className="w-4 h-4" />
                  复习生词
                </Link>
              )}
            </div>

            {/* 生词列表 */}
            <div className="space-y-2">
              {filteredFavorites.map((fav) => (
                <div
                  key={fav.word}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-start gap-3">
                    {/* 发音按钮 */}
                    <button
                      onClick={() => pronounce(fav.word)}
                      className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex-shrink-0"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>

                    {/* 单词信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {fav.word}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(fav.addedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {fav.zh_cn}
                      </p>
                      {fav.note && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                          备注: {fav.note}
                        </p>
                      )}
                    </div>

                    {/* 删除按钮 */}
                    {showConfirmDelete === fav.word ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemove(fav.word)}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg cursor-pointer"
                        >
                          确认
                        </button>
                        <button
                          onClick={() => setShowConfirmDelete(null)}
                          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg cursor-pointer"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowConfirmDelete(fav.word)}
                        className="p-2 text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 搜索无结果 */}
            {searchQuery && filteredFavorites.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  未找到匹配的生词
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

