import type { ColorFormula } from './types/formula';
import type { CustomerCase, DamageLevel, GrayPercentage, HairStatus, TargetColor } from './types/customerCase';
import { buildRecommendation, formatLevelRange } from './core';

const HISTORY_KEY = 'hair-color-formula-cases';
const root = document.querySelector<HTMLDivElement>('#app');

if (!root) throw new Error('缺少 #app 根节点');
const app: HTMLDivElement = root;

type PageKey = 'dashboard' | 'new' | 'search' | 'history' | 'settings';

const damageOptions: DamageLevel[] = ['健康', '轻度受损', '中度受损', '严重受损'];
const grayOptions: GrayPercentage[] = ['0%', '1-30%', '31-50%', '51-80%', '80%以上'];
const toneOptions = ['自然色', '冷色', '暖色', '雾感', '暖中性'];
let formulas: ColorFormula[] = [];
let page: PageKey = 'dashboard';
let savedMessage = '';

let customerName = '';
let stylist = '';
let caseDate = new Date().toISOString().slice(0, 10);
let hairStatus: HairStatus = {
  newGrowth: { length: '3cm', level: 4, pigmentStatus: '自然黑', hasGrayHair: false, grayPercentage: '0%', texture: '普通', damage: '健康' },
  midLength: { level: 7, baseTone: '偏橙', artificialPigmentResidue: true, warmResidue: true, damage: '轻度受损' },
  ends: { level: 10, baseTone: '偏黄', artificialPigmentResidue: true, warmResidue: false, damage: '中度受损' },
};
let target: TargetColor = {
  colorName: '冷棕色',
  targetLevel: 7,
  tone: '冷色',
  needBleach: false,
  needEvenBase: true,
  needGrayCoverage: false,
  allowFade: false,
  acceptMultipleSteps: true,
};

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char);
const toNumber = (value: FormDataEntryValue | null) => Number(value) || 0;
const yesNo = (value: boolean) => value ? '是' : '否';

function getHistory(): CustomerCase[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) as CustomerCase[] : [];
}

function setHistory(cases: CustomerCase[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(cases));
}

