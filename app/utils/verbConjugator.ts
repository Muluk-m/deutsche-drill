/**
 * 德语动词变位生成器
 * 
 * 功能：
 * 1. 为规则动词自动生成现在时变位
 * 2. 内置常见不规则动词的变位表
 * 3. 处理特殊变位规则（词干变音等）
 */

import type { VerbConjugation, VerbPersonForms } from '../types/word';

/**
 * 不规则动词变位表
 * 包含德语中最常用的不规则动词
 */
const irregularVerbs: Record<string, VerbPersonForms> = {
  // sein 系列
  sein: { ich: 'bin', du: 'bist', er: 'ist', wir: 'sind', ihr: 'seid', sie: 'sind' },
  
  // haben 系列
  haben: { ich: 'habe', du: 'hast', er: 'hat', wir: 'haben', ihr: 'habt', sie: 'haben' },
  
  // werden 系列
  werden: { ich: 'werde', du: 'wirst', er: 'wird', wir: 'werden', ihr: 'werdet', sie: 'werden' },
  
  // 情态动词
  können: { ich: 'kann', du: 'kannst', er: 'kann', wir: 'können', ihr: 'könnt', sie: 'können' },
  müssen: { ich: 'muss', du: 'musst', er: 'muss', wir: 'müssen', ihr: 'müsst', sie: 'müssen' },
  dürfen: { ich: 'darf', du: 'darfst', er: 'darf', wir: 'dürfen', ihr: 'dürft', sie: 'dürfen' },
  sollen: { ich: 'soll', du: 'sollst', er: 'soll', wir: 'sollen', ihr: 'sollt', sie: 'sollen' },
  wollen: { ich: 'will', du: 'willst', er: 'will', wir: 'wollen', ihr: 'wollt', sie: 'wollen' },
  mögen: { ich: 'mag', du: 'magst', er: 'mag', wir: 'mögen', ihr: 'mögt', sie: 'mögen' },
  
  // wissen
  wissen: { ich: 'weiß', du: 'weißt', er: 'weiß', wir: 'wissen', ihr: 'wisst', sie: 'wissen' },
  
  // 常用强变化动词 (e->i 变音)
  geben: { ich: 'gebe', du: 'gibst', er: 'gibt', wir: 'geben', ihr: 'gebt', sie: 'geben' },
  nehmen: { ich: 'nehme', du: 'nimmst', er: 'nimmt', wir: 'nehmen', ihr: 'nehmt', sie: 'nehmen' },
  sprechen: { ich: 'spreche', du: 'sprichst', er: 'spricht', wir: 'sprechen', ihr: 'sprecht', sie: 'sprechen' },
  sehen: { ich: 'sehe', du: 'siehst', er: 'sieht', wir: 'sehen', ihr: 'seht', sie: 'sehen' },
  lesen: { ich: 'lese', du: 'liest', er: 'liest', wir: 'lesen', ihr: 'lest', sie: 'lesen' },
  essen: { ich: 'esse', du: 'isst', er: 'isst', wir: 'essen', ihr: 'esst', sie: 'essen' },
  helfen: { ich: 'helfe', du: 'hilfst', er: 'hilft', wir: 'helfen', ihr: 'helft', sie: 'helfen' },
  treffen: { ich: 'treffe', du: 'triffst', er: 'trifft', wir: 'treffen', ihr: 'trefft', sie: 'treffen' },
  vergessen: { ich: 'vergesse', du: 'vergisst', er: 'vergisst', wir: 'vergessen', ihr: 'vergesst', sie: 'vergessen' },
  werfen: { ich: 'werfe', du: 'wirfst', er: 'wirft', wir: 'werfen', ihr: 'werft', sie: 'werfen' },
  sterben: { ich: 'sterbe', du: 'stirbst', er: 'stirbt', wir: 'sterben', ihr: 'sterbt', sie: 'sterben' },
  brechen: { ich: 'breche', du: 'brichst', er: 'bricht', wir: 'brechen', ihr: 'brecht', sie: 'brechen' },
  
  // 常用强变化动词 (a->ä 变音)
  fahren: { ich: 'fahre', du: 'fährst', er: 'fährt', wir: 'fahren', ihr: 'fahrt', sie: 'fahren' },
  fallen: { ich: 'falle', du: 'fällst', er: 'fällt', wir: 'fallen', ihr: 'fallt', sie: 'fallen' },
  halten: { ich: 'halte', du: 'hältst', er: 'hält', wir: 'halten', ihr: 'haltet', sie: 'halten' },
  lassen: { ich: 'lasse', du: 'lässt', er: 'lässt', wir: 'lassen', ihr: 'lasst', sie: 'lassen' },
  schlafen: { ich: 'schlafe', du: 'schläfst', er: 'schläft', wir: 'schlafen', ihr: 'schlaft', sie: 'schlafen' },
  tragen: { ich: 'trage', du: 'trägst', er: 'trägt', wir: 'tragen', ihr: 'tragt', sie: 'tragen' },
  waschen: { ich: 'wasche', du: 'wäschst', er: 'wäscht', wir: 'waschen', ihr: 'wascht', sie: 'waschen' },
  wachsen: { ich: 'wachse', du: 'wächst', er: 'wächst', wir: 'wachsen', ihr: 'wachst', sie: 'wachsen' },
  laufen: { ich: 'laufe', du: 'läufst', er: 'läuft', wir: 'laufen', ihr: 'lauft', sie: 'laufen' },
  fangen: { ich: 'fange', du: 'fängst', er: 'fängt', wir: 'fangen', ihr: 'fangt', sie: 'fangen' },
  anfangen: { ich: 'fange an', du: 'fängst an', er: 'fängt an', wir: 'fangen an', ihr: 'fangt an', sie: 'fangen an' },
  
  // 常用强变化动词 (其他变音)
  gehen: { ich: 'gehe', du: 'gehst', er: 'geht', wir: 'gehen', ihr: 'geht', sie: 'gehen' },
  kommen: { ich: 'komme', du: 'kommst', er: 'kommt', wir: 'kommen', ihr: 'kommt', sie: 'kommen' },
  stehen: { ich: 'stehe', du: 'stehst', er: 'steht', wir: 'stehen', ihr: 'steht', sie: 'stehen' },
  verstehen: { ich: 'verstehe', du: 'verstehst', er: 'versteht', wir: 'verstehen', ihr: 'versteht', sie: 'verstehen' },
  finden: { ich: 'finde', du: 'findest', er: 'findet', wir: 'finden', ihr: 'findet', sie: 'finden' },
  binden: { ich: 'binde', du: 'bindest', er: 'bindet', wir: 'binden', ihr: 'bindet', sie: 'binden' },
  singen: { ich: 'singe', du: 'singst', er: 'singt', wir: 'singen', ihr: 'singt', sie: 'singen' },
  trinken: { ich: 'trinke', du: 'trinkst', er: 'trinkt', wir: 'trinken', ihr: 'trinkt', sie: 'trinken' },
  schwimmen: { ich: 'schwimme', du: 'schwimmst', er: 'schwimmt', wir: 'schwimmen', ihr: 'schwimmt', sie: 'schwimmen' },
  beginnen: { ich: 'beginne', du: 'beginnst', er: 'beginnt', wir: 'beginnen', ihr: 'beginnt', sie: 'beginnen' },
  gewinnen: { ich: 'gewinne', du: 'gewinnst', er: 'gewinnt', wir: 'gewinnen', ihr: 'gewinnt', sie: 'gewinnen' },
  
  // 混合变化动词
  bringen: { ich: 'bringe', du: 'bringst', er: 'bringt', wir: 'bringen', ihr: 'bringt', sie: 'bringen' },
  denken: { ich: 'denke', du: 'denkst', er: 'denkt', wir: 'denken', ihr: 'denkt', sie: 'denken' },
  kennen: { ich: 'kenne', du: 'kennst', er: 'kennt', wir: 'kennen', ihr: 'kennt', sie: 'kennen' },
  nennen: { ich: 'nenne', du: 'nennst', er: 'nennt', wir: 'nennen', ihr: 'nennt', sie: 'nennen' },
  rennen: { ich: 'renne', du: 'rennst', er: 'rennt', wir: 'rennen', ihr: 'rennt', sie: 'rennen' },
  senden: { ich: 'sende', du: 'sendest', er: 'sendet', wir: 'senden', ihr: 'sendet', sie: 'senden' },
  wenden: { ich: 'wende', du: 'wendest', er: 'wendet', wir: 'wenden', ihr: 'wendet', sie: 'wenden' },
  
  // 其他常用动词
  tun: { ich: 'tue', du: 'tust', er: 'tut', wir: 'tun', ihr: 'tut', sie: 'tun' },
  rufen: { ich: 'rufe', du: 'rufst', er: 'ruft', wir: 'rufen', ihr: 'ruft', sie: 'rufen' },
  schreiben: { ich: 'schreibe', du: 'schreibst', er: 'schreibt', wir: 'schreiben', ihr: 'schreibt', sie: 'schreiben' },
  schließen: { ich: 'schließe', du: 'schließt', er: 'schließt', wir: 'schließen', ihr: 'schließt', sie: 'schließen' },
  ziehen: { ich: 'ziehe', du: 'ziehst', er: 'zieht', wir: 'ziehen', ihr: 'zieht', sie: 'ziehen' },
  fliegen: { ich: 'fliege', du: 'fliegst', er: 'fliegt', wir: 'fliegen', ihr: 'fliegt', sie: 'fliegen' },
  verlieren: { ich: 'verliere', du: 'verlierst', er: 'verliert', wir: 'verlieren', ihr: 'verliert', sie: 'verlieren' },
  liegen: { ich: 'liege', du: 'liegst', er: 'liegt', wir: 'liegen', ihr: 'liegt', sie: 'liegen' },
  sitzen: { ich: 'sitze', du: 'sitzt', er: 'sitzt', wir: 'sitzen', ihr: 'sitzt', sie: 'sitzen' },
  schneiden: { ich: 'schneide', du: 'schneidest', er: 'schneidet', wir: 'schneiden', ihr: 'schneidet', sie: 'schneiden' },
  leiden: { ich: 'leide', du: 'leidest', er: 'leidet', wir: 'leiden', ihr: 'leidet', sie: 'leiden' },
  reiten: { ich: 'reite', du: 'reitest', er: 'reitet', wir: 'reiten', ihr: 'reitet', sie: 'reiten' },
  streiten: { ich: 'streite', du: 'streitest', er: 'streitet', wir: 'streiten', ihr: 'streitet', sie: 'streiten' },
  scheinen: { ich: 'scheine', du: 'scheinst', er: 'scheint', wir: 'scheinen', ihr: 'scheint', sie: 'scheinen' },
  bleiben: { ich: 'bleibe', du: 'bleibst', er: 'bleibt', wir: 'bleiben', ihr: 'bleibt', sie: 'bleiben' },
  heißen: { ich: 'heiße', du: 'heißt', er: 'heißt', wir: 'heißen', ihr: 'heißt', sie: 'heißen' },
  beißen: { ich: 'beiße', du: 'beißt', er: 'beißt', wir: 'beißen', ihr: 'beißt', sie: 'beißen' },
  reißen: { ich: 'reiße', du: 'reißt', er: 'reißt', wir: 'reißen', ihr: 'reißt', sie: 'reißen' },
  schreien: { ich: 'schreie', du: 'schreist', er: 'schreit', wir: 'schreien', ihr: 'schreit', sie: 'schreien' },
  stoßen: { ich: 'stoße', du: 'stößt', er: 'stößt', wir: 'stoßen', ihr: 'stoßt', sie: 'stoßen' },
  einladen: { ich: 'lade ein', du: 'lädst ein', er: 'lädt ein', wir: 'laden ein', ihr: 'ladet ein', sie: 'laden ein' },
  laden: { ich: 'lade', du: 'lädst', er: 'lädt', wir: 'laden', ihr: 'ladet', sie: 'laden' },
};

