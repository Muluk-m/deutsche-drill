/**
 * 批量获取德语单词音标并更新 words.json
 * 使用方法: node scripts/fetchPhonetics.js
 * 
 * 注意：需要先安装依赖: npm install
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORDS_FILE = join(__dirname, '../public/words.json');
const DELAY_MS = 300; // API 调用间隔（毫秒）

// 延迟函数（同步方式）
const delay = (ms) => {
  execSync(`sleep ${ms / 1000}`);
};

// 清理单词（去掉冠词和复数信息）
function cleanWord(word) {
  return word
    .replace(/^(der|die|das)\s+/, '')
    .replace(/,.*$/, '')
    .replace(/\(.*?\)/g, '')
    .trim();
}

// 判断是否为单词（而非句子或短语）
function isWord(word) {
  const cleaned = cleanWord(word);
  
  // 如果包含多个空格，可能是句子
  if ((cleaned.match(/\s/g) || []).length > 1) {
    return false;
  }
  
  // 如果包含句子标点符号，是句子
  if (/[.!?;:]/.test(cleaned)) {
    return false;
  }
  
  // 如果长度超过50个字符，可能是句子
  if (cleaned.length > 50) {
    return false;
  }
  
  return true;
}

// 使用 curl 命令获取 HTML
function fetchHTML(url) {
  try {
    // 构建 curl 命令，包含所有必要的 headers
    const curlCommand = `curl -s -w "\\nHTTP_STATUS:%{http_code}" '${url}' \
      -H 'accept: */*' \
      -H 'accept-language: zh-CN,zh-TW;q=0.9,zh;q=0.8,en;q=0.7,fr;q=0.6' \
      -H 'cache-control: no-cache' \
      -H 'pragma: no-cache' \
      -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'`;
    
    // 执行 curl 命令
    const output = execSync(curlCommand, { 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 30000 // 30秒超时
    });
    
    // 解析响应和状态码
    const parts = output.split('HTTP_STATUS:');
    const text = parts[0];
    const statusCode = parseInt(parts[1] || '0');
    
    return { 
      ok: statusCode === 200, 
      status: statusCode, 
      text: text 
    };
  } catch (error) {
    console.error('Curl 执行错误:', error.message);
    return { 
      ok: false, 
      status: 0, 
      text: '' 
    };
  }
}

// 获取单个单词的音标
function fetchPhonetic(word) {
  const cleanedWord = cleanWord(word);
  
  try {
    const url = `https://de.wiktionary.org/api/rest_v1/page/html/${encodeURIComponent(cleanedWord)}`;
    const response = fetchHTML(url);

    if (!response.ok) {
      console.log(`  ⚠️  API 返回错误: ${response.status} - ${cleanedWord}`);
      return null;
    }

    const html = response.text;
    
    // 使用 jsdom 解析 HTML（与前端 DOMParser 一致）
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // 查找所有 class="ipa" 的元素
    const ipas = Array.from(doc.querySelectorAll('.ipa'))
      .map(el => el.textContent?.trim())
      .filter(Boolean);
    
    if (ipas.length > 0 && ipas[0]) {
      let ipa = ipas[0];
      // 确保音标前后都有斜杠
      if (!ipa.startsWith('/')) {
        ipa = '/' + ipa;
      }
      if (!ipa.endsWith('/')) {
        ipa = ipa + '/';
      }
      
      return ipa;
    }
    
    return null;
  } catch (error) {
    console.log(`  ❌ 获取失败: ${cleanedWord} - ${error.message}`);
    return null;
  }
}

// 主函数
function main() {
  console.log('🚀 开始批量获取音标...\n');
  
  // 读取 words.json
  const wordsData = JSON.parse(readFileSync(WORDS_FILE, 'utf-8'));
  console.log(`📚 共 ${wordsData.length} 个单词\n`);
  
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  // 逐个处理单词
  for (let i = 0; i < wordsData.length; i++) {
    const wordObj = wordsData[i];
    const progress = `[${i + 1}/${wordsData.length}]`;
    
    // 如果已经有音标，跳过
    if (wordObj.phonetic) {
      console.log(`${progress} ⏭️  跳过（已有音标）: ${wordObj.word}`);
      skipCount++;
      continue;
    }
    
    // 如果之前获取失败过，跳过
    if (wordObj.phoneticFailed) {
      console.log(`${progress} ⏭️  跳过（之前失败）: ${wordObj.word}`);
      skipCount++;
      continue;
    }
    
    // 判断是否为单词，如果是句子则跳过
    if (!isWord(wordObj.word)) {
      console.log(`${progress} ⏭️  跳过（句子/短语）: ${wordObj.word}`);
      skipCount++;
      continue;
    }
    
    console.log(`${progress} 🔍 获取: ${wordObj.word}`);
    
    // 重试机制：最多尝试1次（即总共尝试2次）
    let phonetic = null;
    let retries = 0;
    const maxRetries = 1;
    
    while (!phonetic && retries <= maxRetries) {
      if (retries > 0) {
        console.log(`${progress} 🔄 重试 ${retries}/${maxRetries}: ${wordObj.word}`);
        // 重试前等待（使用同步方式）
        execSync('sleep 1');
      }
      
      phonetic = fetchPhonetic(wordObj.word);
      retries++;
    }
    
    if (phonetic) {
      wordObj.phonetic = phonetic;
      // 清除失败标记（如果之前有）
      delete wordObj.phoneticFailed;
      console.log(`${progress} ✅ 成功: ${wordObj.word} -> ${phonetic}`);
      successCount++;
    } else {
      // 标记为失败，下次运行时跳过
      wordObj.phoneticFailed = true;
      console.log(`${progress} ⚠️  未找到: ${wordObj.word} (已标记为失败)`);
      failCount++;
    }
    
    // 每处理 10 个单词保存一次（防止中断丢失数据）
    if ((i + 1) % 10 === 0) {
      writeFileSync(WORDS_FILE, JSON.stringify(wordsData, null, 2));
      console.log(`\n💾 已保存进度 (${i + 1}/${wordsData.length})\n`);
    }
    
    // 延迟，避免请求过快
    delay(DELAY_MS);
  }
  
  // 最终保存
  writeFileSync(WORDS_FILE, JSON.stringify(wordsData, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ 批量获取完成！');
  console.log(`✅ 成功: ${successCount}`);
  console.log(`⏭️  跳过: ${skipCount}`);
  console.log(`⚠️  失败: ${failCount}`);
  console.log(`📊 总计: ${wordsData.length}`);
  console.log('='.repeat(50));
}

main().catch(console.error);

