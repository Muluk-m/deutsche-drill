import { parseGermanWord } from "../utils/wordParser";

interface AnswerFeedbackProps {
  isCorrect: boolean;
  correctWord?: string;
  correctAnswer?: string;
  userAnswer?: string;
  phonetic?: string;
}

export function AnswerFeedback({
  isCorrect,
  correctWord,
  correctAnswer,
  userAnswer,
  phonetic,
}: AnswerFeedbackProps) {
  // 兼容两种参数名称
  const answer = correctAnswer || correctWord || '';
  const parsed = parseGermanWord(answer);

  return (
    <div
      className={`mt-4 text-lg font-medium animate-fadeIn ${
        isCorrect ? "text-green-600" : "text-red-600"
      }`}
    >
      {isCorrect ? (
        <div className="flex items-center justify-center space-x-2">
          <span className="text-2xl">✓</span>
          <span>正确！</span>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl">✗</span>
            <span>答错了</span>
          </div>
          <div className="text-gray-600">
            正确答案：
            <span className="font-bold text-gray-800">
              {parsed.forPronunciation || answer}
            </span>
          </div>
          {answer && (
            <div className="text-sm text-gray-500 mt-2">
              完整形式：{answer}
            </div>
          )}
          {userAnswer && (
            <div className="text-sm text-gray-500 mt-2">
              你的答案：<span className="text-red-600">{userAnswer}</span>
            </div>
          )}
          {phonetic && (
            <div className="text-sm text-gray-500 mt-2">
              音标：{phonetic}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