/**
 * 从动词字符串提取不定式
 * 处理类似 "gehen, geht" 或 "spazieren gehen, geht spazieren" 的格式
 */
export function extractInfinitive(verbString: string): string {
  // 移除逗号后的变位形式
  let infinitive = verbString.split(',')[0].trim();
  
  // 如果是可分动词短语（如 "spazieren gehen"），取最后一个词
  const words = infinitive.split(/\s+/);
  if (words.length > 1) {
    // 检查是否是类似 "Musik hören" 的短语
    const lastWord = words[words.length - 1].toLowerCase();
    if (lastWord.endsWith('en') || lastWord.endsWith('ern') || lastWord.endsWith('eln')) {
      infinitive = lastWord;
    }
  }
  
  return infinitive.toLowerCase();
}

/**
 * 获取动词词干
 * 规则：移除 -en 或 -n（针对以 -eln, -ern 结尾的动词）
 */
function getVerbStem(infinitive: string): string {
  const lower = infinitive.toLowerCase();
  
  // 特殊处理 -eln, -ern 结尾的动词
  if (lower.endsWith('eln') || lower.endsWith('ern')) {
    return lower.slice(0, -1); // 只移除 n，保留 el/er
  }
  
  // 一般情况：移除 -en
  if (lower.endsWith('en')) {
    return lower.slice(0, -2);
  }
  
  // 如果只以 -n 结尾（不太常见）
  if (lower.endsWith('n')) {
    return lower.slice(0, -1);
  }
  
  return lower;
}

