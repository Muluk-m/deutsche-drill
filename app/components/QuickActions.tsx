import { Link } from "react-router";
import { 
  BookOpen, 
  RefreshCw, 
  Headphones, 
  PenTool, 
  ChevronRight,
  Zap,
  Layers,
  Grid3X3,
} from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  gradient: string;
}

const quickActions: QuickAction[] = [
  {
    title: "继续学习",
    description: "从上次进度继续",
    icon: BookOpen,
    path: "/learn",
    color: "text-blue-600",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    title: "闪卡复习",
    description: "快速翻卡记忆",
    icon: Layers,
    path: "/flashcard",
    color: "text-purple-600",
    gradient: "from-purple-500 to-violet-600",
  },
  {
    title: "听力练习",
    description: "听音辨词训练",
    icon: Headphones,
    path: "/test-listening",
    color: "text-green-600",
    gradient: "from-green-500 to-green-600",
  },
  {
    title: "词汇分类",
    description: "按词性浏览",
    icon: Grid3X3,
    path: "/categories",
    color: "text-orange-600",
    gradient: "from-orange-500 to-amber-600",
  },
];

export function QuickActions() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">快速开始</h3>
        <Link 
          to="/test-modes" 
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          更多
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <QuickActionCard key={action.path} action={action} />
        ))}
      </div>
    </div>
  );
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  
  return (
    <Link
      to={action.path}
      className="group relative p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Hover Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      <div className="relative">
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} text-white mb-3`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
          {action.title}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {action.description}
        </p>
      </div>
    </Link>
  );
}

// Grammar Practice Section
export function GrammarPractice() {
  const practices = [
    { title: "冠词练习", subtitle: "der/die/das", path: "/practice-articles", color: "blue" },
    { title: "复数练习", subtitle: "Plural", path: "/practice-plural", color: "purple" },
    { title: "动词变位", subtitle: "Konjugation", path: "/practice-verbs", color: "green" },
    { title: "形近词", subtitle: "Confusables", path: "/practice-confusables", color: "pink" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Zap className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">语法专练</h3>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {practices.map((practice) => (
          <Link
            key={practice.path}
            to={practice.path}
            className={`flex-shrink-0 px-4 py-3 bg-gradient-to-r ${
              practice.color === "blue" ? "from-blue-500 to-blue-600" :
              practice.color === "purple" ? "from-purple-500 to-purple-600" :
              practice.color === "pink" ? "from-pink-500 to-rose-600" :
              "from-green-500 to-green-600"
            } text-white rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer`}
          >
            <div className="text-sm font-semibold">{practice.title}</div>
            <div className="text-xs opacity-80">{practice.subtitle}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

