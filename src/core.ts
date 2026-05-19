import type { ColorFormula, SectionFormulaAdvice } from './types/formula';
import type { DamageLevel, Difficulty, GrayPercentage, HairStatus, TargetColor } from './types/customerCase';

export function matchLevelRange(targetLevel: number, min: number, max: number | null): boolean {
  return targetLevel >= min && (max === null || targetLevel <= max);
}

export function formatLevelRange(range: { min: number; max: number | null }): string {
  return range.max === null ? `${range.min}度以上` : `${range.min}-${range.max}度`;
}

export function normalizeLegacyRange(min: number, max: number | null) {
  if (min === 6 && max === 8) return { min: 6, max: 7 };
  if (min === 8 && max === 10) return { min: 8, max: 9 };
  if (min === 10 && max === 12) return { min: 10, max: 12 };
  if (min === 12 && max === 15) return { min: 13, max: 15 };
  if (min >= 16 || max === null) return { min: 16, max: null };
  return { min, max };
}

export function grayHairScore(value: GrayPercentage): number {
  const scores: Record<GrayPercentage, number> = {
    '0%': 0,
    '1-30%': 1,
    '31-50%': 2,
    '51-80%': 3,
    '80%以上': 4,
  };
  return scores[value];
}

export function damageScore(damage: DamageLevel): number {
  const scores: Record<DamageLevel, number> = {
    健康: 0,
    轻度受损: 1,
    中度受损: 2,
    严重受损: 3,
  };
  return scores[damage];
}

export function findBestFormula(formulas: ColorFormula[], target: TargetColor): ColorFormula | undefined {
  const exact = formulas.find(
    (formula) =>
      formula.name === target.colorName &&
      matchLevelRange(target.targetLevel, formula.levelRange.min, formula.levelRange.max) &&
      formula.needBleach === target.needBleach,
  );

  if (exact) return exact;

  return formulas.find(
    (formula) =>
      (formula.name.includes(target.colorName) || target.colorName.includes(formula.name)) &&
      matchLevelRange(target.targetLevel, formula.levelRange.min, formula.levelRange.max),
  ) ?? formulas.find((formula) => matchLevelRange(target.targetLevel, formula.levelRange.min, formula.levelRange.max));
}

export function shouldSectionHair(hairStatus: HairStatus): boolean {
  const levels = [hairStatus.newGrowth.level, hairStatus.midLength.level, hairStatus.ends.level];
  return (
    Math.max(...levels) - Math.min(...levels) >= 2 ||
    damageScore(hairStatus.ends.damage) >= 3 ||
    hairStatus.midLength.artificialPigmentResidue ||
    hairStatus.ends.artificialPigmentResidue ||
    grayHairScore(hairStatus.newGrowth.grayPercentage) >= 2
  );
}

export function generateGrayHairAdvice(value: GrayPercentage, targetLevel: number, tone: string): string[] {
  if (value === '0%') return [];
  const advice = ['有白发时需保留基色参与配方，避免只用目标色导致遮盖不足。'];
  if (grayHairScore(value) >= 2) advice.push('白发比例较高，建议提高基色比例，并根据目标色调整双氧与停放时间。');
  if (targetLevel >= 9) advice.push('目标色偏浅时遮白能力下降，需要提前与顾客确认遮盖预期。');
  if (['冷色', '雾感'].includes(tone)) advice.push('冷色、雾感或透明感目标色不一定适合高比例白发，需优先保证遮白稳定性。');
  return advice;
}

export function generateRisks(hairStatus: HairStatus, target: TargetColor, needSectioning: boolean): string[] {
  const risks: string[] = [];

  if (hairStatus.ends.damage === '严重受损') {
    risks.push('发尾严重受损，不建议高浓度双氧或长时间停放。');
    risks.push('发尾容易吸色偏暗，建议降低色素浓度、缩短时间并加入护理或酸性处理。');
  }
  if (hairStatus.midLength.warmResidue && target.tone === '冷色') risks.push('发中有暖色残留，目标冷色可能偏浊。');
  if (hairStatus.ends.warmResidue && target.tone === '冷色') risks.push('发尾有暖色残留，冷色目标可能不干净，建议先清理残留。');
  if (hairStatus.ends.level > target.targetLevel) risks.push('发尾明度高于目标明度，容易吸色偏暗，需要控制色素浓度或先回填。');
  if (hairStatus.midLength.level < target.targetLevel || hairStatus.ends.level < target.targetLevel) risks.push('发中或发尾低于目标明度，可能需要先褪色或沐浴漂，不能直接假设一步到位。');
  if (target.targetLevel - hairStatus.newGrowth.level >= 3) risks.push('目标明度比新生发高较多，可能需要更高提升力或预先提浅，但需结合发质谨慎判断双氧。');
  if (hairStatus.midLength.artificialPigmentResidue || hairStatus.ends.artificialPigmentResidue) risks.push('发中或发尾存在人工色素残留，建议先做残留评估，避免目标色发浊或不均。');
  if (needSectioning) risks.push('建议分区操作，不建议一碗配方全头涂抹。');
  if (hairStatus.newGrowth.hasGrayHair || target.needGrayCoverage) risks.push(...generateGrayHairAdvice(hairStatus.newGrowth.grayPercentage, target.targetLevel, target.tone));
  if (grayHairScore(hairStatus.newGrowth.grayPercentage) >= 2 && !target.needGrayCoverage) risks.push('当前白发比例较高，但目标未勾选遮白，请确认顾客是否接受白发透出。');

  return Array.from(new Set(risks));
}

