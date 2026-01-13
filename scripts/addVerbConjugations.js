/**
 * 为常见动词添加变位数据
 * 这是一个示例脚本，包含最常用的德语动词变位
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 常见动词的变位数据
const commonVerbs = {
  'sein': {
    infinitive: 'sein',
    present: {
      ich: 'bin',
      du: 'bist',
      er: 'ist',
      wir: 'sind',
      ihr: 'seid',
      sie: 'sind'
    }
  },
  'haben': {
    infinitive: 'haben',
    present: {
      ich: 'habe',
      du: 'hast',
      er: 'hat',
      wir: 'haben',
      ihr: 'habt',
      sie: 'haben'
    }
  },
  'werden': {
    infinitive: 'werden',
    present: {
      ich: 'werde',
      du: 'wirst',
      er: 'wird',
      wir: 'werden',
      ihr: 'werdet',
      sie: 'werden'
    }
  },
  'gehen': {
    infinitive: 'gehen',
    present: {
      ich: 'gehe',
      du: 'gehst',
      er: 'geht',
      wir: 'gehen',
      ihr: 'geht',
      sie: 'gehen'
    }
  },
  'kommen': {
    infinitive: 'kommen',
    present: {
      ich: 'komme',
      du: 'kommst',
      er: 'kommt',
      wir: 'kommen',
      ihr: 'kommt',
      sie: 'kommen'
    }
  },
  'machen': {
    infinitive: 'machen',
    present: {
      ich: 'mache',
      du: 'machst',
      er: 'macht',
      wir: 'machen',
      ihr: 'macht',
      sie: 'machen'
    }
  },
  'sagen': {
    infinitive: 'sagen',
    present: {
      ich: 'sage',
      du: 'sagst',
      er: 'sagt',
      wir: 'sagen',
      ihr: 'sagt',
      sie: 'sagen'
    }
  },
  'sehen': {
    infinitive: 'sehen',
    present: {
      ich: 'sehe',
      du: 'siehst',
      er: 'sieht',
      wir: 'sehen',
      ihr: 'seht',
      sie: 'sehen'
    }
  },
  'geben': {
    infinitive: 'geben',
    present: {
      ich: 'gebe',
      du: 'gibst',
      er: 'gibt',
      wir: 'geben',
      ihr: 'gebt',
      sie: 'geben'
    }
  },
  'wissen': {
    infinitive: 'wissen',
    present: {
      ich: 'weiß',
      du: 'weißt',
      er: 'weiß',
      wir: 'wissen',
      ihr: 'wisst',
      sie: 'wissen'
    }
  },
  'nehmen': {
    infinitive: 'nehmen',
    present: {
      ich: 'nehme',
      du: 'nimmst',
      er: 'nimmt',
      wir: 'nehmen',
      ihr: 'nehmt',
      sie: 'nehmen'
    }
  },
  'können': {
    infinitive: 'können',
    present: {
      ich: 'kann',
      du: 'kannst',
      er: 'kann',
      wir: 'können',
      ihr: 'könnt',
      sie: 'können'
    }
  },
  'müssen': {
    infinitive: 'müssen',
    present: {
      ich: 'muss',
      du: 'musst',
      er: 'muss',
      wir: 'müssen',
      ihr: 'müsst',
      sie: 'müssen'
    }
  },
  'wollen': {
    infinitive: 'wollen',
    present: {
      ich: 'will',
      du: 'willst',
      er: 'will',
      wir: 'wollen',
      ihr: 'wollt',
      sie: 'wollen'
    }
  },
  'sollen': {
    infinitive: 'sollen',
    present: {
      ich: 'soll',
      du: 'sollst',
      er: 'soll',
      wir: 'sollen',
      ihr: 'sollt',
      sie: 'sollen'
    }
  },
  'mögen': {
    infinitive: 'mögen',
    present: {
      ich: 'mag',
      du: 'magst',
      er: 'mag',
      wir: 'mögen',
      ihr: 'mögt',
      sie: 'mögen'
    }
  },
  'dürfen': {
    infinitive: 'dürfen',
    present: {
      ich: 'darf',
      du: 'darfst',
      er: 'darf',
      wir: 'dürfen',
      ihr: 'dürft',
      sie: 'dürfen'
    }
  }
};

// 读取 words.json
const wordsPath = path.join(__dirname, '../public/words.json');
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));

console.log(`读取到 ${words.length} 个单词`);

let addedCount = 0;

// 为匹配的动词添加变位数据
words.forEach((word) => {
  const verbKey = word.word.toLowerCase().trim();
  
  if (commonVerbs[verbKey]) {
    word.wordType = 'verb';
    word.verbConjugation = commonVerbs[verbKey];
    addedCount++;
    console.log(`  ✓ 添加动词变位: ${word.word}`);
  }
});

console.log(`\n添加完成：为 ${addedCount} 个动词添加了变位数据`);

// 写回文件
fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2), 'utf-8');
console.log(`已保存到 ${wordsPath}`);
console.log(`\n提示：如需添加更多动词变位，请编辑此脚本并添加到 commonVerbs 对象中`);

