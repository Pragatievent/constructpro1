/**
 * CONSTRUCT PRO — Centralized Quantity Surveying & Cost Calculation Engine
 * Pure, deterministic, modular functions separated from UI components.
 * Note: Performs quantity estimation from user-provided dimensions and schedules.
 * Does NOT perform structural reinforcement design or assume structural safety.
 */

export const round2 = (val: number): number => {
  if (!Number.isFinite(val) || Number.isNaN(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

export const safeNonNegative = (val: number): number => {
  if (!Number.isFinite(val) || Number.isNaN(val) || val < 0) return 0;
  return val;
};

// Unit Conversion Factors
export const UNIT_CONVERSIONS = {
  FT_TO_M: 0.3048,
  M_TO_FT: 3.28084,
  SQFT_TO_SQM: 0.092903,
  SQM_TO_SQFT: 10.7639,
  CUFT_TO_CUM: 0.0283168,
  CUM_TO_CUFT: 35.3147,
  IN_TO_FT: 1 / 12,
  MM_TO_M: 0.001,
  KG_TO_TONNE: 0.001,
  CEMENT_BAG_KG: 50,
  CEMENT_BAG_CUM: 0.0347, // 50 kg / 1440 kg/m³
};

export interface MixProportion {
  grade: string;
  cement: number;
  sand: number;
  aggregate: number;
}

export const DEFAULT_CONCRETE_MIXES: Record<string, MixProportion> = {
  M10: { grade: 'M10 (1:3:6)', cement: 1, sand: 3, aggregate: 6 },
  M15: { grade: 'M15 (1:2:4)', cement: 1, sand: 2, aggregate: 4 },
  M20: { grade: 'M20 (1:1.5:3)', cement: 1, sand: 1.5, aggregate: 3 },
  M25: { grade: 'M25 (1:1:2)', cement: 1, sand: 1, aggregate: 2 },
  M30: { grade: 'M30 (Design Mix 1:0.75:1.5)', cement: 1, sand: 0.75, aggregate: 1.5 },
};

// 1. Area Calculator Engine
export interface RoomInput {
  id: string;
  name: string;
  floorNumber: number;
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  wallThicknessFt: number;
  count: number;
}

export interface AreaCalculationInput {
  plotLengthFt: number;
  plotWidthFt: number;
  buildingLengthFt: number;
  buildingWidthFt: number;
  floors: number;
  slabProjectionFt: number;
  rooms: RoomInput[];
}

export interface AreaCalculationResult {
  plotAreaSqft: number;
  groundFloorAreaSqft: number;
  totalBuiltUpAreaSqft: number;
  carpetAreaSqft: number;
  wallSurfaceAreaSqft: number;
  slabAreaSqft: number;
  totalConstructionAreaSqft: number;
  carpetToBuiltUpRatioPct: number;
}

export function calculateAreaMetrics(input: AreaCalculationInput): AreaCalculationResult {
  const plotL = safeNonNegative(input.plotLengthFt);
  const plotW = safeNonNegative(input.plotWidthFt);
  const bldgL = safeNonNegative(input.buildingLengthFt);
  const bldgW = safeNonNegative(input.buildingWidthFt);
  const floors = Math.max(1, Math.floor(safeNonNegative(input.floors) || 1));
  const proj = safeNonNegative(input.slabProjectionFt);

  const plotAreaSqft = round2(plotL * plotW);
  const groundFloorAreaSqft = round2(bldgL * bldgW);
  const totalBuiltUpAreaSqft = round2(groundFloorAreaSqft * floors);

  let carpetAreaSqft = 0;
  let wallSurfaceAreaSqft = 0;

  for (const room of input.rooms) {
    const rL = safeNonNegative(room.lengthFt);
    const rW = safeNonNegative(room.widthFt);
    const rH = safeNonNegative(room.heightFt);
    const cnt = Math.max(1, Math.floor(safeNonNegative(room.count) || 1));

    const roomCarpet = rL * rW * cnt;
    const roomPerimeter = 2 * (rL + rW);
    const roomWallArea = roomPerimeter * rH * 2 * cnt; // Both internal faces estimate

    carpetAreaSqft += roomCarpet;
    wallSurfaceAreaSqft += roomWallArea;
  }

  const singleSlabArea = (bldgL + 2 * proj) * (bldgW + 2 * proj);
  const slabAreaSqft = round2(singleSlabArea * floors);
  const totalConstructionAreaSqft = round2(Math.max(totalBuiltUpAreaSqft, slabAreaSqft));
  const carpetToBuiltUpRatioPct =
    totalBuiltUpAreaSqft > 0 ? round2((carpetAreaSqft / totalBuiltUpAreaSqft) * 100) : 0;

  return {
    plotAreaSqft,
    groundFloorAreaSqft,
    totalBuiltUpAreaSqft,
    carpetAreaSqft: round2(carpetAreaSqft),
    wallSurfaceAreaSqft: round2(wallSurfaceAreaSqft),
    slabAreaSqft,
    totalConstructionAreaSqft,
    carpetToBuiltUpRatioPct,
  };
}

// 2. RCC Calculator Engine
export interface RccMemberInput {
  id: string;
  category: 'Footing' | 'Column' | 'Beam' | 'Slab' | 'Staircase' | 'Lintel';
  label: string;
  lengthM: number;
  widthM: number;
  depthM: number;
  quantity: number;
  grade: string;
  dryVolumeFactor: number;
  wastagePct: number;
}

export interface RccRatesInput {
  cementPerBagInr: number;
  sandPerCuftInr: number;
  aggregatePerCuftInr: number;
}

export interface RccCalculationResult {
  wetVolumeCum: number;
  dryVolumeCum: number;
  cementBags: number;
  sandCuft: number;
  aggregateCuft: number;
  cementCostInr: number;
  sandCostInr: number;
  aggregateCostInr: number;
  totalMaterialCostInr: number;
}

export function calculateRccMember(
  member: RccMemberInput,
  rates: RccRatesInput,
  customMixes: Record<string, MixProportion> = DEFAULT_CONCRETE_MIXES
): RccCalculationResult {
  const L = safeNonNegative(member.lengthM);
  const W = safeNonNegative(member.widthM);
  const D = safeNonNegative(member.depthM);
  const qty = safeNonNegative(member.quantity);
  const dryFactor = safeNonNegative(member.dryVolumeFactor) || 1.54;
  const wastageMultiplier = 1 + safeNonNegative(member.wastagePct) / 100;

  const wetVolumeCum = round2(L * W * D * qty);
  const dryVolumeCum = round2(wetVolumeCum * dryFactor * wastageMultiplier);

  const mix = customMixes[member.grade] || DEFAULT_CONCRETE_MIXES.M20;
  const sumParts = mix.cement + mix.sand + mix.aggregate;

  if (sumParts <= 0 || dryVolumeCum <= 0) {
    return {
      wetVolumeCum: 0,
      dryVolumeCum: 0,
      cementBags: 0,
      sandCuft: 0,
      aggregateCuft: 0,
      cementCostInr: 0,
      sandCostInr: 0,
      aggregateCostInr: 0,
      totalMaterialCostInr: 0,
    };
  }

  const cementVolCum = (dryVolumeCum * mix.cement) / sumParts;
  const cementBags = round2(cementVolCum / UNIT_CONVERSIONS.CEMENT_BAG_CUM);

  const sandVolCum = (dryVolumeCum * mix.sand) / sumParts;
  const sandCuft = round2(sandVolCum * UNIT_CONVERSIONS.CUM_TO_CUFT);

  const aggVolCum = (dryVolumeCum * mix.aggregate) / sumParts;
  const aggregateCuft = round2(aggVolCum * UNIT_CONVERSIONS.CUM_TO_CUFT);

  const cementCostInr = round2(cementBags * safeNonNegative(rates.cementPerBagInr));
  const sandCostInr = round2(sandCuft * safeNonNegative(rates.sandPerCuftInr));
  const aggregateCostInr = round2(aggregateCuft * safeNonNegative(rates.aggregatePerCuftInr));
  const totalMaterialCostInr = round2(cementCostInr + sandCostInr + aggregateCostInr);

  return {
    wetVolumeCum,
    dryVolumeCum,
    cementBags,
    sandCuft,
    aggregateCuft,
    cementCostInr,
    sandCostInr,
    aggregateCostInr,
    totalMaterialCostInr,
  };
}

// 3. Steel Reinforcement Calculator Engine (Weight = D^2 / 162 kg/m)
export interface SteelEntryInput {
  id: string;
  memberName: string;
  structuralElement: 'Footing' | 'Column' | 'Beam' | 'Slab' | 'Staircase' | 'Lintel';
  diameterMm: number;
  barLengthM: number;
  barsPerMember: number;
  spacingMm: number;
  memberCount: number;
  wastagePct: number;
}

export interface SteelCalculationResult {
  unitWeightKgPerM: number;
  totalBarLengthM: number;
  netSteelWeightKg: number;
  wastageWeightKg: number;
  grossSteelWeightKg: number;
  grossSteelTonnes: number;
  estimatedCostInr: number;
}

export function calculateSteelEntry(
  entry: SteelEntryInput,
  steelRatePerKgInr: number
): SteelCalculationResult {
  const D = safeNonNegative(entry.diameterMm);
  const L = safeNonNegative(entry.barLengthM);
  const bars = safeNonNegative(entry.barsPerMember);
  const members = safeNonNegative(entry.memberCount);
  const wastagePct = safeNonNegative(entry.wastagePct);

  // Theoretical formula: D^2 / 162 kg/m
  const unitWeightKgPerM = round2((D * D) / 162);
  const totalBarLengthM = round2(L * bars * members);
  const netSteelWeightKg = round2(totalBarLengthM * ((D * D) / 162));
  const wastageWeightKg = round2(netSteelWeightKg * (wastagePct / 100));
  const grossSteelWeightKg = round2(netSteelWeightKg + wastageWeightKg);
  const grossSteelTonnes = round2(grossSteelWeightKg / 1000);
  const estimatedCostInr = round2(grossSteelWeightKg * safeNonNegative(steelRatePerKgInr));

  return {
    unitWeightKgPerM,
    totalBarLengthM,
    netSteelWeightKg,
    wastageWeightKg,
    grossSteelWeightKg,
    grossSteelTonnes,
    estimatedCostInr,
  };
}

// 4. Masonry Calculator Engine
export interface MasonryOpening {
  label: string;
  widthM: number;
  heightM: number;
  count: number;
}

export interface MasonryWallInput {
  id: string;
  label: string;
  unitType: 'BRICK' | 'AAC_BLOCK' | 'CONCRETE_BLOCK';
  wallLengthM: number;
  wallHeightM: number;
  wallThicknessM: number;
  openings: MasonryOpening[];
  unitLengthMm: number;
  unitWidthMm: number;
  unitHeightMm: number;
  mortarJointMm: number;
  mixRatioCement: number;
  mixRatioSand: number;
  wastagePct: number;
}

export interface MasonryRatesInput {
  unitPriceInr: number;
  cementBagRateInr: number;
  sandCuftRateInr: number;
}

export interface MasonryCalculationResult {
  grossAreaSqm: number;
  deductedOpeningAreaSqm: number;
  netWallAreaSqm: number;
  netWallVolumeCum: number;
  unitQuantityNos: number;
  dryMortarVolumeCum: number;
  cementBags: number;
  sandCuft: number;
  unitsCostInr: number;
  mortarCostInr: number;
  totalMasonryCostInr: number;
}

export function calculateMasonryWall(
  wall: MasonryWallInput,
  rates: MasonryRatesInput
): MasonryCalculationResult {
  const L = safeNonNegative(wall.wallLengthM);
  const H = safeNonNegative(wall.wallHeightM);
  const T = safeNonNegative(wall.wallThicknessM);
  const grossAreaSqm = round2(L * H);

  let openingArea = 0;
  for (const op of wall.openings) {
    openingArea += safeNonNegative(op.widthM) * safeNonNegative(op.heightM) * safeNonNegative(op.count);
  }
  const deductedOpeningAreaSqm = round2(Math.min(grossAreaSqm, openingArea));
  const netWallAreaSqm = round2(Math.max(0, grossAreaSqm - deductedOpeningAreaSqm));
  const netWallVolumeCum = round2(netWallAreaSqm * T);

  const uL = safeNonNegative(wall.unitLengthMm) * 0.001;
  const uW = safeNonNegative(wall.unitWidthMm) * 0.001;
  const uH = safeNonNegative(wall.unitHeightMm) * 0.001;
  const j = safeNonNegative(wall.mortarJointMm) * 0.001;

  const nominalUnitVol = (uL + j) * (uW + j) * (uH + j);
  const actualUnitVol = uL * uW * uH;

  if (nominalUnitVol <= 0 || netWallVolumeCum <= 0) {
    return {
      grossAreaSqm,
      deductedOpeningAreaSqm,
      netWallAreaSqm,
      netWallVolumeCum: 0,
      unitQuantityNos: 0,
      dryMortarVolumeCum: 0,
      cementBags: 0,
      sandCuft: 0,
      unitsCostInr: 0,
      mortarCostInr: 0,
      totalMasonryCostInr: 0,
    };
  }

  const netUnits = netWallVolumeCum / nominalUnitVol;
  const wastageFactor = 1 + safeNonNegative(wall.wastagePct) / 100;
  const unitQuantityNos = Math.ceil(netUnits * wastageFactor);

  const wetMortarVol = Math.max(0, netWallVolumeCum - netUnits * actualUnitVol);
  const dryMortarVolumeCum = round2(wetMortarVol * 1.33); // 33% dry bulkage factor for mortar

  const mixSum = Math.max(1, safeNonNegative(wall.mixRatioCement) + safeNonNegative(wall.mixRatioSand));
  const cementVol = (dryMortarVolumeCum * safeNonNegative(wall.mixRatioCement)) / mixSum;
  const sandVol = (dryMortarVolumeCum * safeNonNegative(wall.mixRatioSand)) / mixSum;

  const cementBags = round2(cementVol / UNIT_CONVERSIONS.CEMENT_BAG_CUM);
  const sandCuft = round2(sandVol * UNIT_CONVERSIONS.CUM_TO_CUFT);

  const unitsCostInr = round2(unitQuantityNos * safeNonNegative(rates.unitPriceInr));
  const mortarCostInr = round2(
    cementBags * safeNonNegative(rates.cementBagRateInr) +
      sandCuft * safeNonNegative(rates.sandCuftRateInr)
  );
  const totalMasonryCostInr = round2(unitsCostInr + mortarCostInr);

  return {
    grossAreaSqm,
    deductedOpeningAreaSqm,
    netWallAreaSqm,
    netWallVolumeCum,
    unitQuantityNos,
    dryMortarVolumeCum,
    cementBags,
    sandCuft,
    unitsCostInr,
    mortarCostInr,
    totalMasonryCostInr,
  };
}

// 5. Flooring, Plaster & Painting Calculators
export interface FlooringItemInput {
  id: string;
  roomName: string;
  lengthFt: number;
  widthFt: number;
  tileLengthFt: number;
  tileWidthFt: number;
  wastagePct: number;
  tileRatePerSqftInr: number;
  adhesiveRatePerKgInr: number;
  groutRatePerKgInr: number;
}

export function calculateFlooringItem(item: FlooringItemInput) {
  const areaSqft = round2(safeNonNegative(item.lengthFt) * safeNonNegative(item.widthFt));
  const singleTileAreaSqft = Math.max(0.1, safeNonNegative(item.tileLengthFt) * safeNonNegative(item.tileWidthFt));
  const wastageMultiplier = 1 + safeNonNegative(item.wastagePct) / 100;
  const grossAreaSqft = round2(areaSqft * wastageMultiplier);
  const tileQuantityNos = Math.ceil(grossAreaSqft / singleTileAreaSqft);
  // Standard consumption: ~0.45 kg adhesive per sqft (4mm bed) & ~0.05 kg epoxy/cement grout per sqft
  const adhesiveKg = round2(areaSqft * 0.45);
  const groutKg = round2(areaSqft * 0.05);
  const totalCostInr = round2(
    grossAreaSqft * safeNonNegative(item.tileRatePerSqftInr) +
      adhesiveKg * safeNonNegative(item.adhesiveRatePerKgInr) +
      groutKg * safeNonNegative(item.groutRatePerKgInr)
  );
  return { areaSqft, grossAreaSqft, tileQuantityNos, adhesiveKg, groutKg, totalCostInr };
}

export interface PlasterItemInput {
  id: string;
  surfaceName: string;
  type: 'INTERNAL' | 'EXTERNAL';
  areaSqm: number;
  thicknessMm: number;
  mixRatioSand: number; // 1 : X
  cementBagRateInr: number;
  sandCuftRateInr: number;
}

export function calculatePlasterItem(item: PlasterItemInput) {
  const areaSqm = safeNonNegative(item.areaSqm);
  const thicknessM = safeNonNegative(item.thicknessMm) * 0.001;
  const wetMortarCum = areaSqm * thicknessM;
  // Dry volume factor for plaster = 1.33 * 1.20 (joint filling + unevenness) = ~1.60
  const dryMortarCum = round2(wetMortarCum * 1.6);
  const sumRatio = 1 + Math.max(1, safeNonNegative(item.mixRatioSand));
  const cementBags = round2(dryMortarCum / sumRatio / UNIT_CONVERSIONS.CEMENT_BAG_CUM);
  const sandCuft = round2(((dryMortarCum * safeNonNegative(item.mixRatioSand)) / sumRatio) * UNIT_CONVERSIONS.CUM_TO_CUFT);
  const totalCostInr = round2(
    cementBags * safeNonNegative(item.cementBagRateInr) + sandCuft * safeNonNegative(item.sandCuftRateInr)
  );
  return { areaSqm: round2(areaSqm), dryMortarCum, cementBags, sandCuft, totalCostInr };
}

export interface PaintingItemInput {
  id: string;
  surfaceName: string;
  areaSqft: number;
  primerCoats: number;
  paintCoats: number;
  primerCoverageSqftPerL: number; // default ~120
  paintCoverageSqftPerL: number; // default ~100 per coat
  primerRatePerLInr: number;
  paintRatePerLInr: number;
  labourRatePerSqftInr: number;
}

export function calculatePaintingItem(item: PaintingItemInput) {
  const areaSqft = safeNonNegative(item.areaSqft);
  const pCov = Math.max(10, safeNonNegative(item.primerCoverageSqftPerL) || 120);
  const cCov = Math.max(10, safeNonNegative(item.paintCoverageSqftPerL) || 100);
  const primerLitres = round2((areaSqft * safeNonNegative(item.primerCoats)) / pCov);
  const paintLitres = round2((areaSqft * safeNonNegative(item.paintCoats)) / cCov);
  const materialCostInr = round2(
    primerLitres * safeNonNegative(item.primerRatePerLInr) +
      paintLitres * safeNonNegative(item.paintRatePerLInr)
  );
  const labourCostInr = round2(areaSqft * safeNonNegative(item.labourRatePerSqftInr));
  const totalCostInr = round2(materialCostInr + labourCostInr);
  return { areaSqft: round2(areaSqft), primerLitres, paintLitres, materialCostInr, labourCostInr, totalCostInr };
}

// 6. Labour Costing Engine
export interface LabourRowInput {
  id: string;
  category: string;
  mode: 'DAILY' | 'UNIT_RATE';
  workers: number;
  dailyWageInr: number;
  workingDays: number;
  overtimeHours: number;
  overtimeRatePerHrInr: number;
  unitQuantity: number;
  unitRateInr: number;
}

export function calculateLabourSummary(rows: LabourRowInput[], builtUpAreaSqft: number) {
  let totalCostInr = 0;
  let totalManDays = 0;

  const breakdown = rows.map((r) => {
    let rowCost = 0;
    let manDays = 0;
    if (r.mode === 'DAILY') {
      const w = safeNonNegative(r.workers);
      const d = safeNonNegative(r.workingDays);
      const wage = safeNonNegative(r.dailyWageInr);
      const otHrs = safeNonNegative(r.overtimeHours);
      const otRate = safeNonNegative(r.overtimeRatePerHrInr);
      manDays = round2(w * d);
      rowCost = round2(manDays * wage + otHrs * otRate);
    } else {
      rowCost = round2(safeNonNegative(r.unitQuantity) * safeNonNegative(r.unitRateInr));
      manDays = round2( safeNonNegative(r.workers) * safeNonNegative(r.workingDays) );
    }
    totalCostInr += rowCost;
    totalManDays += manDays;
    return { ...r, manDays, rowCost };
  });

  const costPerSqftInr = builtUpAreaSqft > 0 ? round2(totalCostInr / builtUpAreaSqft) : 0;

  return {
    breakdown,
    totalCostInr: round2(totalCostInr),
    totalManDays: round2(totalManDays),
    costPerSqftInr,
  };
}

// 7. BOQ & Master Project Cost Summary Engine (Prevents Double Counting)
export interface BoqRowInput {
  id: string;
  itemNumber: string;
  description: string;
  category: string;
  unit: string;
  quantity: number;
  materialRateInr: number;
  labourRateInr: number;
  includesWastageInQty: boolean;
}

export interface ProjectOverheadConfig {
  transportationPct: number;
  miscExpensePct: number;
  globalWastagePct: number;
  contractorProfitPct: number;
  contingencyPct: number;
  gstPct: number;
}

export function calculateMasterBoq(
  rows: BoqRowInput[],
  overheads: ProjectOverheadConfig,
  builtUpAreaSqft: number
) {
  let totalMaterialCostInr = 0;
  let totalLabourCostInr = 0;
  let unadjustedMaterialBaseForWastage = 0;

  const categorySubtotals: Record<string, { material: number; labour: number; total: number }> = {};

  const computedRows = rows.map((r) => {
    const qty = safeNonNegative(r.quantity);
    const mRate = safeNonNegative(r.materialRateInr);
    const lRate = safeNonNegative(r.labourRateInr);

    const materialAmountInr = round2(qty * mRate);
    const labourAmountInr = round2(qty * lRate);
    const totalAmountInr = round2(materialAmountInr + labourAmountInr);

    totalMaterialCostInr += materialAmountInr;
    totalLabourCostInr += labourAmountInr;

    // Prevent double counting wastage if item quantity already includes module-level wastage
    if (!r.includesWastageInQty) {
      unadjustedMaterialBaseForWastage += materialAmountInr;
    }

    if (!categorySubtotals[r.category]) {
      categorySubtotals[r.category] = { material: 0, labour: 0, total: 0 };
    }
    categorySubtotals[r.category].material = round2(categorySubtotals[r.category].material + materialAmountInr);
    categorySubtotals[r.category].labour = round2(categorySubtotals[r.category].labour + labourAmountInr);
    categorySubtotals[r.category].total = round2(categorySubtotals[r.category].total + totalAmountInr);

    return {
      ...r,
      materialAmountInr,
      labourAmountInr,
      totalAmountInr,
    };
  });

  totalMaterialCostInr = round2(totalMaterialCostInr);
  totalLabourCostInr = round2(totalLabourCostInr);
  const directBaseCostInr = round2(totalMaterialCostInr + totalLabourCostInr);

  const transportationInr = round2(totalMaterialCostInr * (safeNonNegative(overheads.transportationPct) / 100));
  const miscExpenseInr = round2(directBaseCostInr * (safeNonNegative(overheads.miscExpensePct) / 100));
  const additionalWastageInr = round2(
    unadjustedMaterialBaseForWastage * (safeNonNegative(overheads.globalWastagePct) / 100)
  );

  const baseProjectCostInr = round2(
    directBaseCostInr + transportationInr + miscExpenseInr + additionalWastageInr
  );

  const contractorProfitInr = round2(baseProjectCostInr * (safeNonNegative(overheads.contractorProfitPct) / 100));
  const contingencyInr = round2(baseProjectCostInr * (safeNonNegative(overheads.contingencyPct) / 100));
  const preTaxTotalInr = round2(baseProjectCostInr + contractorProfitInr + contingencyInr);
  const gstAmountInr = round2(preTaxTotalInr * (safeNonNegative(overheads.gstPct) / 100));
  const finalEstimatedCostInr = round2(preTaxTotalInr + gstAmountInr);
  const costPerSqftInr = builtUpAreaSqft > 0 ? round2(finalEstimatedCostInr / builtUpAreaSqft) : 0;

  return {
    computedRows,
    categorySubtotals,
    totalMaterialCostInr,
    totalLabourCostInr,
    directBaseCostInr,
    transportationInr,
    miscExpenseInr,
    additionalWastageInr,
    baseProjectCostInr,
    contractorProfitInr,
    contingencyInr,
    preTaxTotalInr,
    gstAmountInr,
    finalEstimatedCostInr,
    costPerSqftInr,
  };
}
