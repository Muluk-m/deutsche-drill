/**
 * 提取名词的冠词和复数形式
 * 将 "der Name, -n" 拆分为：
 *   - word: "Name"
 *   - article: "der"
 *   - plural: "-n"
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

let processedCount = 0;
let skippedCount = 0;

// 冠词正则
const articleRegex = /^(der|die|das)\s+/i;

// 处理名词
words.forEach((entry) => {
  // 只处理名词类型
  if (entry.wordType !== 'noun') {
    return;
  }

  const originalWord = entry.word;
  let word = originalWord;
  let article = null;
  let plural = null;

  // 1. 提取冠词
  const articleMatch = word.match(articleRegex);
  if (articleMatch) {
    article = articleMatch[1].toLowerCase();
    word = word.substring(articleMatch[0].length);
  }

  // 2. 处理只有单数/复数的情况
  const onlySgMatch = word.match(/\s*\(nur Sg\.\)\s*$/i);
  const onlyPlMatch = word.match(/\s*\(nur Pl\.\)\s*$/i);

  if (onlySgMatch) {
    // 只有单数形式，无复数
    word = word.replace(onlySgMatch[0], '').trim();
    plural = null; // 明确设为 null 表示无复数
    entry.pluralOnly = false;
    entry.singularOnly = true;
  } else if (onlyPlMatch) {
    // 只有复数形式
    word = word.replace(onlyPlMatch[0], '').trim();
    plural = null;
    entry.pluralOnly = true;
    entry.singularOnly = false;
  } else {
    // 3. 提取复数形式 (逗号后面的部分)
    const commaIndex = word.indexOf(',');
    if (commaIndex !== -1) {
      const pluralPart = word.substring(commaIndex + 1).trim();
      word = word.substring(0, commaIndex).trim();
      
      // 处理复数后缀
      // 常见格式: "-n", "-en", "-e", "-s", "-", "¨-er", "¨-e" 等
      if (pluralPart) {
        plural = pluralPart;
      }
    }
  }

  // 更新 entry
  if (article || plural !== undefined || word !== originalWord) {
    entry.word = word;
    if (article) {
      entry.article = article;
    }
    if (plural !== null && plural !== undefined) {
      entry.plural = plural;
    }
    processedCount++;
    
    // 调试输出
    if (processedCount <= 20) {
      console.log(`  "${originalWord}" => word: "${word}", article: ${article}, plural: ${plural || '(无)'}`);
    }
  } else {
    skippedCount++;
  }
});

console.log(`\n处理完成：`);
console.log(`  - 已处理：${processedCount} 个名词`);
console.log(`  - 跳过：${skippedCount} 个`);

// 统计冠词分布
const articleStats = { der: 0, die: 0, das: 0, none: 0 };
words.forEach((entry) => {
  if (entry.wordType === 'noun') {
    if (entry.article) {
      articleStats[entry.article]++;
    } else {
      articleStats.none++;
    }
  }
});

console.log(`\n冠词分布：`);
console.log(`  - der (阳性): ${articleStats.der} 个`);
console.log(`  - die (阴性): ${articleStats.die} 个`);
console.log(`  - das (中性): ${articleStats.das} 个`);
console.log(`  - 无冠词: ${articleStats.none} 个`);

// 写回文件
fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2), 'utf-8');
console.log(`\n已保存到 ${wordsPath}`);

