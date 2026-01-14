import { useRef } from "react";
import { GermanKeyboardCompact } from "./GermanKeyboard";

interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onSkip?: () => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  placeholder?: string;
  borderColor?: "purple" | "blue" | "green";
  autoFocus?: boolean;
  showGermanKeyboard?: boolean;
}

export function AnswerInput({
  value,
  onChange,
  onSubmit,
  onSkip,
  onKeyPress,
  disabled = false,
  placeholder = "请输入德语单词...",
  borderColor = "purple",
  autoFocus = true,
  showGermanKeyboard = true,
}: AnswerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const colorClasses = {
    purple: "focus:border-purple-500 focus:ring-purple-500/20",
    blue: "focus:border-blue-500 focus:ring-blue-500/20",
    green: "focus:border-green-500 focus:ring-green-500/20",
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSubmit && !disabled) {
      onSubmit();
    }
    if (onKeyPress) {
      onKeyPress(e);
    }
  };

  const handleInsertChar = (char: string) => {
    const input = inputRef.current;
    if (!input || disabled) return;

    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;

    const newValue = value.slice(0, start) + char + value.slice(end);
    onChange(newValue);

    // 恢复焦点并设置光标位置
    requestAnimationFrame(() => {
      input.focus();
      const newPos = start + char.length;
      input.setSelectionRange(newPos, newPos);
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative group">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full text-center text-3xl md:text-4xl font-bold border-3 border-gray-300 dark:border-gray-600 rounded-2xl py-5 px-6 
            focus:outline-none focus:ring-4 ${colorClasses[borderColor]}
            disabled:bg-gray-100 dark:disabled:bg-gray-800 
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100 
            disabled:text-gray-400 dark:disabled:text-gray-600
            transition-all duration-200
            shadow-lg group-hover:shadow-xl`}
          autoFocus={autoFocus}
        />
        {!value && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent opacity-50"></div>
        )}
      </div>

      {/* 德语特殊字符键盘 */}
      {showGermanKeyboard && !disabled && (
        <GermanKeyboardCompact onInsert={handleInsertChar} className="py-1" />
      )}

      {/* 提交和跳过按钮 */}
      {(onSubmit || onSkip) && (
        <div className="flex gap-3">
          {onSubmit && (
            <button
              onClick={onSubmit}
              disabled={disabled || !value.trim()}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                提交答案
              </span>
            </button>
          )}
          {onSkip && (
            <button
              onClick={onSkip}
              disabled={disabled}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              跳过
            </button>
          )}
        </div>
      )}
    </div>
  );
}