function buildZoneAdvice(zone: SectionFormulaAdvice['zone'], currentLevel: number, damage: DamageLevel, hasResidue: boolean, target: TargetColor, formula?: ColorFormula): SectionFormulaAdvice {
  const levelDelta = target.targetLevel - currentLevel;
  const severeEnds = zone === '发尾' && damage === '严重受损';
  return {
    zone,
    formulaName: formula?.name ?? '示例占位配方',
    formulaItems: formula?.formula ?? [{ product: '待补充染膏', shade: `${target.targetLevel}/${target.tone}`, ratio: 1 }],
    developer: severeEnds ? '低浓度双氧（1.5%-3%）' : formula?.developer ?? (levelDelta >= 2 ? '6%-9%（需发质评估）' : '3%-6%'),
    mixRatio: formula?.mixRatio ?? '1:1',
    processingTime: severeEnds ? '10-20分钟，需密切观察' : formula?.processingTime ?? '25-35分钟',
    needToning: Math.abs(levelDelta) >= 1 || hasResidue,
    needFilling: currentLevel > target.targetLevel,
    needBleachBath: hasResidue && currentLevel < target.targetLevel,
    needPreLighten: levelDelta >= 2 || (target.needBleach && currentLevel < target.targetLevel),
    advice: zone === '发尾' && damage !== '健康'
      ? '发尾按受损程度降低刺激，优先缩短停放时间并观察吸色情况。'
      : levelDelta > 0
        ? '当前明度低于目标，先评估提升力与残留，再决定是否预先提浅。'
        : levelDelta < 0
          ? '当前明度高于目标，建议回填色素并降低吸色偏暗风险。'
          : '当前明度接近目标，可按目标色方向微调色调。',
  };
}

function buildOperationSteps(hairStatus: HairStatus, target: TargetColor, needSectioning: boolean): string[] {
  const steps: string[] = [];
  if (hairStatus.ends.artificialPigmentResidue || hairStatus.ends.warmResidue) steps.push('先处理发尾残留色素，必要时做温和沐浴漂或色素清理。');
  if (hairStatus.midLength.artificialPigmentResidue || hairStatus.midLength.level !== target.targetLevel) steps.push('再评估并统一发中底色，避免发中与发尾目标色不一致。');
  if (needSectioning) steps.push('按新生发、发中、发尾分区调配与涂抹，不使用一碗配方全头处理。');
  steps.push(hairStatus.newGrowth.hasGrayHair || target.needGrayCoverage ? '新生发区域优先执行遮白逻辑，保留足够基色比例。' : '新生发最后上色，避免根部温度导致过亮。');
  if (damageScore(hairStatus.ends.damage) >= 2) steps.push('发尾根据受损程度缩短停放时间，过程中加强目测。');
  steps.push('冲水后做锁色护理，并记录本次配方与顾客反馈。');
  return steps;
}

function getDifficulty(riskCount: number, needSectioning: boolean, target: TargetColor, hairStatus: HairStatus): Difficulty {
  if (target.needBleach || riskCount >= 6 || damageScore(hairStatus.ends.damage) >= 3) return '高';
  if (needSectioning || riskCount >= 3 || target.needEvenBase) return '中';
  return '低';
}

export function buildRecommendation(formulas: ColorFormula[], hairStatus: HairStatus, target: TargetColor) {
  const formula = findBestFormula(formulas, target);
  const needSectioning = shouldSectionHair(hairStatus);
  const sectionAdvices: SectionFormulaAdvice[] = [
    buildZoneAdvice('新生发', hairStatus.newGrowth.level, hairStatus.newGrowth.damage, false, target, formula),
    buildZoneAdvice('发中', hairStatus.midLength.level, hairStatus.midLength.damage, hairStatus.midLength.artificialPigmentResidue, target, formula),
    buildZoneAdvice('发尾', hairStatus.ends.level, hairStatus.ends.damage, hairStatus.ends.artificialPigmentResidue, target, formula),
  ];
  const risks = generateRisks(hairStatus, target, needSectioning);
  const needBleach = target.needBleach || sectionAdvices.some((advice) => advice.needPreLighten || advice.needBleachBath);
  const difficulty = getDifficulty(risks.length, needSectioning, target, hairStatus);
  const directColoringSuitable = !needBleach && !needSectioning && risks.length <= 2;
  const highRisk = difficulty === '高' || risks.length >= 6;

  return {
    difficulty,
    needSectioning,
    needBleach,
    directColoringSuitable,
    highRisk,
    summary: `${directColoringSuitable ? '可考虑直接上色' : '不建议直接全头上色'}；${needBleach ? '可能需要漂发/提浅' : '暂不强制漂发'}；${needSectioning ? '需要分区操作' : '分区要求较低'}；翻车风险${highRisk ? '较高' : difficulty === '中' ? '中等' : '较低'}。`,
    sectionAdvices,
    steps: buildOperationSteps(hairStatus, target, needSectioning),
    risks,
  };
}
