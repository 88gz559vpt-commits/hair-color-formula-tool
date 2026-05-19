import { readFile } from 'node:fs/promises';

const indexHtml = await readFile('index.html', 'utf8');
const match = indexHtml.match(/<script id="formula-data" type="application\/json">([\s\S]*?)<\/script>/);
if (!match) throw new Error('index.html 中缺少内置配方数据脚本');

const embeddedFormulas = JSON.parse(match[1]);
const jsonFormulas = JSON.parse(await readFile('src/data/colorFormulas.json', 'utf8'));
const allowed = new Set(['6-7', '8-9', '10-12', '13-15', '16-null']);

for (const formula of embeddedFormulas) {
  const key = `${formula.levelRange.min}-${formula.levelRange.max}`;
  if (!allowed.has(key)) throw new Error(`${formula.name} 的明度区间不符合不重叠规则：${key}`);
}

if (embeddedFormulas.length !== jsonFormulas.length) {
  throw new Error(`index.html 内置配方数量(${embeddedFormulas.length})与 JSON 文件(${jsonFormulas.length})不一致`);
}

JSON.parse(await readFile('package.json', 'utf8'));
console.log('独立 HTML、JSON 与明度区间校验通过');
