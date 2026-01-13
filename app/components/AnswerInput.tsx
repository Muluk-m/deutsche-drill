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
}: AnswerInputProps) {
  const borderColorClasses = {
    purple: "focus:border-purple-500",
    blue: "focus:border-blue-500",
    green: "focus:border-green-500",
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSubmit && !disabled) {
      onSubmit();
    }
    if (onKeyPress) {
      onKeyPress(e);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full text-center text-3xl font-bold border-2 border-gray-300 rounded-xl py-4 px-6 focus:outline-none ${borderColorClasses[borderColor]} disabled:bg-gray-50 text-gray-900 disabled:text-gray-500`}
        autoFocus={autoFocus}
      />
      
      {/* 提交和跳过按钮 */}
      {(onSubmit || onSkip) && (
        <div className="flex gap-3">
          {onSubmit && (
            <button
              onClick={onSubmit}
              disabled={disabled || !value.trim()}
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              提交答案
            </button>
          )}
          {onSkip && (
            <button
              onClick={onSkip}
              disabled={disabled}
              className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              跳过
            </button>
          )}
        </div>
      )}
    </div>
  );
}