/**
 * 检查词干是否需要额外的 e
 * 当词干以 -t, -d, -m, -n（前有辅音）, -ffn, -chn 结尾时
 */
function needsExtraE(stem: string): boolean {
  // 以 t 或 d 结尾
  if (/[td]$/.test(stem)) {
    return true;
  }
  
  // 以 辅音+m 或 辅音+n 结尾（除了 lm, ln, rm, rn）
  if (/[^aeiouäöülr][mn]$/.test(stem)) {
    return true;
  }
  
  // 以 -ffn, -chn 结尾
  if (/ffn$|chn$/.test(stem)) {
    return true;
  }
  
  return false;
}

/**
 * 检查词干是否以 s 音结尾（-s, -ß, -z, -x）
 * 这种情况 du 形式只加 t 而不是 st
 */
function endsWithSSound(stem: string): boolean {
  return /[sßzx]$/.test(stem);
}

/**
 * 生成规则动词的现在时变位
 */
function generateRegularConjugation(infinitive: string): VerbPersonForms {
  const stem = getVerbStem(infinitive);
  const needsE = needsExtraE(stem);
  const sSound = endsWithSSound(stem);
  
  // 处理 -eln 动词 (ich 形式可能丢失 e)
  let ichStem = stem;
  if (infinitive.endsWith('eln')) {
    // sammeln -> samml/sammle, 有些 -eln 动词 ich 形式丢失 e
    // 但大多数保留，这里简化处理，保留 e
  }
  
  return {
    ich: `${ichStem}e`,
    du: sSound ? `${stem}t` : (needsE ? `${stem}est` : `${stem}st`),
    er: needsE ? `${stem}et` : `${stem}t`,
    wir: `${infinitive.toLowerCase()}`, // 与不定式相同
    ihr: needsE ? `${stem}et` : `${stem}t`,
    sie: `${infinitive.toLowerCase()}`, // 与不定式相同
  };
}

