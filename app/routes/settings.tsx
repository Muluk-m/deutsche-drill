import type { Route } from "./+types/settings";
import { useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Download,
  Upload,
  Trash2,
  Database,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Star,
  AlertCircle,
  Trophy,
  Flame,
} from "lucide-react";
import {
  exportAllData,
  importAllData,
  downloadBackup,
  getDataSummary,
  clearAllData,
  validateBackupData,
  type BackupData,
} from "../utils/storageManager";

export function meta({}: Route.MetaArgs) {
  return [{ title: "设置 - Deutsch Wörter" }];
}

export default function Settings() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [summary, setSummary] = useState({
    learnedCount: 0,
    mistakesCount: 0,
    favoritesCount: 0,
    totalReviews: 0,
    streak: 0,
  });
  
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    setSummary(getDataSummary());
  }, []);

  const handleExport = () => {
    try {
      downloadBackup();
      setMessage({ type: "success", text: "备份文件已下载" });
    } catch {
      setMessage({ type: "error", text: "导出失败，请重试" });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;
      
      if (!validateBackupData(data)) {
        setMessage({ type: "error", text: "无效的备份文件格式" });
        setIsImporting(false);
        return;
      }

      const result = importAllData(data);
      
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        setSummary(getDataSummary());
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch {
      setMessage({ type: "error", text: "文件解析失败，请确保是有效的 JSON 文件" });
    } finally {
      setIsImporting(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClearData = () => {
    clearAllData();
    setSummary(getDataSummary());
    setShowClearConfirm(false);
    setMessage({ type: "success", text: "所有数据已清除" });
  };

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
            设置
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Message Toast */}
        {message && (
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl animate-slideInDown ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                : message.type === "error"
                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : message.type === "error" ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-current opacity-60 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Data Summary Card */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12" />
          </div>

          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6" />
              <h2 className="text-lg font-bold">数据概览</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-blue-200" />
                  <span className="text-xs text-blue-200">已学单词</span>
                </div>
                <div className="text-2xl font-bold">{summary.learnedCount}</div>
              </div>

              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-amber-300" />
                  <span className="text-xs text-blue-200">生词本</span>
                </div>
                <div className="text-2xl font-bold">{summary.favoritesCount}</div>
              </div>

              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-orange-300" />
                  <span className="text-xs text-blue-200">错题数</span>
                </div>
                <div className="text-2xl font-bold">{summary.mistakesCount}</div>
              </div>

              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs text-blue-200">总复习次数</span>
                </div>
                <div className="text-2xl font-bold">{summary.totalReviews}</div>
              </div>
            </div>

            {summary.streak > 0 && (
              <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-white/20 rounded-xl w-fit">
                <Flame className="w-5 h-5 text-orange-300" />
                <span className="font-medium">连续学习 {summary.streak} 天</span>
              </div>
            )}
          </div>
        </section>

        {/* Backup & Restore Section */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 px-1">
            数据管理
          </h3>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Export */}
            <button
              onClick={handleExport}
              className="flex items-center gap-4 p-4 w-full border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  导出数据
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  下载 JSON 格式的备份文件
                </p>
              </div>
            </button>

            {/* Import */}
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="flex items-center gap-4 p-4 w-full border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {isImporting ? "正在导入..." : "导入数据"}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  从备份文件恢复数据（会覆盖现有数据）
                </p>
              </div>
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Clear Data */}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-4 p-4 w-full hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-600 dark:text-red-400">
                  清除所有数据
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  删除所有学习进度（不可恢复）
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Tips */}
        <section className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                备份提示
              </h4>
              <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                <li>• 建议定期备份数据，防止意外丢失</li>
                <li>• 导入数据会覆盖当前所有学习进度</li>
                <li>• 备份文件可在不同设备间迁移数据</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  确认清除数据？
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  此操作不可恢复
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              将删除所有学习进度、错题记录、生词本等数据。建议先导出备份。
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium cursor-pointer transition-colors"
              >
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


