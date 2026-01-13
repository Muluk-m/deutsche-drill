/**
 * 标记单词类型
 * 根据单词特征自动识别名词、动词等类型
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 words.json
const wordsPath = path.join(__dirname, '../public/words.json');
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));

console.log(`读取到 ${words.length} 个单词`);

let nounCount = 0;
let verbCount = 0;
let otherCount = 0;

// 标记单词类型
words.forEach((word) => {
  // 已经有类型标记的跳过
  if (word.wordType) {
    return;
  }

  const text = word.word.toLowerCase();

  // 识别名词：含有 der/die/das
  if (text.includes(' der ') || text.startsWith('der ') ||
      text.includes(' die ') || text.startsWith('die ') ||
      text.includes(' das ') || text.startsWith('das ')) {
    word.wordType = 'noun';
    nounCount++;
  }
  // 识别动词：常见动词后缀
  else if (text.endsWith('en') || text.endsWith('ieren') || text.endsWith('n')) {
    // 检查是否是明显的动词（没有冠词的单个词）
    const parts = text.split(/\s+/);
    if (parts.length === 1 || (parts.length === 2 && parts[1].startsWith(','))) {
      // 进一步检查：常见动词特征
      if (text.match(/^(sein|haben|werden|gehen|kommen|machen|tun|sagen|wissen|sehen|geben)/) ||
          text.match(/(en|eln|ern|igen|ieren)$/)) {
        word.wordType = 'verb';
        verbCount++;
      } else {
        word.wordType = 'other';
        otherCount++;
      }
    } else {
      word.wordType = 'other';
      otherCount++;
    }
  }
  // 其他
  else {
    word.wordType = 'other';
    otherCount++;
  }
});

console.log(`标记完成：`);
console.log(`  - 名词：${nounCount} 个`);
console.log(`  - 动词：${verbCount} 个`);
console.log(`  - 其他：${otherCount} 个`);

// 写回文件
fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2), 'utf-8');
console.log(`已保存到 ${wordsPath}`);