/**
 * 为动词生成变位
 * 优先使用不规则动词表，否则按规则生成
 */
export function conjugateVerb(verbString: string): VerbConjugation | null {
  const infinitive = extractInfinitive(verbString);
  
  // 检查是否在不规则动词表中
  const irregular = irregularVerbs[infinitive];
  if (irregular) {
    return {
      infinitive,
      present: irregular,
    };
  }
  
  // 检查是否是以不规则动词为基础的前缀动词
  // 例如 aufstehen 基于 stehen
  for (const baseVerb of Object.keys(irregularVerbs)) {
    if (infinitive !== baseVerb && infinitive.endsWith(baseVerb)) {
      const prefix = infinitive.slice(0, -baseVerb.length);
      const baseConj = irregularVerbs[baseVerb];
      
      // 检查是否是可分动词前缀
      const separablePrefixes = [
        'ab', 'an', 'auf', 'aus', 'bei', 'ein', 'fest', 'her', 'hin',
        'los', 'mit', 'nach', 'vor', 'weg', 'zu', 'zurück', 'zusammen'
      ];
      
      if (separablePrefixes.includes(prefix)) {
        // 可分动词：前缀放在后面
        return {
          infinitive,
          present: {
            ich: `${baseConj.ich} ${prefix}`,
            du: `${baseConj.du} ${prefix}`,
            er: `${baseConj.er} ${prefix}`,
            wir: `${baseConj.wir} ${prefix}`,
            ihr: `${baseConj.ihr} ${prefix}`,
            sie: `${baseConj.sie} ${prefix}`,
          },
        };
      } else {
        // 不可分动词：前缀不分离
        return {
          infinitive,
          present: {
            ich: prefix + baseConj.ich,
            du: prefix + baseConj.du,
            er: prefix + baseConj.er,
            wir: prefix + baseConj.wir,
            ihr: prefix + baseConj.ihr,
            sie: prefix + baseConj.sie,
          },
        };
      }
    }
  }
  
  // 验证是否看起来像动词（以 -en, -eln, -ern 结尾）
  if (!infinitive.match(/e[rln]?n$/)) {
    return null;
  }
  
  // 生成规则变位
  return {
    infinitive,
    present: generateRegularConjugation(infinitive),
  };
}

/**
 * 检查动词是否是不规则动词
 */
export function isIrregularVerb(verbString: string): boolean {
  const infinitive = extractInfinitive(verbString);
  return irregularVerbs.hasOwnProperty(infinitive);
}

/**
 * 获取所有内置的不规则动词列表
 */
export function getIrregularVerbList(): string[] {
  return Object.keys(irregularVerbs);
}


