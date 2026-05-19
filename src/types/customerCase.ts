import type { SectionFormulaAdvice } from './formula';

export type DamageLevel = '健康' | '轻度受损' | '中度受损' | '严重受损';
export type GrayPercentage = '0%' | '1-30%' | '31-50%' | '51-80%' | '80%以上';
export type Difficulty = '低' | '中' | '高';

export interface NewGrowthStatus {
  length: string;
  level: number;
  pigmentStatus: string;
  hasGrayHair: boolean;
  grayPercentage: GrayPercentage;
  texture: string;
  damage: DamageLevel;
}

export interface LengthStatus {
  level: number;
  baseTone: string;
  artificialPigmentResidue: boolean;
  warmResidue: boolean;
  damage: DamageLevel;
}

export interface HairStatus {
  newGrowth: NewGrowthStatus;
  midLength: LengthStatus;
  ends: LengthStatus;
}

export interface TargetColor {
  colorName: string;
  targetLevel: number;
  tone: string;
  needBleach: boolean;
  needEvenBase: boolean;
  needGrayCoverage: boolean;
  allowFade: boolean;
  acceptMultipleSteps: boolean;
}

export interface FormulaRecommendation {
  difficulty: Difficulty;
  needSectioning: boolean;
  needBleach: boolean;
  directColoringSuitable: boolean;
  highRisk: boolean;
  summary: string;
  sectionAdvices: SectionFormulaAdvice[];
  steps: string[];
  risks: string[];
}

export interface CustomerCase {
  id: string;
  customerName: string;
  date: string;
  stylist: string;
  hairStatus: HairStatus;
  target: TargetColor;
  recommendation: FormulaRecommendation;
  createdAt: string;
}
