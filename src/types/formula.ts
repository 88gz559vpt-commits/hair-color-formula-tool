export interface LevelRange {
  min: number;
  max: number | null;
}

export interface FormulaIngredient {
  product: string;
  shade: string;
  ratio: number;
}

export interface ColorFormula {
  id: string;
  name: string;
  tone: string;
  levelRange: LevelRange;
  targetLevel: number;
  targetEffect: string;
  baseRequirement: string;
  formula: FormulaIngredient[];
  developer: string;
  mixRatio: string;
  processingTime: string;
  needBleach: boolean;
  suitableForGrayCoverage: boolean;
  notes: string[];
  risks: string[];
}

export interface SectionFormulaAdvice {
  zone: '新生发' | '发中' | '发尾';
  formulaName: string;
  formulaItems: FormulaIngredient[];
  developer: string;
  mixRatio: string;
  processingTime: string;
  needToning: boolean;
  needFilling: boolean;
  needBleachBath: boolean;
  needPreLighten: boolean;
  advice: string;
}