function shell(content: string) {
  app.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">Hair Color Studio</p>
        <h1>染发配方工具</h1>
      </div>
      <nav>
        ${[
          ['dashboard', '工作台'],
          ['new', '新建方案'],
          ['search', '高频色查询'],
          ['history', '历史方案'],
          ['settings', '设置'],
        ].map(([key, label]) => `<button class="nav ${page === key ? 'active' : ''}" data-page="${key}">${label}</button>`).join('')}
      </nav>
    </header>
    <main>${content}</main>
  `;
  app.querySelectorAll<HTMLButtonElement>('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      page = button.dataset.page as PageKey;
      savedMessage = '';
      render();
    });
  });
}

function renderDashboard() {
  shell(`
    <section class="hero">
      <p class="eyebrow">内部工作台</p>
      <h2>染发配方推荐工具 MVP</h2>
      <p>根据新生发、发中、发尾的实际显示明度与发况，辅助发型师输出分区配方、操作流程、风险提示和本地历史记录。</p>
    </section>
    <section class="entry-grid">
      ${[
        ['new', '新建顾客染发方案', '录入三段发况并实时生成分区配方建议。'],
        ['search', '高频色配方查询', '按颜色、明度、色调、漂发与遮白快速筛选。'],
        ['history', '历史方案记录', '查看本地保存的顾客配方与风险提示。'],
        ['settings', '配方数据管理 / 设置', '查看当前 MVP 数据范围与扩展说明。'],
      ].map(([key, title, desc]) => `<button class="card entry" data-page="${key}"><strong>${title}</strong><span>${desc}</span></button>`).join('')}
    </section>
  `);
}

function field(label: string, name: string, value: string | number, type = 'text', extra = '') {
  return `<label><span>${label}</span><input name="${name}" type="${type}" value="${escapeHtml(value)}" ${extra}></label>`;
}

function selectField(label: string, name: string, value: string, options: string[]) {
  return `<label><span>${label}</span><select name="${name}">${options.map((option) => `<option ${option === value ? 'selected' : ''}>${option}</option>`).join('')}</select></label>`;
}

function checkbox(label: string, name: string, checked: boolean) {
  return `<label class="check"><input name="${name}" type="checkbox" ${checked ? 'checked' : ''}> ${label}</label>`;
}

function renderResult() {
  const recommendation = buildRecommendation(formulas, hairStatus, target);
  return `
    <section class="card">
      <div class="summary-head"><div><h2>推荐摘要</h2><p>${recommendation.summary}</p></div><strong class="pill dark">难度：${recommendation.difficulty}</strong></div>
      <div class="mini-grid">
        <p><b>适合直接上色：</b>${yesNo(recommendation.directColoringSuitable)}</p>
        <p><b>需要漂发/提浅：</b>${yesNo(recommendation.needBleach)}</p>
        <p><b>需要分区：</b>${yesNo(recommendation.needSectioning)}</p>
        <p><b>较大翻车风险：</b>${yesNo(recommendation.highRisk)}</p>
      </div>
      <button class="primary" id="save-case">保存到历史方案</button>
      ${savedMessage ? `<p class="success">${savedMessage}</p>` : ''}
    </section>
    <section class="risk ${recommendation.risks.length ? '' : 'safe'}">
      <h3>${recommendation.risks.length ? '风险提示' : '暂无明显风险'}</h3>
      ${recommendation.risks.length ? `<ul>${recommendation.risks.map((risk) => `<li>⚠️ ${risk}</li>`).join('')}</ul>` : '<p>仍建议现场做发质与色素评估。</p>'}
    </section>
    <section class="card">
      <h2>分区配方建议</h2>
      <div class="zone-list">
        ${recommendation.sectionAdvices.map((advice) => `
          <article class="zone-card">
            <div class="summary-head"><h3>${advice.zone} · ${escapeHtml(advice.formulaName)}</h3><span>停放：${escapeHtml(advice.processingTime)}</span></div>
            <div class="mini-grid">
              <p><b>染膏：</b>${advice.formulaItems.map((item) => `${escapeHtml(item.product)} ${escapeHtml(item.shade)}×${item.ratio}`).join(' + ')}</p>
              <p><b>双氧：</b>${escapeHtml(advice.developer)}</p>
              <p><b>调配比例：</b>${escapeHtml(advice.mixRatio)}</p>
              <p><b>补色：</b>${yesNo(advice.needToning)}</p>
              <p><b>打底/回填：</b>${yesNo(advice.needFilling)}</p>
              <p><b>沐浴漂：</b>${yesNo(advice.needBleachBath)}</p>
              <p><b>先褪色：</b>${yesNo(advice.needPreLighten)}</p>
            </div>
            <p class="note">${advice.advice}</p>
          </article>
        `).join('')}
      </div>
    </section>
    <section class="card"><h2>操作流程</h2><ol>${recommendation.steps.map((step) => `<li>${step}</li>`).join('')}</ol></section>
  `;
}

function syncCaseForm(form: HTMLFormElement) {
  const data = new FormData(form);
  customerName = String(data.get('customerName') ?? '');
  stylist = String(data.get('stylist') ?? '');
  caseDate = String(data.get('caseDate') ?? caseDate);
  hairStatus = {
    newGrowth: {
      length: String(data.get('newGrowthLength') ?? ''),
      level: toNumber(data.get('newGrowthLevel')),
      pigmentStatus: String(data.get('pigmentStatus') ?? ''),
      hasGrayHair: data.has('hasGrayHair'),
      grayPercentage: String(data.get('grayPercentage')) as GrayPercentage,
      texture: String(data.get('texture') ?? '普通'),
      damage: String(data.get('newGrowthDamage')) as DamageLevel,
    },
    midLength: {
      level: toNumber(data.get('midLevel')),
      baseTone: String(data.get('midBaseTone') ?? ''),
      artificialPigmentResidue: data.has('midResidue'),
      warmResidue: data.has('midWarmResidue'),
      damage: String(data.get('midDamage')) as DamageLevel,
    },
    ends: {
      level: toNumber(data.get('endsLevel')),
      baseTone: String(data.get('endsBaseTone') ?? ''),
      artificialPigmentResidue: data.has('endsResidue'),
      warmResidue: data.has('endsWarmResidue'),
      damage: String(data.get('endsDamage')) as DamageLevel,
    },
  };
  target = {
    colorName: String(data.get('colorName') ?? ''),
    targetLevel: toNumber(data.get('targetLevel')),
    tone: String(data.get('tone') ?? '冷色'),
    needBleach: data.has('needBleach'),
    needEvenBase: data.has('needEvenBase'),
    needGrayCoverage: data.has('needGrayCoverage'),
    allowFade: data.has('allowFade'),
    acceptMultipleSteps: data.has('acceptMultipleSteps'),
  };
}

function renderNewCase() {
  shell(`
    <div class="workspace">
      <form id="case-form" class="form-stack">
        <section class="card"><h2>顾客基础信息</h2><div class="grid three">
          ${field('顾客姓名（可选）', 'customerName', customerName, 'text', 'placeholder="顾客A"')}
          ${field('日期', 'caseDate', caseDate, 'date')}
          ${field('发型师（可选）', 'stylist', stylist, 'text', 'placeholder="发型师A"')}
        </div></section>
        <section class="card"><h2>新生发</h2><div class="grid two">
          ${field('新生发长度', 'newGrowthLength', hairStatus.newGrowth.length, 'text', 'placeholder="如 3cm"')}
          ${field('新生发明度', 'newGrowthLevel', hairStatus.newGrowth.level, 'number', 'min="1"')}
          ${field('色素情况', 'pigmentStatus', hairStatus.newGrowth.pigmentStatus, 'text', 'placeholder="自然黑 / 偏暖"')}
          ${selectField('发质粗细', 'texture', hairStatus.newGrowth.texture, ['细软', '普通', '粗硬'])}
          ${selectField('白发比例', 'grayPercentage', hairStatus.newGrowth.grayPercentage, grayOptions)}
          ${selectField('受损程度', 'newGrowthDamage', hairStatus.newGrowth.damage, damageOptions)}
          ${checkbox('是否有白发', 'hasGrayHair', hairStatus.newGrowth.hasGrayHair)}
        </div></section>
        <section class="card"><h2>发中</h2><div class="grid two">
          ${field('发中明度', 'midLevel', hairStatus.midLength.level, 'number', 'min="1"')}
          ${field('发中底色', 'midBaseTone', hairStatus.midLength.baseTone, 'text', 'placeholder="偏橙 / 偏黄"')}
          ${selectField('受损程度', 'midDamage', hairStatus.midLength.damage, damageOptions)}
          <div class="checks">${checkbox('有人工色素残留', 'midResidue', hairStatus.midLength.artificialPigmentResidue)}${checkbox('有暖色残留', 'midWarmResidue', hairStatus.midLength.warmResidue)}</div>
        </div></section>
        <section class="card"><h2>发尾</h2><div class="grid two">
          ${field('发尾明度', 'endsLevel', hairStatus.ends.level, 'number', 'min="1"')}
          ${field('发尾底色', 'endsBaseTone', hairStatus.ends.baseTone, 'text', 'placeholder="偏橙 / 偏黄"')}
          ${selectField('受损程度', 'endsDamage', hairStatus.ends.damage, damageOptions)}
          <div class="checks">${checkbox('有人工色素残留', 'endsResidue', hairStatus.ends.artificialPigmentResidue)}${checkbox('有暖色残留', 'endsWarmResidue', hairStatus.ends.warmResidue)}</div>
        </div></section>
        <section class="card"><h2>目标色</h2><div class="grid two">
          ${field('目标色名称', 'colorName', target.colorName, 'text', `list="formula-names"`)}
          <datalist id="formula-names">${formulas.map((formula) => `<option value="${escapeHtml(formula.name)}"></option>`).join('')}</datalist>
          ${field('目标明度', 'targetLevel', target.targetLevel, 'number', 'min="1"')}
          ${selectField('目标色调', 'tone', target.tone, toneOptions)}
          <div class="checks wide">${checkbox('需要漂发', 'needBleach', target.needBleach)}${checkbox('需要统一底色', 'needEvenBase', target.needEvenBase)}${checkbox('需要遮白', 'needGrayCoverage', target.needGrayCoverage)}${checkbox('允许明显褪色', 'allowFade', target.allowFade)}${checkbox('接受多步骤操作', 'acceptMultipleSteps', target.acceptMultipleSteps)}</div>
        </div></section>
      </form>
      <aside>${renderResult()}</aside>
    </div>
  `);
  const form = app.querySelector<HTMLFormElement>('#case-form');
  form?.addEventListener('input', () => {
    syncCaseForm(form);
    savedMessage = '';
    renderNewCase();
  });
  app.querySelector<HTMLButtonElement>('#save-case')?.addEventListener('click', () => {
    if (form) syncCaseForm(form);
    const nextCase: CustomerCase = {
      id: `case_${Date.now()}`,
      customerName,
      date: caseDate,
      stylist,
      hairStatus,
      target,
      recommendation: buildRecommendation(formulas, hairStatus, target),
      createdAt: new Date().toISOString(),
    };
    setHistory([nextCase, ...getHistory()]);
    savedMessage = '已保存到历史方案。';
    renderNewCase();
  });
}

function renderSearch() {
  const params = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const keyword = params.get('q') ?? '';
  const range = params.get('range') ?? 'all';
  const tone = params.get('tone') ?? 'all';
  const bleach = params.get('bleach') ?? 'all';
  const gray = params.get('gray') ?? 'all';
  const toneList = Array.from(new Set(formulas.map((formula) => formula.tone)));
  const filtered = formulas.filter((formula) => {
    const keywordMatched = formula.name.includes(keyword) || formula.targetEffect.includes(keyword) || formula.baseRequirement.includes(keyword);
    const rangeMatched = range === 'all' || (range === '16+' ? formula.levelRange.max === null : range === formatLevelRange(formula.levelRange).replace('度', ''));
    const toneMatched = tone === 'all' || formula.tone === tone;
    const bleachMatched = bleach === 'all' || formula.needBleach === (bleach === 'yes');
    const grayMatched = gray === 'all' || formula.suitableForGrayCoverage === (gray === 'yes');
    return keywordMatched && rangeMatched && toneMatched && bleachMatched && grayMatched;
  });
  shell(`
    <section class="card"><h2>高频色配方查询</h2><p class="muted">示例数据已使用不重叠明度区间：6-7、8-9、10-12、13-15、16度以上。</p>
      <form id="search-form" class="grid five">
        ${field('颜色名称搜索', 'q', keyword, 'search', 'placeholder="冷棕色"')}
        ${selectField('明度区间', 'range', range, ['all', '6-7', '8-9', '10-12', '13-15', '16+'])}
        ${selectField('色调', 'tone', tone, ['all', ...toneList])}
        ${selectField('是否需要漂发', 'bleach', bleach, ['all', 'yes', 'no'])}
        ${selectField('适合遮白', 'gray', gray, ['all', 'yes', 'no'])}
      </form>
    </section>
    <section class="card table-wrap"><table><thead><tr><th>颜色</th><th>明度区间</th><th>色调</th><th>推荐底色</th><th>漂发</th><th>遮白</th><th>双氧</th></tr></thead><tbody>
      ${filtered.map((formula) => `<tr><td><b>${formula.name}</b></td><td>${formatLevelRange(formula.levelRange)}</td><td>${formula.tone}</td><td>${formula.baseRequirement}</td><td>${formula.needBleach ? '需要' : '不需要'}</td><td>${formula.suitableForGrayCoverage ? '适合' : '不适合'}</td><td>${formula.developer}</td></tr>`).join('')}
    </tbody></table></section>
    <section class="formula-grid">${filtered.map(renderFormulaCard).join('')}</section>
  `);
  app.querySelector<HTMLFormElement>('#search-form')?.addEventListener('input', (event) => {
    const form = event.currentTarget;
    const next = new URLSearchParams();
    new FormData(form as HTMLFormElement).forEach((value, key) => next.set(key, String(value)));
    location.hash = `search?${next.toString()}`;
    renderSearch();
  });
}

function renderFormulaCard(formula: ColorFormula) {
  return `<article class="card"><div class="summary-head"><div><h3>${formula.name}</h3><p>${formula.targetEffect}</p></div><span class="pill">${formatLevelRange(formula.levelRange)}</span></div><div class="mini-grid"><p><b>色调：</b>${formula.tone}</p><p><b>目标明度：</b>${formula.targetLevel}度</p><p><b>推荐底色：</b>${formula.baseRequirement}</p><p><b>双氧：</b>${formula.developer}</p><p><b>调配比例：</b>${formula.mixRatio}</p><p><b>停放时间：</b>${formula.processingTime}</p></div><p class="note"><b>推荐配方：</b>${formula.formula.map((item) => `${item.product} ${item.shade}×${item.ratio}`).join(' + ')}</p></article>`;
}

function renderHistory() {
  const cases = getHistory();
  const selected = cases[0];
  shell(`
    <div class="history-layout">
      <section class="card"><div class="summary-head"><h2>历史方案</h2><button class="secondary" id="clear-history">清空</button></div>
        <div class="history-list">${cases.length ? cases.map((item) => `<article class="history-item"><b>${item.customerName || '未命名顾客'} · ${item.target.colorName}</b><span>${item.date} / ${item.stylist || '未填写发型师'}</span><small>难度：${item.recommendation.difficulty}　分区：${yesNo(item.recommendation.needSectioning)}</small></article>`).join('') : '<p class="muted">暂无本地历史方案，请先在新建方案中保存。</p>'}</div>
      </section>
      <section>${selected ? `<div class="card"><h2>${selected.customerName || '未命名顾客'}</h2><p class="muted">日期：${selected.date}　发型师：${selected.stylist || '未填写'}　目标：${selected.target.colorName} ${selected.target.targetLevel}度</p></div>${renderResultForHistory(selected)}` : '<div class="card empty">暂无可查看方案。</div>'}</section>
    </div>
  `);
  app.querySelector('#clear-history')?.addEventListener('click', () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });
}

function renderResultForHistory(item: CustomerCase) {
  const saved = buildRecommendation(formulas, item.hairStatus, item.target);
  return `<section class="risk ${saved.risks.length ? '' : 'safe'}"><h3>风险提示</h3><ul>${saved.risks.map((risk) => `<li>⚠️ ${risk}</li>`).join('')}</ul></section><section class="card"><h2>操作流程</h2><ol>${saved.steps.map((step) => `<li>${step}</li>`).join('')}</ol></section>`;
}

function renderSettings() {
  shell(`<section class="card"><h2>配方数据管理 / 设置</h2><p class="muted">当前版本不依赖外部 npm 包，避免 registry 403 时无法启动。配方数据仍来自本地 JSON，后续可替换为完整表格、数据库或 API。</p></section><section class="formula-grid">${formulas.map(renderFormulaCard).join('')}</section>`);
}

function render() {
  if (page === 'new') renderNewCase();
  else if (page === 'search') renderSearch();
  else if (page === 'history') renderHistory();
  else if (page === 'settings') renderSettings();
  else renderDashboard();
}

async function boot() {
  const response = await fetch('/data/colorFormulas.json');
  formulas = await response.json() as ColorFormula[];
  render();
}

void boot();
