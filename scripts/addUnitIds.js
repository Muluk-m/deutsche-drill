/**
 * 给每个单词添加单元标识（根据单元结尾词划分）
 * 使用方法: node scripts/addUnitIds.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORDS_FILE = join(__dirname, '../public/words.json');

// 每个单元的结尾词
const UNIT_END_WORDS = [
  'in',                                      // 单元1结尾
  'nicht',                                   // 单元2结尾
  'Ich habe Durst.',                        // 单元3结尾
  'alles',                                  // 单元4结尾
  'wieder (Kleinwort)',                                 // 单元5结尾
  'etwas Neues',                            // 单元6结尾
  'oben',                                   // 单元7结尾
  'Meinen Fotoapparat habe ich immer dabei.',    // 单元8结尾
  'zum Schluss',                             // 单元9结尾
  'Ich mache lieber...',                    // 单元10结尾
];

function addUnitIds() {
  console.log('🚀 开始添加单元标识...\n');
  
  // 读取 words.json
  const wordsData = JSON.parse(readFileSync(WORDS_FILE, 'utf-8'));
  console.log(`📚 共 ${wordsData.length} 个单词\n`);
  
  // 找到每个单元结尾词的索引
  const unitEndIndices = [];
  UNIT_END_WORDS.forEach((endWord, unitIndex) => {
    const index = wordsData.findIndex(w => w.word === endWord);
    if (index !== -1) {
      unitEndIndices.push({ unitId: unitIndex + 1, endIndex: index, word: endWord });
      console.log(`📍 找到单元 ${unitIndex + 1} 结尾: ${endWord} (索引 ${index})`);
    } else {
      console.log(`⚠️  未找到单元 ${unitIndex + 1} 结尾词: ${endWord}`);
    }
  });
  
  console.log('\n开始分配单元...\n');
  
  let addedCount = 0;
  let updatedCount = 0;
  
  // 为每个单词分配 unitId
  wordsData.forEach((word, index) => {
    // 找到该单词所属的单元
    let unitId = 1;
    for (let i = 0; i < unitEndIndices.length; i++) {
      if (index <= unitEndIndices[i].endIndex) {
        unitId = unitEndIndices[i].unitId;
        break;
      }
      if (i === unitEndIndices.length - 1) {
        // 超过最后一个单元的词，归入下一个单元
        unitId = unitEndIndices[i].unitId + 1;
      }
    }
    
    const oldUnitId = word.unitId;
    
    if (oldUnitId === undefined) {
      word.unitId = unitId;
      console.log(`✅ 添加: ${word.word} -> 单元 ${unitId}`);
      addedCount++;
    } else if (oldUnitId !== unitId) {
      word.unitId = unitId;
      console.log(`🔄 更新: ${word.word} (${oldUnitId} -> ${unitId})`);
      updatedCount++;
    }
  });
  
  // 保存
  writeFileSync(WORDS_FILE, JSON.stringify(wordsData, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ 添加单元标识完成！');
  console.log(`✅ 新增: ${addedCount}`);
  console.log(`🔄 更新: ${updatedCount}`);
  console.log(`📊 总计: ${wordsData.length}`);
  console.log(`📦 单元数: ${unitEndIndices.length + 1}`);
  console.log('='.repeat(50));
  
  // 统计每个单元的单词数
  console.log('\n单元统计：');
  const unitStats = {};
  wordsData.forEach(word => {
    const uid = word.unitId || 0;
    unitStats[uid] = (unitStats[uid] || 0) + 1;
  });
  Object.keys(unitStats).sort((a, b) => Number(a) - Number(b)).forEach(uid => {
    console.log(`  单元 ${uid}: ${unitStats[uid]} 个单词`);
  });
}

addUnitIds();

