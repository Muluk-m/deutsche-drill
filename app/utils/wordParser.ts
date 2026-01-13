/**
 * 德语单词格式解析工具
 * 
 * 格式规则：
 * 1. der Vorname, -n → 词性 der, 复数加 -n
 * 2. die Schokolade (nur Sg.) → 括号内是说明
 * 3. das Buch, ¨-er → 复数有元音变音
 */

export interface ParsedWord {
  full: string;                 // 完整的单词（包括词性、复数标记等）
  forPronunciation: string;     // 用于发音的纯单词（不带词性）
  singularForPronunciation: string; // 单数发音（带词性）
  pluralForPronunciation?: string;  // 复数发音（带词性）
  article?: string;             // 词性 (der/die/das)
  word: string;                 // 单词本身
  plural?: string;              // 复数形式标记
  pluralWord?: string;          // 复数单词
  note?: string;                // 括号内的说明
}

/**
 * 解析德语单词
 */
export function parseGermanWord(wordString: string | undefined): ParsedWord {
  // 安全检查
  if (!wordString) {
    return {
      full: '',
      forPronunciation: '',
      singularForPronunciation: '',
      word: '',
    };
  }
  
  const full = wordString.trim();
  
  // 提取括号内的说明
  const noteMatch = full.match(/\((.*?)\)/);
  const note = noteMatch ? noteMatch[1] : undefined;
  
  // 移除括号部分，获取主要内容
  const mainPart = full.replace(/\s*\(.*?\)\s*/g, '').trim();
  
  // 分割词性和单词部分
  const parts = mainPart.split(/\s+/);
  
  let article: string | undefined;
  let word: string;
  let plural: string | undefined;
  let forPronunciation: string;
  let singularForPronunciation: string;
  let pluralForPronunciation: string | undefined;
  let pluralWord: string | undefined;
  
  // 判断是否有词性（der/die/das/den/dem等）
  if (parts.length >= 2 && /^(der|die|das|den|dem|des)$/i.test(parts[0])) {
    article = parts[0];
    
    // 查找逗号分隔的部分
    const restPart = parts.slice(1).join(' ');
    const commaParts = restPart.split(',');
    
    word = commaParts[0].trim();
    
    if (commaParts.length > 1) {
      plural = commaParts[1].trim();
    }
    
    forPronunciation = word;
    singularForPronunciation = `${article} ${word}`;
    
    // 计算复数形式
    if (plural && plural !== '-' && !note?.includes('nur Sg')) {
      pluralWord = buildPluralForm(word, plural);
      // 复数通常使用 die
      pluralForPronunciation = `die ${pluralWord}`;
    }
  } else {
    // 没有词性的情况
    const commaParts = mainPart.split(',');
    word = commaParts[0].trim();
    
    if (commaParts.length > 1) {
      plural = commaParts[1].trim();
    }
    
    forPronunciation = word;
    singularForPronunciation = word;
    
    // 没有词性的情况，复数也不加词性
    if (plural && plural !== '-' && !note?.includes('nur Sg')) {
      pluralWord = buildPluralForm(word, plural);
      pluralForPronunciation = pluralWord;
    }
  }
  
  return {
    full,
    forPronunciation,
    singularForPronunciation,
    pluralForPronunciation,
    article,
    word,
    plural,
    pluralWord,
    note,
  };
}

/**
 * 构建完整的复数形式（用于显示）
 */
export function buildPluralForm(word: string, pluralMarker: string): string {
  if (!pluralMarker) return word;
  
  // 处理元音变音标记 ¨
  if (pluralMarker.includes('¨')) {
    const suffix = pluralMarker.replace('¨', '').replace('-', '');
    
    // 找到需要变音的元音
    const umlautMap: { [key: string]: string } = {
      'a': 'ä',
      'o': 'ö',
      'u': 'ü',
      'A': 'Ä',
      'O': 'Ö',
      'U': 'Ü',
    };
    
    // 从后往前找第一个可以变音的元音
    let modifiedWord = word;
    for (let i = word.length - 1; i >= 0; i--) {
      const char = word[i];
      if (umlautMap[char]) {
        modifiedWord = word.substring(0, i) + umlautMap[char] + word.substring(i + 1);
        break;
      }
    }
    
    return modifiedWord + suffix;
  }
  
  // 处理简单后缀 (如 -n, -en, -e, -er 等)
  if (pluralMarker.startsWith('-')) {
    return word + pluralMarker.substring(1);
  }
  
  return word + pluralMarker;
}

/**
 * 获取单词的显示信息
 */
export function getWordDisplay(wordString: string): {
  display: string;
  pronunciation: string;
  pluralExample?: string;
} {
  const parsed = parseGermanWord(wordString);
  
  let pluralExample: string | undefined;
  if (parsed.plural && parsed.plural !== '-') {
    pluralExample = buildPluralForm(parsed.word, parsed.plural);
  }
  
  return {
    display: parsed.full,
    pronunciation: parsed.forPronunciation,
    pluralExample,
  };
}

