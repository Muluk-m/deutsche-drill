import { Link, useLocation } from "react-router";
import { Home, RefreshCw, Target, User } from "lucide-react";

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

interface BottomNavProps {
  dueCount?: number;
}

export function BottomNav({ dueCount }: BottomNavProps) {
  const location = useLocation();

  const navItems: NavItem[] = [
    { path: "/", icon: Home, label: "首页" },
    { path: "/review", icon: RefreshCw, label: "复习", badge: dueCount },
    { path: "/test-modes", icon: Target, label: "测试" },
    { path: "/profile", icon: User, label: "我的" },
  ];

  return (
    <nav className="bottom-nav-fixed">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center min-w-[64px] h-14 rounded-2xl cursor-pointer active:scale-90 transition-transform duration-150
                ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-gray-500 active:text-gray-600 dark:active:text-gray-300"
                }
              `}
            >
              {/* Active Background */}
              {isActive && (
                <div className="absolute inset-1 bg-blue-50 dark:bg-blue-900/30 rounded-xl" />
              )}

              {/* Icon Container */}
              <div className="relative z-10">
                <Icon
                  className={`w-6 h-6 transition-all duration-200 ${
                    isActive ? "stroke-[2.5px]" : "stroke-[2px]"
                  }`}
                />

                {/* Badge - only show when > 0 */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`relative z-10 text-[11px] mt-1 transition-all duration-200 ${
                  isActive ? "font-semibold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
