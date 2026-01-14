/**
 * 德语特殊字符输入组件
 * 支持快捷输入 ä ö ü ß 及其大写形式
 */

interface GermanKeyboardProps {
  onInsert: (char: string) => void;
  className?: string;
}

const GERMAN_CHARS = [
  { char: 'ä', label: 'ä' },
  { char: 'ö', label: 'ö' },
  { char: 'ü', label: 'ü' },
  { char: 'ß', label: 'ß' },
  { char: 'Ä', label: 'Ä' },
  { char: 'Ö', label: 'Ö' },
  { char: 'Ü', label: 'Ü' },
];

export function GermanKeyboard({ onInsert, className = '' }: GermanKeyboardProps) {
  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {GERMAN_CHARS.map(({ char, label }) => (
        <button
          key={char}
          type="button"
          onClick={() => onInsert(char)}
          className="w-9 h-9 flex items-center justify-center text-lg font-medium
            bg-gray-100 dark:bg-gray-700 
            text-gray-700 dark:text-gray-300
            hover:bg-blue-100 dark:hover:bg-blue-900/30
            hover:text-blue-600 dark:hover:text-blue-400
            active:scale-90
            rounded-lg transition-all duration-150
            cursor-pointer select-none"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * 紧凑版德语键盘（只显示小写）
 */
export function GermanKeyboardCompact({ onInsert, className = '' }: GermanKeyboardProps) {
  const compactChars = ['ä', 'ö', 'ü', 'ß'];
  
  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {compactChars.map((char) => (
        <button
          key={char}
          type="button"
          onClick={() => onInsert(char)}
          className="w-8 h-8 flex items-center justify-center text-base font-medium
            bg-gray-100 dark:bg-gray-700 
            text-gray-600 dark:text-gray-400
            hover:bg-blue-100 dark:hover:bg-blue-900/30
            hover:text-blue-600 dark:hover:text-blue-400
            active:scale-90
            rounded-md transition-all duration-150
            cursor-pointer select-none"
        >
          {char}
        </button>
      ))}
    </div>
  );
}

