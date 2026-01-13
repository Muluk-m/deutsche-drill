export interface Word {
  word: string;
  zh_cn: string;
  phonetic?: string;        // IPA 音标，例如 /haʊ̯s/
  phoneticFailed?: boolean; // 音标获取失败标记
  unitId?: number;          // 所属单元 ID，例如 1, 2, 3...
}

export interface ParsedWord {
  word: string;
  article?: string;
  plural?: string;
  forPronunciation: string;
  singularForPronunciation: string;
  pluralForPronunciation?: string;
}

