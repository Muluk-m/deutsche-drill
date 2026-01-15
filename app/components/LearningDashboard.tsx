import { Trophy, Flame, Target, BookOpen, TrendingUp } from "lucide-react";

interface LearningDashboardProps {
  todayCount: number;
  totalLearned: number;
  totalWords: number;
  dueCount: number;
  streakDays?: number;
}

export function LearningDashboard({
  todayCount,
  totalLearned,
  totalWords,
  dueCount,
  streakDays = 0,
}: LearningDashboardProps) {
  const progressPercentage = totalWords > 0 ? Math.round((totalLearned / totalWords) * 100) : 0;
  
  return (
    <div className="space-y-4">
      {/* Main Progress Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16" />
        </div>
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-blue-200 text-sm font-medium">学习进度</p>
              <h2 className="text-3xl font-bold">{progressPercentage}%</h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full">
              <Flame className="w-4 h-4 text-orange-300" />
              <span className="text-sm font-medium">{streakDays} 天连续</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-200">已掌握 {totalLearned} 个</span>
            <span className="text-blue-200">共 {totalWords} 个单词</span>
          </div>
        </div>
      </div>
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <QuickStatCard
          icon={BookOpen}
          value={todayCount}
          label="今日学习"
          color="blue"
        />
        <QuickStatCard
          icon={Target}
          value={dueCount}
          label="待复习"
          color={dueCount > 0 ? "red" : "gray"}
          highlight={dueCount > 0}
        />
        <QuickStatCard
          icon={Trophy}
          value={totalLearned}
          label="已掌握"
          color="green"
        />
      </div>
    </div>
  );
}

interface QuickStatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: "blue" | "green" | "red" | "orange" | "purple" | "gray";
  highlight?: boolean;
}

function QuickStatCard({ icon: Icon, value, label, color, highlight }: QuickStatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    gray: "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
  };

  return (
    <div className={`p-4 rounded-2xl ${colorClasses[color]} ${highlight ? "ring-2 ring-red-400 dark:ring-red-500" : ""} transition-all`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80 font-medium">{label}</div>
    </div>
  );
}


