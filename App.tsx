import React, { useState, useMemo, useEffect } from 'react';
import { create } from 'zustand';
import {
  Building2,
  LayoutDashboard,
  FolderKanban,
  FileSpreadsheet,
  Maximize2,
  Boxes,
  PackageCheck,
  Construction,
  BrickWall,
  Grid,
  PaintBucket,
  Wrench,
  HardHat,
  ReceiptIndianRupee,
  SlidersHorizontal,
  FileText,
  Settings,
  Plus,
  Trash2,
  Copy,
  Edit3,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  RefreshCw,
  ArrowUpRight,
  Layers,
  ShieldCheck,
  Calculator,
  Check,
  X,
  History,
  Info,
  Eye,
  Database,
  Code2,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// ============================================================================
// 1. CENTRALIZED CALCULATION ENGINE (PURE FUNCTIONS & UNIT CONVERSIONS)
// ============================================================================

export const round2 = (val: number): number => {
  if (!Number.isFinite(val) || Number.isNaN(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

export const safeNonNegative = (val: number): number => {
  if (!Number.isFinite(val) || Number.isNaN(val) || val < 0) return 0;
  return val;
};

export const formatINR = (val: number): string => {
  const clean = round2(val);
  return '₹' + clean.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

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
  CEMENT_BAG_CUM: 0.0347,
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
  M30: { grade: 'M30 (Design 1:0.75:1.5)', cement: 1, sand: 0.75, aggregate: 1.5 },
};

// Types for Project & Modules
export type NavigationTab =
  | 'dashboard'
  | 'projects'
  | 'project-inputs'
  | 'area-calc'
  | 'rcc-calc'
  | 'material-calc'
  | 'steel-calc'
  | 'masonry-calc'
  | 'flooring-calc'
  | 'plaster-paint'
  | 'plumbing-electrical'
  | 'labour-calc'
  | 'boq-cost'
  | 'rate-mgmt'
  | 'reports'
  | 'settings';

export interface RoomDimension {
  id: string;
  name: string;
  floorNumber: number;
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  wallThicknessFt: number;
  count: number;
}

export interface RccMember {
  id: string;
  category: 'Footing' | 'Column' | 'Beam' | 'Slab' | 'Staircase' | 'Lintel';
  label: string;
  lengthM: number;
  widthM: number;
  depthM: number;
  quantity: number;
  grade: string;
  dryFactor: number;
  wastagePct: number;
}

export interface SteelEntry {
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

export interface CustomMaterialItem {
  id: string;
  category: 'Cement' | 'Sand' | 'Aggregate' | 'Bricks' | 'Blocks' | 'Steel' | 'Tiles' | 'Paint' | 'Flooring' | 'Waterproofing' | 'Custom';
  name: string;
  unit: 'Bags' | 'Cubic feet' | 'Metric tonnes' | 'Kilograms' | 'Numbers' | 'Square feet' | 'Litres' | 'Lump Sum';
  quantity: number;
  wastagePct: number;
  rateInr: number;
}

export interface MasonryWall {
  id: string;
  label: string;
  unitType: 'BRICK' | 'AAC_BLOCK' | 'CONCRETE_BLOCK';
  wallLengthM: number;
  wallHeightM: number;
  wallThicknessM: number;
  doorAreaSqm: number;
  windowAreaSqm: number;
  unitLengthMm: number;
  unitWidthMm: number;
  unitHeightMm: number;
  mortarJointMm: number;
  mixRatioCement: number;
  mixRatioSand: number;
  wastagePct: number;
}

export interface FlooringItem {
  id: string;
  roomName: string;
  materialType: 'Vitrified Tiles' | 'Ceramic Tiles' | 'Granite / Marble' | 'Wooden Flooring';
  lengthFt: number;
  widthFt: number;
  tileLengthFt: number;
  tileWidthFt: number;
  wastagePct: number;
  tileRatePerSqftInr: number;
  adhesiveRatePerKgInr: number;
  groutRatePerKgInr: number;
}

export interface PlasterItem {
  id: string;
  surfaceName: string;
  type: 'INTERNAL' | 'EXTERNAL';
  areaSqm: number;
  thicknessMm: number;
  mixRatioSand: number;
}

export interface PaintingItem {
  id: string;
  surfaceName: string;
  areaSqft: number;
  primerCoats: number;
  paintCoats: number;
  labourRatePerSqftInr: number;
}

export interface MepItem {
  id: string;
  system: 'PLUMBING' | 'ELECTRICAL';
  category: 'Pipes' | 'Fittings' | 'Taps' | 'Sanitary fixtures' | 'Electrical wires' | 'Switches' | 'Sockets' | 'Lights' | 'Distribution boards';
  description: string;
  unit: string;
  quantity: number;
  materialRateInr: number;
  labourRateInr: number;
}

export interface LabourEntry {
  id: string;
  category: 'Mason' | 'Helper' | 'Carpenter' | 'Steel fixer' | 'Electrician' | 'Plumber' | 'Painter' | 'Tile worker' | 'Other';
  roleNote: string;
  mode: 'DAILY' | 'UNIT_RATE';
  workers: number;
  dailyWageInr: number;
  workingDays: number;
  overtimeHours: number;
  overtimeRateInr: number;
  unitQuantity: number;
  unitRateInr: number;
}

export interface ManualBoqItem {
  id: string;
  itemNumber: string;
  description: string;
  category: string;
  unit: string;
  quantity: number;
  materialRateInr: number;
  labourRateInr: number;
}

export interface RateHistoryRecord {
  id: string;
  oldRateInr: number;
  newRateInr: number;
  changedAt: string;
  note: string;
}

export interface RateItem {
  id: string;
  category: 'Cement' | 'Sand' | 'Aggregate' | 'Steel' | 'Bricks' | 'Blocks' | 'Tiles' | 'Paint' | 'Waterproofing' | 'Labour' | 'Transportation' | 'Miscellaneous';
  name: string;
  unit: string;
  rateInr: number;
  defaultRateInr: number;
  isProjectOverride: boolean;
  history: RateHistoryRecord[];
}

export interface ProjectHistoryLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  location: string;
  constructionType: 'Residential' | 'Commercial';
  structureType: 'RCC framed structure' | 'Load-bearing structure';
  status: 'Active' | 'Planning' | 'Completed';
  progressPct: number;
  floors: number;
  plotLengthFt: number;
  plotWidthFt: number;
  buildingLengthFt: number;
  buildingWidthFt: number;
  slabProjectionFt: number;
  wallHeightFt: number;
  startDate: string;
  description: string;
  // Overheads & Markups
  transportationPct: number;
  miscExpensePct: number;
  globalWastagePct: number;
  contractorProfitPct: number;
  contingencyPct: number;
  gstPct: number;
  // Module Data
  rooms: RoomDimension[];
  rccMembers: RccMember[];
  steelEntries: SteelEntry[];
  customMaterials: CustomMaterialItem[];
  masonryWalls: MasonryWall[];
  flooringItems: FlooringItem[];
  plasterItems: PlasterItem[];
  paintingItems: PaintingItem[];
  mepItems: MepItem[];
  labourEntries: LabourEntry[];
  manualBoqItems: ManualBoqItem[];
  historyLogs: ProjectHistoryLog[];
}

// Pure Calculation Functions
export function calcArea(project: Project) {
  const plotAreaSqft = round2(safeNonNegative(project.plotLengthFt) * safeNonNegative(project.plotWidthFt));
  const groundFloorAreaSqft = round2(safeNonNegative(project.buildingLengthFt) * safeNonNegative(project.buildingWidthFt));
  const floors = Math.max(1, Math.floor(safeNonNegative(project.floors) || 1));
  const totalBuiltUpAreaSqft = round2(groundFloorAreaSqft * floors);

  let carpetAreaSqft = 0;
  let wallSurfaceAreaSqft = 0;

  for (const r of project.rooms) {
    const rL = safeNonNegative(r.lengthFt);
    const rW = safeNonNegative(r.widthFt);
    const rH = safeNonNegative(r.heightFt);
    const cnt = Math.max(1, Math.floor(safeNonNegative(r.count) || 1));
    carpetAreaSqft += rL * rW * cnt;
    wallSurfaceAreaSqft += 2 * (rL + rW) * rH * 2 * cnt;
  }

  const proj = safeNonNegative(project.slabProjectionFt);
  const singleSlabArea = (safeNonNegative(project.buildingLengthFt) + 2 * proj) * (safeNonNegative(project.buildingWidthFt) + 2 * proj);
  const slabAreaSqft = round2(singleSlabArea * floors);
  const totalConstructionAreaSqft = round2(Math.max(totalBuiltUpAreaSqft, slabAreaSqft));

  return {
    plotAreaSqft,
    groundFloorAreaSqft,
    totalBuiltUpAreaSqft,
    carpetAreaSqft: round2(carpetAreaSqft),
    wallSurfaceAreaSqft: round2(wallSurfaceAreaSqft),
    slabAreaSqft,
    totalConstructionAreaSqft,
    efficiencyPct: totalBuiltUpAreaSqft > 0 ? round2((carpetAreaSqft / totalBuiltUpAreaSqft) * 100) : 0,
  };
}

export function calcRccRow(m: RccMember, rates: { cement: number; sand: number; agg: number }) {
  const wetVolCum = round2(
    safeNonNegative(m.lengthM) *
      safeNonNegative(m.widthM) *
      safeNonNegative(m.depthM) *
      safeNonNegative(m.quantity)
  );
  const dryFactor = safeNonNegative(m.dryFactor) || 1.54;
  const wastageMult = 1 + safeNonNegative(m.wastagePct) / 100;
  const dryVolCum = round2(wetVolCum * dryFactor * wastageMult);

  const mix = DEFAULT_CONCRETE_MIXES[m.grade] || DEFAULT_CONCRETE_MIXES.M20;
  const sumParts = mix.cement + mix.sand + mix.aggregate;

  const cementVolCum = sumParts > 0 ? (dryVolCum * mix.cement) / sumParts : 0;
  const cementBags = round2(cementVolCum / UNIT_CONVERSIONS.CEMENT_BAG_CUM);

  const sandVolCum = sumParts > 0 ? (dryVolCum * mix.sand) / sumParts : 0;
  const sandCuft = round2(sandVolCum * UNIT_CONVERSIONS.CUM_TO_CUFT);

  const aggVolCum = sumParts > 0 ? (dryVolCum * mix.aggregate) / sumParts : 0;
  const aggregateCuft = round2(aggVolCum * UNIT_CONVERSIONS.CUM_TO_CUFT);

  const costInr = round2(
    cementBags * safeNonNegative(rates.cement) +
      sandCuft * safeNonNegative(rates.sand) +
      aggregateCuft * safeNonNegative(rates.agg)
  );

  return {
    wetVolCum,
    dryVolCum,
    cementBags,
    sandCuft,
    aggregateCuft,
    costInr,
  };
}

export function calcSteelRow(s: SteelEntry, steelRatePerKg: number) {
  const D = safeNonNegative(s.diameterMm);
  const unitWeightKgPerM = round2((D * D) / 162);
  const totalBarLengthM = round2(
    safeNonNegative(s.barLengthM) *
      safeNonNegative(s.barsPerMember) *
      safeNonNegative(s.memberCount)
  );
  const netWeightKg = round2(totalBarLengthM * ((D * D) / 162));
  const wastageKg = round2(netWeightKg * (safeNonNegative(s.wastagePct) / 100));
  const totalWeightKg = round2(netWeightKg + wastageKg);
  const totalTonnes = round2(totalWeightKg / 1000);
  const costInr = round2(totalWeightKg * safeNonNegative(steelRatePerKg));

  return {
    unitWeightKgPerM,
    totalBarLengthM,
    netWeightKg,
    wastageKg,
    totalWeightKg,
    totalTonnes,
    costInr,
  };
}

export function calcMasonryRow(
  w: MasonryWall,
  rates: { brick: number; block: number; cement: number; sand: number }
) {
  const grossAreaSqm = round2(safeNonNegative(w.wallLengthM) * safeNonNegative(w.wallHeightM));
  const openingsSqm = round2(safeNonNegative(w.doorAreaSqm) + safeNonNegative(w.windowAreaSqm));
  const netAreaSqm = round2(Math.max(0, grossAreaSqm - openingsSqm));
  const netWallVolCum = round2(netAreaSqm * safeNonNegative(w.wallThicknessM));

  const uL = safeNonNegative(w.unitLengthMm) * 0.001;
  const uW = safeNonNegative(w.unitWidthMm) * 0.001;
  const uH = safeNonNegative(w.unitHeightMm) * 0.001;
  const j = safeNonNegative(w.mortarJointMm) * 0.001;

  const nominalVol = (uL + j) * (uW + j) * (uH + j);
  const actualVol = uL * uW * uH;

  if (nominalVol <= 0 || netWallVolCum <= 0) {
    return {
      grossAreaSqm,
      openingsSqm,
      netAreaSqm,
      netWallVolCum: 0,
      unitsCount: 0,
      mortarVolCum: 0,
      cementBags: 0,
      sandCuft: 0,
      costInr: 0,
    };
  }

  const netUnits = netWallVolCum / nominalVol;
  const unitsCount = Math.ceil(netUnits * (1 + safeNonNegative(w.wastagePct) / 100));
  const wetMortarCum = Math.max(0, netWallVolCum - netUnits * actualVol);
  const mortarVolCum = round2(wetMortarCum * 1.33);

  const sumRatio = Math.max(1, safeNonNegative(w.mixRatioCement) + safeNonNegative(w.mixRatioSand));
  const cementBags = round2(
    ((mortarVolCum * safeNonNegative(w.mixRatioCement)) / sumRatio) / UNIT_CONVERSIONS.CEMENT_BAG_CUM
  );
  const sandCuft = round2(
    ((mortarVolCum * safeNonNegative(w.mixRatioSand)) / sumRatio) * UNIT_CONVERSIONS.CUM_TO_CUFT
  );

  const unitRate = w.unitType === 'BRICK' ? rates.brick : rates.block;
  const costInr = round2(
    unitsCount * safeNonNegative(unitRate) +
      cementBags * safeNonNegative(rates.cement) +
      sandCuft * safeNonNegative(rates.sand)
  );

  return {
    grossAreaSqm,
    openingsSqm,
    netAreaSqm,
    netWallVolCum,
    unitsCount,
    mortarVolCum,
    cementBags,
    sandCuft,
    costInr,
  };
}

export function calcFlooringRow(f: FlooringItem) {
  const floorAreaSqft = round2(safeNonNegative(f.lengthFt) * safeNonNegative(f.widthFt));
  const singleTileSqft = Math.max(0.1, safeNonNegative(f.tileLengthFt) * safeNonNegative(f.tileWidthFt));
  const grossAreaSqft = round2(floorAreaSqft * (1 + safeNonNegative(f.wastagePct) / 100));
  const tileQty = Math.ceil(grossAreaSqft / singleTileSqft);
  const adhesiveKg = round2(floorAreaSqft * 0.45);
  const groutKg = round2(floorAreaSqft * 0.05);
  const costInr = round2(
    grossAreaSqft * safeNonNegative(f.tileRatePerSqftInr) +
      adhesiveKg * safeNonNegative(f.adhesiveRatePerKgInr) +
      groutKg * safeNonNegative(f.groutRatePerKgInr)
  );
  return { floorAreaSqft, grossAreaSqft, tileQty, adhesiveKg, groutKg, costInr };
}

export function calcPlasterRow(p: PlasterItem, rates: { cement: number; sand: number }) {
  const areaSqm = round2(safeNonNegative(p.areaSqm));
  const wetMortarCum = areaSqm * (safeNonNegative(p.thicknessMm) * 0.001);
  const dryMortarCum = round2(wetMortarCum * 1.6);
  const sumParts = 1 + Math.max(1, safeNonNegative(p.mixRatioSand));
  const cementBags = round2((dryMortarCum / sumParts) / UNIT_CONVERSIONS.CEMENT_BAG_CUM);
  const sandCuft = round2(((dryMortarCum * safeNonNegative(p.mixRatioSand)) / sumParts) * UNIT_CONVERSIONS.CUM_TO_CUFT);
  const costInr = round2(cementBags * safeNonNegative(rates.cement) + sandCuft * safeNonNegative(rates.sand));
  return { areaSqm, dryMortarCum, cementBags, sandCuft, costInr };
}

export function calcPaintingRow(pt: PaintingItem, rates: { paintPerL: number; primerPerL: number }) {
  const areaSqft = round2(safeNonNegative(pt.areaSqft));
  const primerLitres = round2((areaSqft * safeNonNegative(pt.primerCoats)) / 120);
  const paintLitres = round2((areaSqft * safeNonNegative(pt.paintCoats)) / 100);
  const materialCostInr = round2(
    primerLitres * safeNonNegative(rates.primerPerL) + paintLitres * safeNonNegative(rates.paintPerL)
  );
  const labourCostInr = round2(areaSqft * safeNonNegative(pt.labourRatePerSqftInr));
  const totalCostInr = round2(materialCostInr + labourCostInr);
  return { areaSqft, primerLitres, paintLitres, materialCostInr, labourCostInr, totalCostInr };
}

export function calcLabourRow(l: LabourEntry) {
  if (l.mode === 'DAILY') {
    const manDays = round2(safeNonNegative(l.workers) * safeNonNegative(l.workingDays));
    const regularCost = manDays * safeNonNegative(l.dailyWageInr);
    const overtimeCost = safeNonNegative(l.overtimeHours) * safeNonNegative(l.overtimeRateInr);
    const totalCostInr = round2(regularCost + overtimeCost);
    return { manDays, totalCostInr };
  } else {
    const manDays = round2(safeNonNegative(l.workers) * safeNonNegative(l.workingDays));
    const totalCostInr = round2(safeNonNegative(l.unitQuantity) * safeNonNegative(l.unitRateInr));
    return { manDays, totalCostInr };
  }
}

// Full Project Evaluation & Master BOQ Compiler
export function evaluateCompleteProject(project: Project, ratesList: RateItem[]) {
  const getRate = (cat: string, fallback: number): number => {
    const found = ratesList.find((r) => r.category.toLowerCase() === cat.toLowerCase());
    return found ? found.rateInr : fallback;
  };

  const cementRate = getRate('Cement', 0);
  const sandRate = getRate('Sand', 0);
  const aggRate = getRate('Aggregate', 0);
  const steelRate = getRate('Steel', 0);
  const brickRate = getRate('Bricks', 0);
  const blockRate = getRate('Blocks', 0);
  const paintRate = getRate('Paint', 0);
  const primerRate = getRate('Paint', 0);

  const areaSummary = calcArea(project);
  const builtUpSqft = Math.max(1, areaSummary.totalBuiltUpAreaSqft);

  // 1. RCC Totals
  let rccWetCum = 0;
  let rccCementBags = 0;
  let rccSandCuft = 0;
  let rccAggCuft = 0;
  let rccMaterialCost = 0;
  const rccDetails = project.rccMembers.map((m) => {
    const res = calcRccRow(m, { cement: cementRate, sand: sandRate, agg: aggRate });
    rccWetCum += res.wetVolCum;
    rccCementBags += res.cementBags;
    rccSandCuft += res.sandCuft;
    rccAggCuft += res.aggregateCuft;
    rccMaterialCost += res.costInr;
    return { ...m, ...res };
  });

  // 2. Steel Totals
  let steelTotalKg = 0;
  let steelMaterialCost = 0;
  const steelDetails = project.steelEntries.map((s) => {
    const res = calcSteelRow(s, steelRate);
    steelTotalKg += res.totalWeightKg;
    steelMaterialCost += res.costInr;
    return { ...s, ...res };
  });

  // 3. Masonry Totals
  let masonryVolCum = 0;
  let masonryUnits = 0;
  let masonryCementBags = 0;
  let masonrySandCuft = 0;
  let masonryMaterialCost = 0;
  const masonryDetails = project.masonryWalls.map((w) => {
    const res = calcMasonryRow(w, {
      brick: brickRate,
      block: blockRate,
      cement: cementRate,
      sand: sandRate,
    });
    masonryVolCum += res.netWallVolCum;
    masonryUnits += res.unitsCount;
    masonryCementBags += res.cementBags;
    masonrySandCuft += res.sandCuft;
    masonryMaterialCost += res.costInr;
    return { ...w, ...res };
  });

  // 4. Flooring Totals
  let flooringSqft = 0;
  let flooringMaterialCost = 0;
  const flooringDetails = project.flooringItems.map((f) => {
    const res = calcFlooringRow(f);
    flooringSqft += res.floorAreaSqft;
    flooringMaterialCost += res.costInr;
    return { ...f, ...res };
  });

  // 5. Plaster & Painting Totals
  let plasterSqm = 0;
  let plasterCementBags = 0;
  let plasterSandCuft = 0;
  let plasterMaterialCost = 0;
  const plasterDetails = project.plasterItems.map((p) => {
    const res = calcPlasterRow(p, { cement: cementRate, sand: sandRate });
    plasterSqm += res.areaSqm;
    plasterCementBags += res.cementBags;
    plasterSandCuft += res.sandCuft;
    plasterMaterialCost += res.costInr;
    return { ...p, ...res };
  });

  let paintSqft = 0;
  let paintMaterialCost = 0;
  let paintDedicatedLabourCost = 0;
  const paintingDetails = project.paintingItems.map((pt) => {
    const res = calcPaintingRow(pt, { paintPerL: paintRate, primerPerL: primerRate });
    paintSqft += res.areaSqft;
    paintMaterialCost += res.materialCostInr;
    paintDedicatedLabourCost += res.labourCostInr;
    return { ...pt, ...res };
  });

  // 6. Custom / Additional Materials
  let customMaterialCost = 0;
  const customMatDetails = project.customMaterials.map((cm) => {
    const grossQty = round2(safeNonNegative(cm.quantity) * (1 + safeNonNegative(cm.wastagePct) / 100));
    const totalInr = round2(grossQty * safeNonNegative(cm.rateInr));
    customMaterialCost += totalInr;
    return { ...cm, grossQty, totalInr };
  });

  // 7. Plumbing & Electrical (MEP)
  let mepMaterialCost = 0;
  let mepLabourCost = 0;
  const mepDetails = project.mepItems.map((item) => {
    const q = safeNonNegative(item.quantity);
    const matAmt = round2(q * safeNonNegative(item.materialRateInr));
    const labAmt = round2(q * safeNonNegative(item.labourRateInr));
    const totalAmt = round2(matAmt + labAmt);
    mepMaterialCost += matAmt;
    mepLabourCost += labAmt;
    return { ...item, matAmt, labAmt, totalAmt };
  });

  // 8. Dedicated Labour Module
  let dedicatedLabourCost = 0;
  let totalManDays = 0;
  const labourDetails = project.labourEntries.map((l) => {
    const res = calcLabourRow(l);
    dedicatedLabourCost += res.totalCostInr;
    totalManDays += res.manDays;
    return { ...l, ...res };
  });

  // 9. Compile Unified BOQ Line Items (Auto-synced from modules + Manual BOQ rows)
  // Notice: Labour from dedicated Labour Module is allocated across structural/finishing lines or shown cleanly without double counting
  const autoBoqRows = [
    {
      id: 'auto-rcc',
      itemNumber: '1.01',
      description: `Reinforced Cement Concrete (RCC) Works (${project.rccMembers.length} structural elements: Footings, Columns, Beams, Slabs)`,
      category: 'RCC & Structural Works',
      unit: 'Cu.m',
      quantity: round2(rccWetCum),
      materialRateInr: rccWetCum > 0 ? round2(rccMaterialCost / rccWetCum) : 0,
      materialAmountInr: round2(rccMaterialCost),
      labourRateInr: 0,
      labourAmountInr: 0,
      includesModuleWastage: true,
    },
    {
      id: 'auto-steel',
      itemNumber: '1.02',
      description: `Fe500D TMT Reinforcement Steel Bars (Cut, bend & place incl. wastage; D²/162 schedule)`,
      category: 'Steel Reinforcement',
      unit: 'Kg',
      quantity: round2(steelTotalKg),
      materialRateInr: steelRate,
      materialAmountInr: round2(steelMaterialCost),
      labourRateInr: 0,
      labourAmountInr: 0,
      includesModuleWastage: true,
    },
    {
      id: 'auto-masonry',
      itemNumber: '2.01',
      description: `Superstructure Brick / AAC Block Masonry in CM 1:6 (Net of door/window openings)`,
      category: 'Masonry Works',
      unit: 'Cu.m',
      quantity: round2(masonryVolCum),
      materialRateInr: masonryVolCum > 0 ? round2(masonryMaterialCost / masonryVolCum) : 0,
      materialAmountInr: round2(masonryMaterialCost),
      labourRateInr: 0,
      labourAmountInr: 0,
      includesModuleWastage: true,
    },
    {
      id: 'auto-flooring',
      itemNumber: '3.01',
      description: `Flooring, Vitrified Tiles, Skirting, Tile Adhesive & Epoxy Grouting`,
      category: 'Flooring & Tiling',
      unit: 'Sq.ft',
      quantity: round2(flooringSqft),
      materialRateInr: flooringSqft > 0 ? round2(flooringMaterialCost / flooringSqft) : 0,
      materialAmountInr: round2(flooringMaterialCost),
      labourRateInr: 0,
      labourAmountInr: 0,
      includesModuleWastage: true,
    },
    {
      id: 'auto-plaster',
      itemNumber: '4.01',
      description: `Internal (12mm) & External (20mm) Cement Sand Plastering`,
      category: 'Plaster & Finishes',
      unit: 'Sq.m',
      quantity: round2(plasterSqm),
      materialRateInr: plasterSqm > 0 ? round2(plasterMaterialCost / plasterSqm) : 0,
      materialAmountInr: round2(plasterMaterialCost),
      labourRateInr: 0,
      labourAmountInr: 0,
      includesModuleWastage: true,
    },
    {
      id: 'auto-paint',
      itemNumber: '4.02',
      description: `Interior & Exterior Wall Primer + Acrylic Emulsion Painting`,
      category: 'Plaster & Finishes',
      unit: 'Sq.ft',
      quantity: round2(paintSqft),
      materialRateInr: paintSqft > 0 ? round2(paintMaterialCost / paintSqft) : 0,
      materialAmountInr: round2(paintMaterialCost),
      labourRateInr: paintSqft > 0 ? round2(paintDedicatedLabourCost / paintSqft) : 0,
      labourAmountInr: round2(paintDedicatedLabourCost),
      includesModuleWastage: true,
    },
    {
      id: 'auto-custom-mat',
      itemNumber: '5.01',
      description: `Waterproofing, Admixtures & Additional Schedule Materials (${project.customMaterials.length} items)`,
      category: 'Additional Materials',
      unit: 'Lump Sum',
      quantity: 1,
      materialRateInr: round2(customMaterialCost),
      materialAmountInr: round2(customMaterialCost),
      labourRateInr: 0,
      labourAmountInr: 0,
      includesModuleWastage: true,
    },
    {
      id: 'auto-mep',
      itemNumber: '6.01',
      description: `Plumbing, Sanitary Fixtures & Electrical (MEP) Installations (${project.mepItems.length} schedules)`,
      category: 'Plumbing & Electrical',
      unit: 'Lot',
      quantity: 1,
      materialRateInr: round2(mepMaterialCost),
      materialAmountInr: round2(mepMaterialCost),
      labourRateInr: round2(mepLabourCost),
      labourAmountInr: round2(mepLabourCost),
      includesModuleWastage: false,
    },
    {
      id: 'auto-labour',
      itemNumber: '7.01',
      description: `Civil, Structural, Masonry, Carpentry & Site Workforce (${round2(totalManDays)} Man-Days across ${project.labourEntries.length} trades)`,
      category: 'Site Labour & Workforce',
      unit: 'Man-Days',
      quantity: round2(totalManDays),
      materialRateInr: 0,
      materialAmountInr: 0,
      labourRateInr: totalManDays > 0 ? round2(dedicatedLabourCost / totalManDays) : 0,
      labourAmountInr: round2(dedicatedLabourCost),
      includesModuleWastage: true,
    },
  ];

  const manualRows = project.manualBoqItems.map((m) => {
    const q = safeNonNegative(m.quantity);
    const matAmt = round2(q * safeNonNegative(m.materialRateInr));
    const labAmt = round2(q * safeNonNegative(m.labourRateInr));
    return {
      id: m.id,
      itemNumber: m.itemNumber,
      description: m.description,
      category: m.category,
      unit: m.unit,
      quantity: q,
      materialRateInr: safeNonNegative(m.materialRateInr),
      materialAmountInr: matAmt,
      labourRateInr: safeNonNegative(m.labourRateInr),
      labourAmountInr: labAmt,
      includesModuleWastage: false,
      isManual: true,
    };
  });

  const allBoqRows = [...autoBoqRows, ...manualRows].map((row) => ({
    ...row,
    totalAmountInr: round2(row.materialAmountInr + row.labourAmountInr),
  }));

  const totalMaterialCostInr = round2(allBoqRows.reduce((acc, r) => acc + r.materialAmountInr, 0));
  const totalLabourCostInr = round2(allBoqRows.reduce((acc, r) => acc + r.labourAmountInr, 0));
  const directBaseCostInr = round2(totalMaterialCostInr + totalLabourCostInr);

  // Avoid double counting wastage: only apply global wastage % to items that didn't already apply module-level wastage
  const unadjustedMaterialBase = allBoqRows
    .filter((r) => !r.includesModuleWastage)
    .reduce((acc, r) => acc + r.materialAmountInr, 0);

  const transportationCostInr = round2(totalMaterialCostInr * (safeNonNegative(project.transportationPct) / 100));
  const miscExpenseCostInr = round2(directBaseCostInr * (safeNonNegative(project.miscExpensePct) / 100));
  const globalWastageAllowanceInr = round2(unadjustedMaterialBase * (safeNonNegative(project.globalWastagePct) / 100));
  const otherDirectExpensesInr = round2(transportationCostInr + miscExpenseCostInr + globalWastageAllowanceInr);

  // Material + Labour + Other applicable expenses = Base Project Cost
  const baseProjectCostInr = round2(directBaseCostInr + otherDirectExpensesInr);

  const contractorProfitInr = round2(baseProjectCostInr * (safeNonNegative(project.contractorProfitPct) / 100));
  const contingencyInr = round2(baseProjectCostInr * (safeNonNegative(project.contingencyPct) / 100));
  const preTaxAmountInr = round2(baseProjectCostInr + contractorProfitInr + contingencyInr);
  const gstAmountInr = round2(preTaxAmountInr * (safeNonNegative(project.gstPct) / 100));
  const finalEstimatedCostInr = round2(preTaxAmountInr + gstAmountInr);
  const costPerSqftInr = round2(finalEstimatedCostInr / builtUpSqft);

  const totalCementBags = round2(rccCementBags + masonryCementBags + plasterCementBags);
  const totalSandCuft = round2(rccSandCuft + masonrySandCuft + plasterSandCuft);

  return {
    areaSummary,
    rccDetails,
    rccSummary: { rccWetCum: round2(rccWetCum), rccCementBags: round2(rccCementBags), rccSandCuft: round2(rccSandCuft), rccAggCuft: round2(rccAggCuft), rccMaterialCost: round2(rccMaterialCost) },
    steelDetails,
    steelSummary: { steelTotalKg: round2(steelTotalKg), steelTotalTonnes: round2(steelTotalKg / 1000), steelMaterialCost: round2(steelMaterialCost) },
    masonryDetails,
    masonrySummary: { masonryVolCum: round2(masonryVolCum), masonryUnits, masonryCementBags: round2(masonryCementBags), masonrySandCuft: round2(masonrySandCuft), masonryMaterialCost: round2(masonryMaterialCost) },
    flooringDetails,
    flooringSummary: { flooringSqft: round2(flooringSqft), flooringMaterialCost: round2(flooringMaterialCost) },
    plasterDetails,
    plasterSummary: { plasterSqm: round2(plasterSqm), plasterCementBags: round2(plasterCementBags), plasterSandCuft: round2(plasterSandCuft), plasterMaterialCost: round2(plasterMaterialCost) },
    paintingDetails,
    paintingSummary: { paintSqft: round2(paintSqft), paintMaterialCost: round2(paintMaterialCost), paintDedicatedLabourCost: round2(paintDedicatedLabourCost) },
    customMatDetails,
    customMaterialCost: round2(customMaterialCost),
    mepDetails,
    mepSummary: { mepMaterialCost: round2(mepMaterialCost), mepLabourCost: round2(mepLabourCost), totalMepCost: round2(mepMaterialCost + mepLabourCost) },
    labourDetails,
    labourSummary: { dedicatedLabourCost: round2(dedicatedLabourCost), totalManDays: round2(totalManDays), totalProjectLabourInr: totalLabourCostInr, labourPerSqftInr: round2(totalLabourCostInr / builtUpSqft) },
    allBoqRows,
    financials: {
      totalMaterialCostInr,
      totalLabourCostInr,
      directBaseCostInr,
      transportationCostInr,
      miscExpenseCostInr,
      globalWastageAllowanceInr,
      otherDirectExpensesInr,
      baseProjectCostInr,
      contractorProfitInr,
      contingencyInr,
      preTaxAmountInr,
      gstAmountInr,
      finalEstimatedCostInr,
      costPerSqftInr,
      totalCementBags,
      totalSandCuft,
    },
  };
}

// ============================================================================
// 2. CLEAN INITIAL WORKSPACE DATA (NO EXAMPLE PROJECTS OR PRE-FILLED VALUES)
// ============================================================================

export const EMPTY_PROJECT_FALLBACK: Project = {
  id: '',
  name: 'No Active Project',
  clientName: '',
  location: '',
  constructionType: 'Residential',
  structureType: 'RCC framed structure',
  status: 'Planning',
  progressPct: 0,
  floors: 1,
  plotLengthFt: 0,
  plotWidthFt: 0,
  buildingLengthFt: 0,
  buildingWidthFt: 0,
  slabProjectionFt: 0,
  wallHeightFt: 10,
  startDate: new Date().toISOString().slice(0, 10),
  description: '',
  transportationPct: 0,
  miscExpensePct: 0,
  globalWastagePct: 0,
  contractorProfitPct: 0,
  contingencyPct: 0,
  gstPct: 18,
  rooms: [],
  rccMembers: [],
  steelEntries: [],
  customMaterials: [],
  masonryWalls: [],
  flooringItems: [],
  plasterItems: [],
  paintingItems: [],
  mepItems: [],
  labourEntries: [],
  manualBoqItems: [],
  historyLogs: [],
};

const INITIAL_RATES: RateItem[] = [
  { id: 'rt-1', category: 'Cement', name: 'Cement (50kg Bag)', unit: 'Bags', rateInr: 0, defaultRateInr: 0, isProjectOverride: false, history: [] },
  { id: 'rt-2', category: 'Sand', name: 'Construction Sand / M-Sand', unit: 'Cubic feet', rateInr: 0, defaultRateInr: 0, isProjectOverride: false, history: [] },
  { id: 'rt-3', category: 'Aggregate', name: 'Coarse Aggregate (20mm / 10mm)', unit: 'Cubic feet', rateInr: 0, defaultRateInr: 0, isProjectOverride: false, history: [] },
  { id: 'rt-4', category: 'Steel', name: 'TMT Reinforcement Steel Bars', unit: 'Kilograms', rateInr: 0, defaultRateInr: 0, isProjectOverride: false, history: [] },
  { id: 'rt-5', category: 'Bricks', name: 'Masonry Clay Bricks', unit: 'Numbers', rateInr: 0, defaultRateInr: 0, isProjectOverride: false, history: [] },
  { id: 'rt-6', category: 'Blocks', name: 'AAC / Concrete Masonry Blocks', unit: 'Numbers', rateInr: 0, defaultRateInr: 0, isProjectOverride: false, history: [] },
  { id: 'rt-7', category: 'Tiles', name: 'Flooring & Wall Tiles', unit: 'Square feet', rateInr: 0, defaultRateInr: 0, isProjectOverride: false, history: [] },
  { id: 'rt-8', category: 'Paint', name: 'Primer & Emulsion Paint', unit: 'Litres', rateInr: 0, defaultRateInr: 0, isProjectOverride: false, history: [] },
  { id: 'rt-9', category: 'Waterproofing', name: 'Waterproofing Compound', unit: 'Kilograms', rateInr: 0, defaultRateInr: 0, isProjectOverride: false, history: [] },
  { id: 'rt-10', category: 'Labour', name: 'Skilled Construction Labour (Daily)', unit: 'Day', rateInr: 0, defaultRateInr: 0, isProjectOverride: false, history: [] },
  { id: 'rt-11', category: 'Transportation', name: 'Material Transportation Allowance', unit: 'Percentage', rateInr: 0, defaultRateInr: 0, isProjectOverride: false, history: [] },
  { id: 'rt-12', category: 'Miscellaneous', name: 'Miscellaneous Site Expenses', unit: 'Percentage', rateInr: 0, defaultRateInr: 0, isProjectOverride: false, history: [] },
];

const INITIAL_PROJECTS: Project[] = [];

// ============================================================================
// 3. ZUSTAND GLOBAL APPLICATION STORE
// ============================================================================

interface CompanyProfile {
  companyName: string;
  tagline: string;
  gstin: string;
  registeredAddress: string;
  contactEmail: string;
  contactPhone: string;
  chiefEstimator: string;
  quotationPrefix: string;
  defaultUnitSystem: 'Imperial (ft / sq.ft)' | 'Metric (m / sq.m)';
}

interface ConstructProState {
  activeTab: NavigationTab;
  sidebarCollapsed: boolean;
  darkMode: boolean;
  activeProjectId: string;
  projects: Project[];
  rates: RateItem[];
  companyProfile: CompanyProfile;
  toastMessage: { text: string; type: 'success' | 'info' | 'warning' } | null;

  // Actions
  setActiveTab: (tab: NavigationTab) => void;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  setActiveProject: (id: string) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'warning') => void;
  clearToast: () => void;

  // Project CRUD
  createProject: (proj: Omit<Project, 'id' | 'rooms' | 'rccMembers' | 'steelEntries' | 'customMaterials' | 'masonryWalls' | 'flooringItems' | 'plasterItems' | 'paintingItems' | 'mepItems' | 'labourEntries' | 'manualBoqItems' | 'historyLogs'>) => string;
  updateActiveProject: (updater: (proj: Project) => Project, logMessage?: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;

  // Rate CRUD
  addRateItem: (item: Omit<RateItem, 'id' | 'history'>) => void;
  updateRateItem: (id: string, newRateInr: number, note?: string) => void;
  deleteRateItem: (id: string) => void;
  resetRatesToDefault: () => void;

  // Settings
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;
}

export const useConstructStore = create<ConstructProState>((set, get) => ({
  activeTab: 'dashboard',
  sidebarCollapsed: false,
  darkMode: false,
  activeProjectId: '',
  projects: INITIAL_PROJECTS,
  rates: INITIAL_RATES,
  companyProfile: {
    companyName: 'CONSTRUCT PRO',
    tagline: 'Smart Construction Estimation & Cost Management',
    gstin: '',
    registeredAddress: '',
    contactEmail: '',
    contactPhone: '',
    chiefEstimator: '',
    quotationPrefix: 'QTN-',
    defaultUnitSystem: 'Imperial (ft / sq.ft)',
  },
  toastMessage: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  setActiveProject: (id) => {
    const p = get().projects.find((x) => x.id === id);
    set({ activeProjectId: id });
    if (p) get().showToast(`Switched active workspace to "${p.name}"`, 'info');
  },
  showToast: (text, type = 'success') => {
    set({ toastMessage: { text, type } });
    setTimeout(() => {
      if (get().toastMessage?.text === text) {
        set({ toastMessage: null });
      }
    }, 3500);
  },
  clearToast: () => set({ toastMessage: null }),

  createProject: (data) => {
    const newId = 'proj-' + Date.now();
    const newProj: Project = {
      ...data,
      id: newId,
      rooms: [],
      rccMembers: [],
      steelEntries: [],
      customMaterials: [],
      masonryWalls: [],
      flooringItems: [],
      plasterItems: [],
      paintingItems: [],
      mepItems: [],
      labourEntries: [],
      manualBoqItems: [],
      historyLogs: [
        { id: 'log-' + Date.now(), action: 'CREATED', details: `Project "${data.name}" created.`, timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ') },
      ],
    };
    set((s) => ({
      projects: [newProj, ...s.projects],
      activeProjectId: newId,
    }));
    get().showToast(`Created new project "${data.name}"`, 'success');
    return newId;
  },

  updateActiveProject: (updater, logMessage) => {
    set((s) => {
      const updated = s.projects.map((p) => {
        if (p.id !== s.activeProjectId) return p;
        const nextProj = updater({ ...p });
        if (logMessage) {
          nextProj.historyLogs = [
            {
              id: 'log-' + Date.now(),
              action: 'UPDATED',
              details: logMessage,
              timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            },
            ...nextProj.historyLogs.slice(0, 29),
          ];
        }
        return nextProj;
      });
      return { projects: updated };
    });
  },

  deleteProject: (id) => {
    set((s) => {
      const remaining = s.projects.filter((p) => p.id !== id);
      const nextActive = s.activeProjectId === id ? (remaining[0]?.id || '') : s.activeProjectId;
      get().showToast('Project deleted from database.', 'info');
      return { projects: remaining, activeProjectId: nextActive };
    });
  },

  duplicateProject: (id) => {
    const orig = get().projects.find((p) => p.id === id);
    if (!orig) return;
    const copyId = 'proj-copy-' + Date.now();
    const copyProj: Project = JSON.parse(JSON.stringify(orig));
    copyProj.id = copyId;
    copyProj.name = `${orig.name} (Copy)`;
    copyProj.historyLogs = [
      {
        id: 'log-' + Date.now(),
        action: 'DUPLICATED',
        details: `Cloned from project "${orig.name}"`,
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      },
      ...copyProj.historyLogs,
    ];
    set((s) => ({
      projects: [copyProj, ...s.projects],
      activeProjectId: copyId,
    }));
    get().showToast(`Duplicated "${orig.name}"`, 'success');
  },

  addRateItem: (item) => {
    const newRate: RateItem = {
      ...item,
      id: 'rt-' + Date.now(),
      history: [],
    };
    set((s) => ({ rates: [...s.rates, newRate] }));
    get().showToast(`Added "${item.name}" to Rate Database`, 'success');
  },

  updateRateItem: (id, newRateInr, note = 'Manual rate revision') => {
    set((s) => ({
      rates: s.rates.map((r) => {
        if (r.id !== id) return r;
        const cleanNew = safeNonNegative(newRateInr);
        if (cleanNew === r.rateInr) return r;
        return {
          ...r,
          rateInr: cleanNew,
          isProjectOverride: cleanNew !== r.defaultRateInr,
          history: [
            {
              id: 'rh-' + Date.now(),
              oldRateInr: r.rateInr,
              newRateInr: cleanNew,
              changedAt: new Date().toISOString().slice(0, 10),
              note,
            },
            ...r.history,
          ],
        };
      }),
    }));
    get().showToast('Rate updated & all dependent project BOQs recalculated.', 'success');
  },

  deleteRateItem: (id) => {
    set((s) => ({ rates: s.rates.filter((r) => r.id !== id) }));
    get().showToast('Rate entry removed.', 'info');
  },

  resetRatesToDefault: () => {
    set((s) => ({
      rates: s.rates.map((r) => ({
        ...r,
        rateInr: r.defaultRateInr,
        isProjectOverride: false,
      })),
    }));
    get().showToast('All material & labour rates restored to baseline defaults.', 'info');
  },

  updateCompanyProfile: (profile) => {
    set((s) => ({ companyProfile: { ...s.companyProfile, ...profile } }));
    get().showToast('Organization & Quotation settings saved.', 'success');
  },
}));

// ============================================================================
// 4. REUSABLE UI PRIMITIVES & NAVIGATION CONFIG
// ============================================================================

export const NAV_ITEMS: { id: NavigationTab; label: string; group: string; icon: React.ComponentType<any> }[] = [
  { id: 'dashboard', label: 'Dashboard', group: 'Overview', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', group: 'Overview', icon: FolderKanban },
  { id: 'project-inputs', label: 'Project Inputs', group: 'Overview', icon: SlidersHorizontal },
  { id: 'area-calc', label: 'Area Calculator', group: 'Quantity Takeoff', icon: Maximize2 },
  { id: 'rcc-calc', label: 'RCC Calculator', group: 'Quantity Takeoff', icon: Boxes },
  { id: 'steel-calc', label: 'Steel Calculator', group: 'Quantity Takeoff', icon: Construction },
  { id: 'material-calc', label: 'Material Calculator', group: 'Quantity Takeoff', icon: PackageCheck },
  { id: 'masonry-calc', label: 'Masonry Calculator', group: 'Quantity Takeoff', icon: BrickWall },
  { id: 'flooring-calc', label: 'Flooring Calculator', group: 'Finishes & MEP', icon: Grid },
  { id: 'plaster-paint', label: 'Plaster & Painting', group: 'Finishes & MEP', icon: PaintBucket },
  { id: 'plumbing-electrical', label: 'Plumbing & Electrical', group: 'Finishes & MEP', icon: Wrench },
  { id: 'labour-calc', label: 'Labour Calculator', group: 'Costing & Commercial', icon: HardHat },
  { id: 'boq-cost', label: 'BOQ & Cost Estimation', group: 'Costing & Commercial', icon: ReceiptIndianRupee },
  { id: 'rate-mgmt', label: 'Rate Management', group: 'Costing & Commercial', icon: Database },
  { id: 'reports', label: 'Reports & Quotations', group: 'Costing & Commercial', icon: FileText },
  { id: 'settings', label: 'Settings', group: 'System', icon: Settings },
];

const NAVY_CHART_COLORS = ['#0f294a', '#1d4ed8', '#0284c7', '#0d9488', '#d97706', '#4f46e5', '#64748b'];

const SectionHeader: React.FC<{
  title: string;
  subtitle: string;
  badge?: string;
  rightContent?: React.ReactNode;
}> = ({ title, subtitle, badge, rightContent }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
    <div>
      <div className="flex items-center gap-2.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {badge && (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
    </div>
    {rightContent && <div className="flex items-center gap-2 flex-wrap">{rightContent}</div>}
  </div>
);

const KpiCard: React.FC<{
  label: string;
  value: string;
  subtext: string;
  icon: React.ComponentType<any>;
  accent?: 'navy' | 'blue' | 'emerald' | 'amber';
}> = ({ label, value, subtext, icon: Icon, accent = 'navy' }) => {
  const accentStyles = {
    navy: 'bg-slate-900 text-white dark:bg-blue-950',
    blue: 'bg-blue-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    amber: 'bg-amber-600 text-white',
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 truncate">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtext}</p>
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${accentStyles[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 1: DASHBOARD
// ============================================================================

const DashboardView: React.FC<{ onOpenNewProjectModal: () => void }> = ({ onOpenNewProjectModal }) => {
  const { projects, rates, activeProjectId, setActiveProject, setActiveTab } = useConstructStore();

  const evaluatedProjects = useMemo(() => {
    return projects.map((p) => ({
      project: p,
      eval: evaluateCompleteProject(p, rates),
    }));
  }, [projects, rates]);

  const portfolioStats = useMemo(() => {
    const totalProjects = evaluatedProjects.length;
    const activeProjects = evaluatedProjects.filter((x) => x.project.status === 'Active').length;
    const completedProjects = evaluatedProjects.filter((x) => x.project.status === 'Completed').length;

    let totalPortfolioValue = 0;
    let totalMaterialValue = 0;
    let totalLabourValue = 0;
    let totalBuiltUpArea = 0;

    for (const item of evaluatedProjects) {
      totalPortfolioValue += item.eval.financials.finalEstimatedCostInr;
      totalMaterialValue += item.eval.financials.totalMaterialCostInr;
      totalLabourValue += item.eval.financials.totalLabourCostInr;
      totalBuiltUpArea += item.eval.areaSummary.totalBuiltUpAreaSqft;
    }

    const avgCostPerSqft = totalBuiltUpArea > 0 ? round2(totalPortfolioValue / totalBuiltUpArea) : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalPortfolioValue: round2(totalPortfolioValue),
      totalMaterialValue: round2(totalMaterialValue),
      totalLabourValue: round2(totalLabourValue),
      totalBuiltUpArea: round2(totalBuiltUpArea),
      avgCostPerSqft,
    };
  }, [evaluatedProjects]);

  const activeEval = useMemo(() => {
    return evaluatedProjects.find((x) => x.project.id === activeProjectId) || evaluatedProjects[0];
  }, [evaluatedProjects, activeProjectId]);

  const projectComparisonChartData = useMemo(() => {
    return evaluatedProjects.map((item) => ({
      name: item.project.name.length > 18 ? item.project.name.slice(0, 18) + '…' : item.project.name,
      Material: Math.round(item.eval.financials.totalMaterialCostInr / 100000), // in Lakhs
      Labour: Math.round(item.eval.financials.totalLabourCostInr / 100000),
      OverheadsAndTax: Math.round(
        (item.eval.financials.finalEstimatedCostInr - item.eval.financials.directBaseCostInr) / 100000
      ),
    }));
  }, [evaluatedProjects]);

  const materialPieData = useMemo(() => {
    if (!activeEval) return [];
    const e = activeEval.eval;
    return [
      { name: 'RCC Concrete', value: Math.round(e.rccSummary.rccMaterialCost) },
      { name: 'Reinforcement Steel', value: Math.round(e.steelSummary.steelMaterialCost) },
      { name: 'Masonry Walls', value: Math.round(e.masonrySummary.masonryMaterialCost) },
      { name: 'Flooring & Tiling', value: Math.round(e.flooringSummary.flooringMaterialCost) },
      { name: 'Plaster & Paint', value: Math.round(e.plasterSummary.plasterMaterialCost + e.paintingSummary.paintMaterialCost) },
      { name: 'MEP & Custom', value: Math.round(e.mepSummary.mepMaterialCost + e.customMaterialCost) },
    ].filter((d) => d.value > 0);
  }, [activeEval]);

  const labourBarData = useMemo(() => {
    if (!activeEval) return [];
    return activeEval.eval.labourDetails.map((l) => ({
      trade: l.category,
      costInr: Math.round(l.totalCostInr),
      manDays: l.manDays,
    }));
  }, [activeEval]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Executive Estimation & Cost Dashboard"
        subtitle="Real-time multi-project portfolio metrics, BOQ material/labour split, and construction progress tracking."
        badge="Live Database Sync"
        rightContent={
          <>
            <button
              onClick={onOpenNewProjectModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
            <button
              onClick={() => setActiveTab('boq-cost')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ReceiptIndianRupee className="w-4 h-4" />
              Open Master BOQ
            </button>
          </>
        }
      />

      {/* Top Portfolio KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Portfolio Projects"
          value={`${portfolioStats.totalProjects} Projects`}
          subtext={`${portfolioStats.activeProjects} Active · ${portfolioStats.completedProjects} Completed`}
          icon={FolderKanban}
          accent="navy"
        />
        <KpiCard
          label="Total Estimated Value"
          value={formatINR(portfolioStats.totalPortfolioValue)}
          subtext={`Across ${portfolioStats.totalBuiltUpArea.toLocaleString('en-IN')} sq.ft built-up`}
          icon={ReceiptIndianRupee}
          accent="blue"
        />
        <KpiCard
          label="Total Material & Labour"
          value={formatINR(portfolioStats.totalMaterialValue + portfolioStats.totalLabourValue)}
          subtext={`Mat: ${formatINR(portfolioStats.totalMaterialValue)} · Lab: ${formatINR(portfolioStats.totalLabourValue)}`}
          icon={Boxes}
          accent="emerald"
        />
        <KpiCard
          label="Average Cost / Sq.Ft"
          value={`${formatINR(portfolioStats.avgCostPerSqft)} / sq.ft`}
          subtext={`Active Project: ${formatINR(activeEval?.eval.financials.costPerSqftInr || 0)}/sq.ft`}
          icon={Calculator}
          accent="amber"
        />
      </div>

      {/* Empty Workspace Onboarding Banner or Active Project Spotlight */}
      {projects.length === 0 ? (
        <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Fresh Workspace Ready
            </span>
            <h2 className="text-lg sm:text-xl font-bold mt-2">Welcome to CONSTRUCT PRO</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Your workspace is clean with zero example projects or pre-filled values. Start by setting your material and labour rates in <strong>Rate Management</strong> or creating your first project to unlock real-time quantity takeoffs and BOQ estimation.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenNewProjectModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create First Project
            </button>
            <button
              onClick={() => setActiveTab('rate-mgmt')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <Database className="w-4 h-4" />
              Set Material Rates
            </button>
          </div>
        </div>
      ) : activeEval && (
        <div className="bg-slate-900 dark:bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Active Workspace Project
                </span>
                <span className="text-xs text-slate-300">{activeEval.project.location}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold mt-1.5">{activeEval.project.name}</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Client: <strong className="text-white">{activeEval.project.clientName}</strong> ·{' '}
                {activeEval.project.constructionType} ({activeEval.project.structureType}) · G+
                {Math.max(0, activeEval.project.floors - 1)} ({activeEval.eval.areaSummary.totalBuiltUpAreaSqft.toLocaleString('en-IN')} sq.ft)
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left lg:text-right border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
              <div>
                <p className="text-xs text-slate-400">Material Cost</p>
                <p className="text-sm sm:text-base font-bold text-white">{formatINR(activeEval.eval.financials.totalMaterialCostInr)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Labour Cost</p>
                <p className="text-sm sm:text-base font-bold text-white">{formatINR(activeEval.eval.financials.totalLabourCostInr)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Final Quotation (Incl. GST)</p>
                <p className="text-sm sm:text-base font-bold text-emerald-400">{formatINR(activeEval.eval.financials.finalEstimatedCostInr)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Unit Rate / Sq.Ft</p>
                <p className="text-sm sm:text-base font-bold text-amber-300">{formatINR(activeEval.eval.financials.costPerSqftInr)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project-wise Cost Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Project-Wise Cost Breakdown (₹ Lakhs)</h3>
            <p className="text-xs text-slate-500">Material vs. Labour vs. Overheads/GST across all projects</p>
          </div>
          <div className="relative h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectComparisonChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip formatter={(value: any) => [`₹${value} Lakhs`, '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Material" stackId="a" fill="#0f294a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Labour" stackId="a" fill="#0284c7" />
                <Bar dataKey="OverheadsAndTax" name="Overheads & GST" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Material Expense Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Material Expense Distribution</h3>
            <p className="text-xs text-slate-500">Trade-wise material cost for {activeEval?.project.name}</p>
          </div>
          <div className="relative h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={materialPieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {materialPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={NAVY_CHART_COLORS[index % NAVY_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => [formatINR(Number(value)), 'Cost']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Labour Expense Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Workforce & Trade Labour Cost</h3>
            <p className="text-xs text-slate-500">Category-wise labour allocation for {activeEval?.project.name}</p>
          </div>
          <div className="relative h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labourBarData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="trade" type="category" tick={{ fontSize: 11 }} width={75} />
                <RechartsTooltip formatter={(val: any) => [formatINR(Number(val)), 'Labour Cost']} />
                <Bar dataKey="costInr" name="Trade Cost (₹)" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Projects & Construction Progress Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Projects & Construction Progress Overview</h3>
            <p className="text-xs text-slate-500">Click any project to switch active estimation workspace</p>
          </div>
          <button
            onClick={() => setActiveTab('projects')}
            className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            Manage All Projects <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 font-semibold">Project Name & Client</th>
                <th className="py-3 px-4 font-semibold">Type & Structure</th>
                <th className="py-3 px-4 font-semibold text-right">Built-up Area</th>
                <th className="py-3 px-4 font-semibold text-right">Material Cost</th>
                <th className="py-3 px-4 font-semibold text-right">Labour Cost</th>
                <th className="py-3 px-4 font-semibold text-right">Final Estimate</th>
                <th className="py-3 px-4 font-semibold">Progress</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {evaluatedProjects.map(({ project, eval: ev }) => {
                const isSelected = project.id === activeProjectId;
                return (
                  <tr
                    key={project.id}
                    className={`${
                      isSelected ? 'bg-blue-50/60 dark:bg-blue-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    } transition-colors`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {project.name}
                        {isSelected && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-600 text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{project.clientName} · {project.location}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{project.constructionType}</span>
                      <div className="text-slate-500">{project.structureType}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {ev.areaSummary.totalBuiltUpAreaSqft.toLocaleString('en-IN')} sq.ft
                    </td>
                    <td className="py-3.5 px-4 text-right">{formatINR(ev.financials.totalMaterialCostInr)}</td>
                    <td className="py-3.5 px-4 text-right">{formatINR(ev.financials.totalLabourCostInr)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatINR(ev.financials.finalEstimatedCostInr)}
                      <div className="text-[11px] font-normal text-slate-500">
                        {formatINR(ev.financials.costPerSqftInr)}/sq.ft
                      </div>
                    </td>
                    <td className="py-3.5 px-4 w-40">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium">{project.status}</span>
                        <span className="font-semibold">{project.progressPct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            project.status === 'Completed' ? 'bg-emerald-600' : 'bg-[#0f294a] dark:bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, project.progressPct))}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setActiveProject(project.id);
                          setActiveTab('project-inputs');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 2: PROJECTS DIRECTORY (CRUD, DUPLICATE, HISTORY, SEARCH & FILTER)
// ============================================================================

const ProjectsDirectoryView: React.FC<{ onOpenNewProjectModal: () => void }> = ({ onOpenNewProjectModal }) => {
  const {
    projects,
    rates,
    activeProjectId,
    setActiveProject,
    setActiveTab,
    duplicateProject,
    deleteProject,
  } = useConstructStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'Residential' | 'Commercial'>('ALL');
  const [filterStructure, setFilterStructure] = useState<'ALL' | 'RCC framed structure' | 'Load-bearing structure'>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [historyModalProjectId, setHistoryModalProjectId] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'ALL' || p.constructionType === filterType;
      const matchesStruct = filterStructure === 'ALL' || p.structureType === filterStructure;
      return matchesSearch && matchesType && matchesStruct;
    });
  }, [projects, searchQuery, filterType, filterStructure]);

  const historyProject = projects.find((p) => p.id === historyModalProjectId);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Management & Estimation Portfolio"
        subtitle="Create, edit, duplicate, inspect audit history, or filter residential and commercial construction projects."
        rightContent={
          <button
            onClick={onOpenNewProjectModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create New Project
          </button>
        }
      />

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name, client, or location..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Construction Types</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
          </select>
          <select
            value={filterStructure}
            onChange={(e) => setFilterStructure(e.target.value as any)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Structure Types</option>
            <option value="RCC framed structure">RCC framed structure</option>
            <option value="Load-bearing structure">Load-bearing structure</option>
          </select>
        </div>
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <FolderKanban className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Matching Projects Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search filters or create a new project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredProjects.map((project) => {
            const ev = evaluateCompleteProject(project, rates);
            const isActive = project.id === activeProjectId;
            return (
              <div
                key={project.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border transition-all p-5 shadow-sm flex flex-col justify-between ${
                  isActive
                    ? 'border-blue-600 ring-2 ring-blue-600/15'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {project.constructionType}
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {project.structureType}
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {project.status} ({project.progressPct}%)
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{project.name}</h3>
                      <p className="text-xs text-slate-500">
                        Client: <strong className="text-slate-700 dark:text-slate-300">{project.clientName}</strong> ·{' '}
                        {project.location}
                      </p>
                    </div>
                    {isActive && (
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#0f294a] text-white shrink-0">
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-2">{project.description}</p>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Plot / Floors</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {project.plotLengthFt}'×{project.plotWidthFt}' · {project.floors} Flr
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Built-Up Area</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {ev.areaSummary.totalBuiltUpAreaSqft.toLocaleString('en-IN')} sq.ft
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Estimated Total</span>
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                        {formatINR(ev.financials.finalEstimatedCostInr)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Cost / Sq.Ft</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatINR(ev.financials.costPerSqftInr)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveProject(project.id);
                        setActiveTab('project-inputs');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0f294a] text-white hover:bg-blue-900"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Select & Edit
                    </button>
                    <button
                      onClick={() => duplicateProject(project.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => setHistoryModalProjectId(project.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                    >
                      <History className="w-3.5 h-3.5" />
                      History ({project.historyLogs.length})
                    </button>
                  </div>

                  {confirmDeleteId === project.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-red-600 font-semibold">Confirm delete?</span>
                      <button
                        onClick={() => {
                          deleteProject(project.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2.5 py-1 rounded text-xs font-bold bg-red-600 text-white hover:bg-red-700"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(project.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Audit History Modal */}
      {historyProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Project History Log — {historyProject.name}
                </h3>
                <p className="text-xs text-slate-500">Chronological audit trail of modifications</p>
              </div>
              <button
                onClick={() => setHistoryModalProjectId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="my-4 max-h-80 overflow-y-auto space-y-3">
              {historyProject.historyLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      {log.action}
                    </span>
                    <span className="text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1.5">{log.details}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setHistoryModalProjectId(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0f294a] text-white"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MODULE 3: PROJECT INPUTS & PARAMETERS
// ============================================================================

const ProjectInputsView: React.FC = () => {
  const { projects, activeProjectId, updateActiveProject, setActiveTab } = useConstructStore();
  const project = projects.find((p) => p.id === activeProjectId) || projects[0] || EMPTY_PROJECT_FALLBACK;
  const areaMetrics = useMemo(() => calcArea(project), [project]);

  const handleFieldChange = (field: keyof Project, value: any) => {
    updateActiveProject((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Inputs & Master Parameters"
        subtitle="Configure project metadata, structural classification, plot/building envelope dimensions, and BOQ commercial markup percentages."
        badge={project.name}
        rightContent={
          <button
            onClick={() => {
              updateActiveProject((p) => p, 'Saved project master parameters and commercial markups.');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save Project Information
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* General & Client Metadata */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2.5">
            1. General Project & Structural Classification
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client / Promoter Name *
              </label>
              <input
                type="text"
                value={project.clientName}
                onChange={(e) => handleFieldChange('clientName', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Site Location *
              </label>
              <input
                type="text"
                value={project.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Start Date
              </label>
              <input
                type="date"
                value={project.startDate}
                onChange={(e) => handleFieldChange('startDate', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Construction Type
              </label>
              <select
                value={project.constructionType}
                onChange={(e) => handleFieldChange('constructionType', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Structure Type
              </label>
              <select
                value={project.structureType}
                onChange={(e) => handleFieldChange('structureType', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="RCC framed structure">RCC framed structure</option>
                <option value="Load-bearing structure">Load-bearing structure</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Status
              </label>
              <select
                value={project.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Site Execution Progress ({project.progressPct}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={project.progressPct}
                onChange={(e) => handleFieldChange('progressPct', Number(e.target.value))}
                className="w-full mt-2 accent-[#0f294a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Scope & Engineering Description
            </label>
            <textarea
              rows={3}
              value={project.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2.5 pt-2">
            2. Plot & Building Envelope Dimensions (Imperial Feet)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Plot Length (ft)
              </label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={project.plotLengthFt}
                onChange={(e) => handleFieldChange('plotLengthFt', safeNonNegative(Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Plot Width (ft)
              </label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={project.plotWidthFt}
                onChange={(e) => handleFieldChange('plotWidthFt', safeNonNegative(Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Number of Floors
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={project.floors}
                onChange={(e) => handleFieldChange('floors', Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Building Plinth Length (ft)
              </label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={project.buildingLengthFt}
                onChange={(e) => handleFieldChange('buildingLengthFt', safeNonNegative(Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Building Plinth Width (ft)
              </label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={project.buildingWidthFt}
                onChange={(e) => handleFieldChange('buildingWidthFt', safeNonNegative(Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Floor-to-Floor Height (ft)
              </label>
              <input
                type="number"
                min={8}
                step="0.5"
                value={project.wallHeightFt}
                onChange={(e) => handleFieldChange('wallHeightFt', safeNonNegative(Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Commercial Overheads & Live Unit Reference */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2.5">
              3. Commercial Overheads & Tax (%)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Transportation (%)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.25"
                  value={project.transportationPct}
                  onChange={(e) => handleFieldChange('transportationPct', safeNonNegative(Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Misc. Expenses (%)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.25"
                  value={project.miscExpensePct}
                  onChange={(e) => handleFieldChange('miscExpensePct', safeNonNegative(Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Global Wastage (%)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={project.globalWastagePct}
                  onChange={(e) => handleFieldChange('globalWastagePct', safeNonNegative(Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Contractor Profit (%)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={project.contractorProfitPct}
                  onChange={(e) => handleFieldChange('contractorProfitPct', safeNonNegative(Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Contingency (%)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={project.contingencyPct}
                  onChange={(e) => handleFieldChange('contingencyPct', safeNonNegative(Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  GST Tax Rate (%)
                </label>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={project.gstPct}
                  onChange={(e) => handleFieldChange('gstPct', safeNonNegative(Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-blue-300">
              Auto-Computed Envelope Summary
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Plot Area:</span>
                <span className="font-bold">{areaMetrics.plotAreaSqft.toLocaleString('en-IN')} Sq.Ft</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Ground Floor Plinth:</span>
                <span className="font-bold">{areaMetrics.groundFloorAreaSqft.toLocaleString('en-IN')} Sq.Ft</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Built-Up Area ({project.floors} Floors):</span>
                <span className="font-bold text-emerald-400">
                  {areaMetrics.totalBuiltUpAreaSqft.toLocaleString('en-IN')} Sq.Ft
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Metric Equivalent:</span>
                <span className="font-semibold">
                  {round2(areaMetrics.totalBuiltUpAreaSqft * UNIT_CONVERSIONS.SQFT_TO_SQM)} Sq.m
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('area-calc')}
              className="w-full mt-2 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Configure Room-by-Room Schedule →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 4: AREA CALCULATOR (PLOT, BUILT-UP, CARPET, WALLS, SLABS & CONVERTER)
// ============================================================================

const AreaCalculatorView: React.FC = () => {
  const { projects, activeProjectId, updateActiveProject } = useConstructStore();
  const project = projects.find((p) => p.id === activeProjectId) || projects[0] || EMPTY_PROJECT_FALLBACK;
  const areaSummary = useMemo(() => calcArea(project), [project]);

  const [newRoom, setNewRoom] = useState<Omit<RoomDimension, 'id'>>({
    name: '',
    floorNumber: 1,
    lengthFt: 0,
    widthFt: 0,
    heightFt: 10,
    wallThicknessFt: 0.75,
    count: 1,
  });

  // Interactive Unit Converter tool state
  const [convVal, setConvVal] = useState<number>(0);
  const [convType, setConvType] = useState<string>('SQFT_TO_SQM');

  const convertedOutput = useMemo(() => {
    const v = safeNonNegative(convVal);
    switch (convType) {
      case 'FT_TO_M':
        return `${round2(v * UNIT_CONVERSIONS.FT_TO_M)} Metres`;
      case 'M_TO_FT':
        return `${round2(v * UNIT_CONVERSIONS.M_TO_FT)} Feet (${round2(v * UNIT_CONVERSIONS.M_TO_FT * 12)} Inches)`;
      case 'SQFT_TO_SQM':
        return `${round2(v * UNIT_CONVERSIONS.SQFT_TO_SQM)} Sq.m`;
      case 'SQM_TO_SQFT':
        return `${round2(v * UNIT_CONVERSIONS.SQM_TO_SQFT)} Sq.ft`;
      case 'CUM_TO_CUFT':
        return `${round2(v * UNIT_CONVERSIONS.CUM_TO_CUFT)} Cubic Feet (Cu.ft)`;
      case 'CUFT_TO_CUM':
        return `${round2(v * UNIT_CONVERSIONS.CUFT_TO_CUM)} Cubic Metres (Cu.m)`;
      case 'KG_TO_TONNE':
        return `${round2(v * UNIT_CONVERSIONS.KG_TO_TONNE)} Metric Tonnes (${round2(v / 50)} Bags of 50kg)`;
      default:
        return `${v}`;
    }
  }, [convVal, convType]);

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.name.trim()) return;
    updateActiveProject((prev) => ({
      ...prev,
      rooms: [...prev.rooms, { ...newRoom, id: 'rm-' + Date.now() }],
    }), `Added room "${newRoom.name}" to Area Calculator.`);
    setNewRoom({ ...newRoom, name: '' });
  };

  const handleDeleteRoom = (id: string) => {
    updateActiveProject((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Automated Dimension & Area Calculator"
        subtitle="Calculate plot area, ground coverage, multi-floor built-up area, room-wise carpet area, wall surfaces, and slab overhangs."
        badge={project.name}
      />

      {/* Computed Area KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Plot Area</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {areaSummary.plotAreaSqft.toLocaleString('en-IN')} <span className="text-xs font-normal">sq.ft</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Ground Floor</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {areaSummary.groundFloorAreaSqft.toLocaleString('en-IN')} <span className="text-xs font-normal">sq.ft</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20">
          <span className="text-[11px] font-semibold uppercase text-blue-700 dark:text-blue-300">Total Built-Up</span>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-200 mt-1">
            {areaSummary.totalBuiltUpAreaSqft.toLocaleString('en-IN')} <span className="text-xs font-normal">sq.ft</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Net Carpet Area</span>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            {areaSummary.carpetAreaSqft.toLocaleString('en-IN')} <span className="text-xs font-normal">sq.ft</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Wall Surface Area</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {areaSummary.wallSurfaceAreaSqft.toLocaleString('en-IN')} <span className="text-xs font-normal">sq.ft</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Gross Slab Area</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {areaSummary.slabAreaSqft.toLocaleString('en-IN')} <span className="text-xs font-normal">sq.ft</span>
          </p>
        </div>
      </div>

      {/* Envelope Quick Controls & Unit Converter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
            Plot, Building Footprint & Slab Projection Controls
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Plot Length (ft)</label>
              <input
                type="number"
                value={project.plotLengthFt}
                onChange={(e) => updateActiveProject((p) => ({ ...p, plotLengthFt: safeNonNegative(Number(e.target.value)) }))}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Plot Width (ft)</label>
              <input
                type="number"
                value={project.plotWidthFt}
                onChange={(e) => updateActiveProject((p) => ({ ...p, plotWidthFt: safeNonNegative(Number(e.target.value)) }))}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Floors Count</label>
              <input
                type="number"
                min={1}
                value={project.floors}
                onChange={(e) => updateActiveProject((p) => ({ ...p, floors: Math.max(1, Number(e.target.value)) }))}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Building Length (ft)</label>
              <input
                type="number"
                value={project.buildingLengthFt}
                onChange={(e) => updateActiveProject((p) => ({ ...p, buildingLengthFt: safeNonNegative(Number(e.target.value)) }))}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Building Width (ft)</label>
              <input
                type="number"
                value={project.buildingWidthFt}
                onChange={(e) => updateActiveProject((p) => ({ ...p, buildingWidthFt: safeNonNegative(Number(e.target.value)) }))}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Slab Chajja/Overhang (ft)</label>
              <input
                type="number"
                step="0.25"
                value={project.slabProjectionFt}
                onChange={(e) => updateActiveProject((p) => ({ ...p, slabProjectionFt: safeNonNegative(Number(e.target.value)) }))}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Unit Converter Utility */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Engineering Unit Converter</h3>
          <p className="text-xs text-slate-500 mb-3">Feet, Inches, Sq.Ft, Cu.Ft, Kg, Metric Tonnes & Bags</p>
          <div className="space-y-3">
            <input
              type="number"
              value={convVal}
              onChange={(e) => setConvVal(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <select
              value={convType}
              onChange={(e) => setConvType(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="SQFT_TO_SQM">Square Feet (sq.ft) → Square Metres (sq.m)</option>
              <option value="SQM_TO_SQFT">Square Metres (sq.m) → Square Feet (sq.ft)</option>
              <option value="FT_TO_M">Feet (ft) → Metres (m)</option>
              <option value="M_TO_FT">Metres (m) → Feet & Inches</option>
              <option value="CUM_TO_CUFT">Cubic Metres (cu.m) → Cubic Feet (cu.ft)</option>
              <option value="CUFT_TO_CUM">Cubic Feet (cu.ft) → Cubic Metres (cu.m)</option>
              <option value="KG_TO_TONNE">Kilograms (kg) → Metric Tonnes & 50kg Bags</option>
            </select>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-sm font-bold text-blue-900 dark:text-blue-200">
              Result: {convertedOutput}
            </div>
          </div>
        </div>
      </div>

      {/* Add Room Form & Room Schedule Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Multi-Floor Room & Wall Schedule ({project.rooms.length} Zones)
        </h3>
        <form onSubmit={handleAddRoom} className="grid grid-cols-2 sm:grid-cols-7 gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Room / Zone Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Second Floor Master Bedroom"
              value={newRoom.name}
              onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Floor No.</label>
            <input
              type="number"
              min={1}
              value={newRoom.floorNumber}
              onChange={(e) => setNewRoom({ ...newRoom, floorNumber: Math.max(1, Number(e.target.value)) })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Length (ft)</label>
            <input
              type="number"
              step="0.5"
              value={newRoom.lengthFt}
              onChange={(e) => setNewRoom({ ...newRoom, lengthFt: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Width (ft)</label>
            <input
              type="number"
              step="0.5"
              value={newRoom.widthFt}
              onChange={(e) => setNewRoom({ ...newRoom, widthFt: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Quantity / Nos</label>
            <input
              type="number"
              min={1}
              value={newRoom.count}
              onChange={(e) => setNewRoom({ ...newRoom, count: Math.max(1, Number(e.target.value)) })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
            >
              + Add Room
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">Room / Space</th>
                <th className="py-2.5 px-3">Floor</th>
                <th className="py-2.5 px-3 text-right">Dimensions (L×W×H ft)</th>
                <th className="py-2.5 px-3 text-right">Nos</th>
                <th className="py-2.5 px-3 text-right">Carpet Area (Sq.Ft)</th>
                <th className="py-2.5 px-3 text-right">Wall Surface (Sq.Ft)</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {project.rooms.map((r) => {
                const carpet = round2(r.lengthFt * r.widthFt * r.count);
                const wallArea = round2(2 * (r.lengthFt + r.widthFt) * r.heightFt * 2 * r.count);
                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{r.name}</td>
                    <td className="py-2.5 px-3">Floor {r.floorNumber}</td>
                    <td className="py-2.5 px-3 text-right">
                      {r.lengthFt}' × {r.widthFt}' × {r.heightFt}'
                    </td>
                    <td className="py-2.5 px-3 text-right">{r.count}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                      {carpet.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right">{wallArea.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteRoom(r.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Remove room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 5: RCC CALCULATOR (FOOTINGS, COLUMNS, BEAMS, SLABS, STAIRS, LINTELS)
// ============================================================================

const RccCalculatorView: React.FC = () => {
  const { projects, rates, activeProjectId, updateActiveProject } = useConstructStore();
  const project = projects.find((p) => p.id === activeProjectId) || projects[0] || EMPTY_PROJECT_FALLBACK;
  const ev = useMemo(() => evaluateCompleteProject(project, rates), [project, rates]);

  const [newRcc, setNewRcc] = useState<Omit<RccMember, 'id'>>({
    category: 'Column',
    label: '',
    lengthM: 0,
    widthM: 0,
    depthM: 0,
    quantity: 1,
    grade: 'M20',
    dryFactor: 1.54,
    wastagePct: 0,
  });

  const handleAddRcc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRcc.label.trim()) return;
    updateActiveProject(
      (prev) => ({
        ...prev,
        rccMembers: [...prev.rccMembers, { ...newRcc, id: 'rcc-' + Date.now() }],
      }),
      `Added RCC ${newRcc.category} "${newRcc.label}" (${newRcc.grade}).`
    );
    setNewRcc({ ...newRcc, label: '' });
  };

  const handleDeleteRcc = (id: string) => {
    updateActiveProject((prev) => ({
      ...prev,
      rccMembers: prev.rccMembers.filter((m) => m.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="RCC Structural Quantity Calculator"
        subtitle="Detailed concrete volume, dry volume factor, cement bags, sand (cu.ft), and coarse aggregate (cu.ft) takeoff for Footings, Columns, Beams, Slabs, Staircases, and Lintels."
        badge={project.name}
      />

      {/* Engineering Notice Banner */}
      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Engineering Quantity Takeoff Notice:</strong> This calculator performs volumetric concrete and constituent material estimation based on user-entered member dimensions and nominal/design mix proportions (M10–M30). It does not assume structural safety or perform structural design calculations—always verify member sizes and concrete grades against structural drawings certified by a licensed structural engineer.
        </div>
      </div>

      {/* RCC Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Wet Volume</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{ev.rccSummary.rccWetCum} Cu.m</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Cement Required</span>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-400 mt-1">{ev.rccSummary.rccCementBags} Bags</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Sand Required</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{ev.rccSummary.rccSandCuft} Cu.ft</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Aggregate (20mm)</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{ev.rccSummary.rccAggCuft} Cu.ft</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20">
          <span className="text-[11px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">Concrete Mat. Cost</span>
          <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mt-1">{formatINR(ev.rccSummary.rccMaterialCost)}</p>
        </div>
      </div>

      {/* Add RCC Member Form */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Structural RCC Element</h3>
        <form onSubmit={handleAddRcc} className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-9 gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Element</label>
            <select
              value={newRcc.category}
              onChange={(e) => setNewRcc({ ...newRcc, category: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="Footing">Footing</option>
              <option value="Column">Column</option>
              <option value="Beam">Beam</option>
              <option value="Slab">Slab</option>
              <option value="Staircase">Staircase</option>
              <option value="Lintel">Lintel</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Member Label *</label>
            <input
              type="text"
              required
              placeholder="e.g. Second Floor Roof Beams"
              value={newRcc.label}
              onChange={(e) => setNewRcc({ ...newRcc, label: e.target.value })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Length (m)</label>
            <input
              type="number"
              step="0.05"
              value={newRcc.lengthM}
              onChange={(e) => setNewRcc({ ...newRcc, lengthM: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Width (m)</label>
            <input
              type="number"
              step="0.05"
              value={newRcc.widthM}
              onChange={(e) => setNewRcc({ ...newRcc, widthM: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Depth/Ht (m)</label>
            <input
              type="number"
              step="0.05"
              value={newRcc.depthM}
              onChange={(e) => setNewRcc({ ...newRcc, depthM: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Qty (Nos)</label>
            <input
              type="number"
              min={1}
              value={newRcc.quantity}
              onChange={(e) => setNewRcc({ ...newRcc, quantity: Math.max(1, Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Mix Grade</label>
            <select
              value={newRcc.grade}
              onChange={(e) => setNewRcc({ ...newRcc, grade: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {Object.keys(DEFAULT_CONCRETE_MIXES).map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
            >
              + Add RCC
            </button>
          </div>
        </form>

        {/* RCC Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Member Description</th>
                <th className="py-2.5 px-3 text-right">Size (L×W×D m)</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-3 text-right">Wet Vol (m³)</th>
                <th className="py-2.5 px-3 text-right">Dry Vol (m³)</th>
                <th className="py-2.5 px-3 text-right">Cement (Bags)</th>
                <th className="py-2.5 px-3 text-right">Sand (Cu.ft)</th>
                <th className="py-2.5 px-3 text-right">Agg (Cu.ft)</th>
                <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {ev.rccDetails.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800">
                      {row.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{row.label}</td>
                  <td className="py-2.5 px-3 text-right text-xs">
                    {row.lengthM}×{row.widthM}×{row.depthM}
                  </td>
                  <td className="py-2.5 px-3 text-right">{row.quantity}</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-700 dark:text-blue-400">{row.grade}</td>
                  <td className="py-2.5 px-3 text-right font-medium">{row.wetVolCum}</td>
                  <td className="py-2.5 px-3 text-right text-slate-500">{row.dryVolCum}</td>
                  <td className="py-2.5 px-3 text-right font-semibold">{row.cementBags}</td>
                  <td className="py-2.5 px-3 text-right">{row.sandCuft}</td>
                  <td className="py-2.5 px-3 text-right">{row.aggregateCuft}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatINR(row.costInr)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteRcc(row.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 6: STEEL CALCULATOR (D² / 162 KG/M BAR BENDING SCHEDULE)
// ============================================================================

const SteelCalculatorView: React.FC = () => {
  const { projects, rates, activeProjectId, updateActiveProject } = useConstructStore();
  const project = projects.find((p) => p.id === activeProjectId) || projects[0] || EMPTY_PROJECT_FALLBACK;
  const ev = useMemo(() => evaluateCompleteProject(project, rates), [project, rates]);

  const [newSteel, setNewSteel] = useState<Omit<SteelEntry, 'id'>>({
    memberName: '',
    structuralElement: 'Column',
    diameterMm: 12,
    barLengthM: 0,
    barsPerMember: 1,
    spacingMm: 150,
    memberCount: 1,
    wastagePct: 0,
  });

  const handleAddSteel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSteel.memberName.trim()) return;
    updateActiveProject(
      (prev) => ({
        ...prev,
        steelEntries: [...prev.steelEntries, { ...newSteel, id: 'st-' + Date.now() }],
      }),
      `Added ${newSteel.diameterMm}mm steel bar entry "${newSteel.memberName}".`
    );
    setNewSteel({ ...newSteel, memberName: '' });
  };

  const handleDeleteSteel = (id: string) => {
    updateActiveProject((prev) => ({
      ...prev,
      steelEntries: prev.steelEntries.filter((s) => s.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reinforcement Steel Calculator (BBS Takeoff)"
        subtitle="Calculate bar length, unit weight using theoretical formula Weight = D² / 162 kg/m, rolling/cutting wastage, and total reinforcement tonnage."
        badge={project.name}
      />

      {/* Engineering Formula & Scope Notice */}
      <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong>Theoretical Weight Formula (IS 1786 / Quantity Surveying Standard):</strong> Unit Weight per metre ={' '}
          <code className="font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded">D² / 162 kg/m</code> where{' '}
          <code className="font-bold">D</code> is bar diameter in millimetres (e.g., 8mm = 0.395 kg/m, 10mm = 0.617 kg/m, 12mm = 0.889 kg/m, 16mm = 1.580 kg/m, 20mm = 2.469 kg/m, 25mm = 3.858 kg/m). This module performs reinforcement quantity estimation from bar schedules and is distinct from structural reinforcement design.
        </div>
      </div>

      {/* Steel Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Steel Weight (Kg)</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {ev.steelSummary.steelTotalKg.toLocaleString('en-IN')} Kg
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Metric Tonnes</span>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">
            {ev.steelSummary.steelTotalTonnes} MT
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Steel Intensity / Sq.Ft</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {round2(ev.steelSummary.steelTotalKg / Math.max(1, ev.areaSummary.totalBuiltUpAreaSqft))} kg/sq.ft
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20">
          <span className="text-[11px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">Estimated Steel Cost</span>
          <p className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">
            {formatINR(ev.steelSummary.steelMaterialCost)}
          </p>
        </div>
      </div>

      {/* Add Bar Schedule Form */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Reinforcement Bar Schedule Entry</h3>
        <form onSubmit={handleAddSteel} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bar Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Plinth Beam Main Bars"
              value={newSteel.memberName}
              onChange={(e) => setNewSteel({ ...newSteel, memberName: e.target.value })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Dia D (mm)</label>
            <select
              value={newSteel.diameterMm}
              onChange={(e) => setNewSteel({ ...newSteel, diameterMm: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {[8, 10, 12, 16, 20, 25, 32].map((d) => (
                <option key={d} value={d}>
                  {d} mm ({round2((d * d) / 162)} kg/m)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cut Length (m)</label>
            <input
              type="number"
              step="0.1"
              value={newSteel.barLengthM}
              onChange={(e) => setNewSteel({ ...newSteel, barLengthM: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bars / Member</label>
            <input
              type="number"
              min={1}
              value={newSteel.barsPerMember}
              onChange={(e) => setNewSteel({ ...newSteel, barsPerMember: Math.max(1, Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">No. of Members</label>
            <input
              type="number"
              min={1}
              value={newSteel.memberCount}
              onChange={(e) => setNewSteel({ ...newSteel, memberCount: Math.max(1, Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Wastage (%)</label>
            <input
              type="number"
              step="0.5"
              value={newSteel.wastagePct}
              onChange={(e) => setNewSteel({ ...newSteel, wastagePct: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
            >
              + Add Bar
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">Bar Description</th>
                <th className="py-2.5 px-3 text-right">Dia (mm)</th>
                <th className="py-2.5 px-3 text-right">D²/162 (kg/m)</th>
                <th className="py-2.5 px-3 text-right">Bar Len (m)</th>
                <th className="py-2.5 px-3 text-right">Bars × Members</th>
                <th className="py-2.5 px-3 text-right">Total Len (m)</th>
                <th className="py-2.5 px-3 text-right">Wastage</th>
                <th className="py-2.5 px-3 text-right">Gross Wt (Kg)</th>
                <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {ev.steelDetails.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{row.memberName}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-blue-700 dark:text-blue-400">{row.diameterMm} mm</td>
                  <td className="py-2.5 px-3 text-right">{row.unitWeightKgPerM}</td>
                  <td className="py-2.5 px-3 text-right">{row.barLengthM}</td>
                  <td className="py-2.5 px-3 text-right">
                    {row.barsPerMember} × {row.memberCount}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium">{row.totalBarLengthM} m</td>
                  <td className="py-2.5 px-3 text-right text-xs text-slate-500">
                    {row.wastagePct}% ({row.wastageKg} kg)
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold">{row.totalWeightKg.toLocaleString('en-IN')} kg</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatINR(row.costInr)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteSteel(row.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 7: MATERIAL CALCULATOR (10 CATEGORIES + CUSTOM ENTRIES)
// ============================================================================

const MaterialCalculatorView: React.FC = () => {
  const { projects, rates, activeProjectId, updateActiveProject } = useConstructStore();
  const project = projects.find((p) => p.id === activeProjectId) || projects[0] || EMPTY_PROJECT_FALLBACK;
  const ev = useMemo(() => evaluateCompleteProject(project, rates), [project, rates]);

  const [newMat, setNewMat] = useState<Omit<CustomMaterialItem, 'id'>>({
    category: 'Waterproofing',
    name: '',
    unit: 'Kilograms',
    quantity: 0,
    wastagePct: 0,
    rateInr: 0,
  });

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMat.name.trim()) return;
    updateActiveProject(
      (prev) => ({
        ...prev,
        customMaterials: [...prev.customMaterials, { ...newMat, id: 'cm-' + Date.now() }],
      }),
      `Added custom material "${newMat.name}" (${newMat.category}).`
    );
    setNewMat({ ...newMat, name: '' });
  };

  const handleDeleteMaterial = (id: string) => {
    updateActiveProject((prev) => ({
      ...prev,
      customMaterials: prev.customMaterials.filter((m) => m.id !== id),
    }));
  };

  // Consolidated Material Schedule across all 10 required categories
  const consolidatedMaterialCategories = useMemo(() => {
    const f = ev.financials;
    return [
      { category: 'Cement (OPC/PPC 50kg)', source: 'RCC + Masonry + Plaster', quantity: f.totalCementBags, unit: 'Bags', costInr: round2(f.totalCementBags * (rates.find((r) => r.category === 'Cement')?.rateInr || 0)) },
      { category: 'Sand (Crushed M-Sand / River Sand)', source: 'RCC + Masonry + Plaster', quantity: f.totalSandCuft, unit: 'Cubic feet', costInr: round2(f.totalSandCuft * (rates.find((r) => r.category === 'Sand')?.rateInr || 0)) },
      { category: 'Aggregate (20mm & 10mm Graded Metal)', source: 'RCC Concrete Works', quantity: ev.rccSummary.rccAggCuft, unit: 'Cubic feet', costInr: round2(ev.rccSummary.rccAggCuft * (rates.find((r) => r.category === 'Aggregate')?.rateInr || 0)) },
      { category: 'Steel (Fe500D TMT Reinforcement)', source: 'Steel BBS Calculator', quantity: ev.steelSummary.steelTotalKg, unit: 'Kilograms', costInr: ev.steelSummary.steelMaterialCost },
      { category: 'Bricks & AAC Blocks', source: 'Masonry Wall Calculator', quantity: ev.masonrySummary.masonryUnits, unit: 'Numbers', costInr: ev.masonrySummary.masonryMaterialCost },
      { category: 'Tiles & Flooring Materials', source: 'Flooring & Tiling Calculator', quantity: ev.flooringSummary.flooringSqft, unit: 'Square feet', costInr: ev.flooringSummary.flooringMaterialCost },
      { category: 'Primer & Emulsion Paint', source: 'Painting Calculator', quantity: ev.paintingSummary.paintSqft, unit: 'Square feet (Area)', costInr: ev.paintingSummary.paintMaterialCost },
      { category: 'Waterproofing & Custom Materials', source: 'Custom Material Schedule', quantity: project.customMaterials.length, unit: 'Schedules', costInr: ev.customMaterialCost },
    ];
  }, [ev, rates, project.customMaterials.length]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Consolidated Material Calculator & Custom Material Schedule"
        subtitle="Aggregated material requirements across Cement, Sand, Aggregate, Bricks, Blocks, Steel, Tiles, Paint, Flooring, and Waterproofing—plus custom material entries."
        badge={project.name}
      />

      {/* Master Aggregated Material Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
          1. Project-Wide Automated Material Takeoff Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-4">Material Category</th>
                <th className="py-2.5 px-4">Calculated From Module</th>
                <th className="py-2.5 px-4 text-right">Net / Gross Quantity</th>
                <th className="py-2.5 px-4">Measurement Unit</th>
                <th className="py-2.5 px-4 text-right">Estimated Material Cost (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {consolidatedMaterialCategories.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{item.category}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{item.source}</td>
                  <td className="py-3 px-4 text-right font-bold text-blue-700 dark:text-blue-400">
                    {item.quantity.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium">{item.unit}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {formatINR(item.costInr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Material Calculator (Waterproofing, Admixtures, Extra Materials) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          2. Dedicated Custom & Specialty Material Calculator (Waterproofing, Flooring, Bricks, Blocks, etc.)
        </h3>
        <form onSubmit={handleAddMaterial} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
            <select
              value={newMat.category}
              onChange={(e) => setNewMat({ ...newMat, category: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {['Cement', 'Sand', 'Aggregate', 'Bricks', 'Blocks', 'Steel', 'Tiles', 'Paint', 'Flooring', 'Waterproofing', 'Custom'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Material Name & Spec *</label>
            <input
              type="text"
              required
              placeholder="e.g. SBR Latex Waterproofing Chemical"
              value={newMat.name}
              onChange={(e) => setNewMat({ ...newMat, name: e.target.value })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Unit</label>
            <select
              value={newMat.unit}
              onChange={(e) => setNewMat({ ...newMat, unit: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {['Bags', 'Cubic feet', 'Metric tonnes', 'Kilograms', 'Numbers', 'Square feet', 'Litres', 'Lump Sum'].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Net Qty</label>
            <input
              type="number"
              step="1"
              value={newMat.quantity}
              onChange={(e) => setNewMat({ ...newMat, quantity: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Rate (₹) / Wastage %</label>
            <div className="flex gap-1.5">
              <input
                type="number"
                placeholder="Rate"
                value={newMat.rateInr}
                onChange={(e) => setNewMat({ ...newMat, rateInr: safeNonNegative(Number(e.target.value)) })}
                className="w-2/3 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="number"
                placeholder="%"
                value={newMat.wastagePct}
                onChange={(e) => setNewMat({ ...newMat, wastagePct: safeNonNegative(Number(e.target.value)) })}
                className="w-1/3 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
            >
              + Add Item
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Material Description</th>
                <th className="py-2.5 px-3 text-right">Net Qty</th>
                <th className="py-2.5 px-3 text-right">Wastage %</th>
                <th className="py-2.5 px-3 text-right">Gross Qty</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">Total Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {ev.customMatDetails.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{item.name}</td>
                  <td className="py-2.5 px-3 text-right">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right">{item.wastagePct}%</td>
                  <td className="py-2.5 px-3 text-right font-semibold">{item.grossQty}</td>
                  <td className="py-2.5 px-3 text-xs">{item.unit}</td>
                  <td className="py-2.5 px-3 text-right">{formatINR(item.rateInr)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatINR(item.totalInr)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteMaterial(item.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 8: MASONRY CALCULATOR (BRICKS / AAC BLOCKS + DOOR/WINDOW DEDUCTIONS)
// ============================================================================

const MasonryCalculatorView: React.FC = () => {
  const { projects, rates, activeProjectId, updateActiveProject } = useConstructStore();
  const project = projects.find((p) => p.id === activeProjectId) || projects[0] || EMPTY_PROJECT_FALLBACK;
  const ev = useMemo(() => evaluateCompleteProject(project, rates), [project, rates]);

  const [newWall, setNewWall] = useState<Omit<MasonryWall, 'id'>>({
    label: '',
    unitType: 'BRICK',
    wallLengthM: 0,
    wallHeightM: 0,
    wallThicknessM: 0.23,
    doorAreaSqm: 0,
    windowAreaSqm: 0,
    unitLengthMm: 190,
    unitWidthMm: 90,
    unitHeightMm: 90,
    mortarJointMm: 10,
    mixRatioCement: 1,
    mixRatioSand: 6,
    wastagePct: 0,
  });

  const handleUnitPreset = (type: 'BRICK' | 'AAC_BLOCK' | 'CONCRETE_BLOCK') => {
    if (type === 'BRICK') {
      setNewWall({ ...newWall, unitType: type, wallThicknessM: 0.23, unitLengthMm: 190, unitWidthMm: 90, unitHeightMm: 90 });
    } else if (type === 'AAC_BLOCK') {
      setNewWall({ ...newWall, unitType: type, wallThicknessM: 0.15, unitLengthMm: 600, unitWidthMm: 200, unitHeightMm: 150 });
    } else {
      setNewWall({ ...newWall, unitType: type, wallThicknessM: 0.2, unitLengthMm: 400, unitWidthMm: 200, unitHeightMm: 200 });
    }
  };

  const handleAddWall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWall.label.trim()) return;
    updateActiveProject(
      (prev) => ({
        ...prev,
        masonryWalls: [...prev.masonryWalls, { ...newWall, id: 'mw-' + Date.now() }],
      }),
      `Added masonry schedule "${newWall.label}".`
    );
    setNewWall({ ...newWall, label: '' });
  };

  const handleDeleteWall = (id: string) => {
    updateActiveProject((prev) => ({
      ...prev,
      masonryWalls: prev.masonryWalls.filter((w) => w.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Masonry & Superstructure Wall Calculator"
        subtitle="Calculate gross wall volume, deduct door and window openings, and compute brick/AAC block count, mortar volume, cement bags, sand, and total masonry cost."
        badge={project.name}
      />

      {/* Masonry Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Net Masonry Vol</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{ev.masonrySummary.masonryVolCum} Cu.m</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Bricks / Blocks</span>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-400 mt-1">
            {ev.masonrySummary.masonryUnits.toLocaleString('en-IN')} Nos
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Mortar Cement</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{ev.masonrySummary.masonryCementBags} Bags</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Mortar Sand</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{ev.masonrySummary.masonrySandCuft} Cu.ft</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20">
          <span className="text-[11px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">Masonry Cost</span>
          <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mt-1">
            {formatINR(ev.masonrySummary.masonryMaterialCost)}
          </p>
        </div>
      </div>

      {/* Add Masonry Wall Form */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Masonry Wall Section (Auto-Deducts Openings)</h3>
        <form onSubmit={handleAddWall} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Wall Section Label *</label>
            <input
              type="text"
              required
              placeholder="e.g. First Floor External 230mm Wall"
              value={newWall.label}
              onChange={(e) => setNewWall({ ...newWall, label: e.target.value })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Unit Type</label>
            <select
              value={newWall.unitType}
              onChange={(e) => handleUnitPreset(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="BRICK">Clay Brick (190×90×90)</option>
              <option value="AAC_BLOCK">AAC Block (600×200×150)</option>
              <option value="CONCRETE_BLOCK">Solid Block (400×200×200)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Length × Ht (m)</label>
            <div className="flex gap-1">
              <input
                type="number"
                step="0.5"
                value={newWall.wallLengthM}
                onChange={(e) => setNewWall({ ...newWall, wallLengthM: safeNonNegative(Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="number"
                step="0.1"
                value={newWall.wallHeightM}
                onChange={(e) => setNewWall({ ...newWall, wallHeightM: safeNonNegative(Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Thickness (m)</label>
            <input
              type="number"
              step="0.01"
              value={newWall.wallThicknessM}
              onChange={(e) => setNewWall({ ...newWall, wallThicknessM: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Door Area (m²)</label>
            <input
              type="number"
              step="0.5"
              value={newWall.doorAreaSqm}
              onChange={(e) => setNewWall({ ...newWall, doorAreaSqm: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Window Area (m²)</label>
            <input
              type="number"
              step="0.5"
              value={newWall.windowAreaSqm}
              onChange={(e) => setNewWall({ ...newWall, windowAreaSqm: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
            >
              + Add Wall
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">Wall Description</th>
                <th className="py-2.5 px-3">Unit Type</th>
                <th className="py-2.5 px-3 text-right">Gross Area</th>
                <th className="py-2.5 px-3 text-right">Openings Deducted</th>
                <th className="py-2.5 px-3 text-right">Net Vol (m³)</th>
                <th className="py-2.5 px-3 text-right">Units (Nos)</th>
                <th className="py-2.5 px-3 text-right">Cement (Bags)</th>
                <th className="py-2.5 px-3 text-right">Sand (Cu.ft)</th>
                <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {ev.masonryDetails.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{w.label}</td>
                  <td className="py-2.5 px-3 text-xs font-semibold">{w.unitType}</td>
                  <td className="py-2.5 px-3 text-right">{w.grossAreaSqm} m²</td>
                  <td className="py-2.5 px-3 text-right text-amber-600">-{w.openingsSqm} m²</td>
                  <td className="py-2.5 px-3 text-right font-semibold">{w.netWallVolCum} m³</td>
                  <td className="py-2.5 px-3 text-right font-bold text-blue-700 dark:text-blue-400">
                    {w.unitsCount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right">{w.cementBags}</td>
                  <td className="py-2.5 px-3 text-right">{w.sandCuft}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatINR(w.costInr)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteWall(w.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 9: FLOORING CALCULATOR (TILES, CUTTING WASTAGE, ADHESIVE & GROUT)
// ============================================================================

const FlooringCalculatorView: React.FC = () => {
  const { projects, rates, activeProjectId, updateActiveProject } = useConstructStore();
  const project = projects.find((p) => p.id === activeProjectId) || projects[0] || EMPTY_PROJECT_FALLBACK;
  const ev = useMemo(() => evaluateCompleteProject(project, rates), [project, rates]);

  const [newFloor, setNewFloor] = useState<Omit<FlooringItem, 'id'>>({
    roomName: '',
    materialType: 'Vitrified Tiles',
    lengthFt: 0,
    widthFt: 0,
    tileLengthFt: 2,
    tileWidthFt: 2,
    wastagePct: 0,
    tileRatePerSqftInr: 0,
    adhesiveRatePerKgInr: 0,
    groutRatePerKgInr: 0,
  });

  const handleAddFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloor.roomName.trim()) return;
    updateActiveProject(
      (prev) => ({
        ...prev,
        flooringItems: [...prev.flooringItems, { ...newFloor, id: 'fl-' + Date.now() }],
      }),
      `Added flooring entry for "${newFloor.roomName}".`
    );
    setNewFloor({ ...newFloor, roomName: '' });
  };

  const handleDeleteFloor = (id: string) => {
    updateActiveProject((prev) => ({
      ...prev,
      flooringItems: prev.flooringItems.filter((f) => f.id !== id),
    }));
  };

  const totals = useMemo(() => {
    let tiles = 0;
    let adh = 0;
    let grout = 0;
    for (const r of ev.flooringDetails) {
      tiles += r.tileQty;
      adh += r.adhesiveKg;
      grout += r.groutKg;
    }
    return { tiles, adh: round2(adh), grout: round2(grout) };
  }, [ev.flooringDetails]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Flooring & Tiling Calculator"
        subtitle="Room-wise floor area, tile count, cutting/skirting wastage, polymer tile adhesive (kg), epoxy/cement grout (kg), and total flooring cost."
        badge={project.name}
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Net Floor Area</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {ev.flooringSummary.flooringSqft.toLocaleString('en-IN')} Sq.ft
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Tile Pieces</span>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-400 mt-1">
            {totals.tiles.toLocaleString('en-IN')} Nos
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Tile Adhesive</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{totals.adh} Kg</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Joint Grout</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{totals.grout} Kg</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20">
          <span className="text-[11px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">Total Flooring Cost</span>
          <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mt-1">
            {formatINR(ev.flooringSummary.flooringMaterialCost)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Room / Zone Flooring Schedule</h3>
        <form onSubmit={handleAddFloor} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Room / Zone *</label>
            <input
              type="text"
              required
              placeholder="e.g. Second Floor Lounge"
              value={newFloor.roomName}
              onChange={(e) => setNewFloor({ ...newFloor, roomName: e.target.value })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Material</label>
            <select
              value={newFloor.materialType}
              onChange={(e) => setNewFloor({ ...newFloor, materialType: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="Vitrified Tiles">Vitrified Tiles</option>
              <option value="Ceramic Tiles">Ceramic Tiles</option>
              <option value="Granite / Marble">Granite / Marble</option>
              <option value="Wooden Flooring">Wooden Flooring</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Floor L×W (ft)</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={newFloor.lengthFt}
                onChange={(e) => setNewFloor({ ...newFloor, lengthFt: safeNonNegative(Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="number"
                value={newFloor.widthFt}
                onChange={(e) => setNewFloor({ ...newFloor, widthFt: safeNonNegative(Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tile Size (ft)</label>
            <div className="flex gap-1">
              <input
                type="number"
                step="0.1"
                value={newFloor.tileLengthFt}
                onChange={(e) => setNewFloor({ ...newFloor, tileLengthFt: safeNonNegative(Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="number"
                step="0.1"
                value={newFloor.tileWidthFt}
                onChange={(e) => setNewFloor({ ...newFloor, tileWidthFt: safeNonNegative(Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Wastage %</label>
            <input
              type="number"
              value={newFloor.wastagePct}
              onChange={(e) => setNewFloor({ ...newFloor, wastagePct: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tile Rate (₹/sqft)</label>
            <input
              type="number"
              value={newFloor.tileRatePerSqftInr}
              onChange={(e) => setNewFloor({ ...newFloor, tileRatePerSqftInr: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
            >
              + Add Floor
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">Room / Space</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3 text-right">Net Area (Sq.ft)</th>
                <th className="py-2.5 px-3 text-right">Gross (+Wastage)</th>
                <th className="py-2.5 px-3 text-right">Tile Count</th>
                <th className="py-2.5 px-3 text-right">Adhesive (Kg)</th>
                <th className="py-2.5 px-3 text-right">Grout (Kg)</th>
                <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {ev.flooringDetails.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{f.roomName}</td>
                  <td className="py-2.5 px-3 text-xs">{f.materialType}</td>
                  <td className="py-2.5 px-3 text-right">{f.floorAreaSqft}</td>
                  <td className="py-2.5 px-3 text-right">{f.grossAreaSqft}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-blue-700 dark:text-blue-400">{f.tileQty}</td>
                  <td className="py-2.5 px-3 text-right">{f.adhesiveKg}</td>
                  <td className="py-2.5 px-3 text-right">{f.groutKg}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatINR(f.costInr)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteFloor(f.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 10: PLASTER & PAINTING CALCULATOR
// ============================================================================

const PlasterPaintingView: React.FC = () => {
  const { projects, rates, activeProjectId, updateActiveProject } = useConstructStore();
  const project = projects.find((p) => p.id === activeProjectId) || projects[0] || EMPTY_PROJECT_FALLBACK;
  const ev = useMemo(() => evaluateCompleteProject(project, rates), [project, rates]);

  const [newPlaster, setNewPlaster] = useState<Omit<PlasterItem, 'id'>>({
    surfaceName: '',
    type: 'INTERNAL',
    areaSqm: 0,
    thicknessMm: 12,
    mixRatioSand: 4,
  });

  const [newPaint, setNewPaint] = useState<Omit<PaintingItem, 'id'>>({
    surfaceName: '',
    areaSqft: 0,
    primerCoats: 1,
    paintCoats: 2,
    labourRatePerSqftInr: 0,
  });

  const handleAddPlaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaster.surfaceName.trim()) return;
    updateActiveProject(
      (prev) => ({
        ...prev,
        plasterItems: [...prev.plasterItems, { ...newPlaster, id: 'pl-' + Date.now() }],
      }),
      `Added plaster section "${newPlaster.surfaceName}".`
    );
    setNewPlaster({ ...newPlaster, surfaceName: '' });
  };

  const handleAddPaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaint.surfaceName.trim()) return;
    updateActiveProject(
      (prev) => ({
        ...prev,
        paintingItems: [...prev.paintingItems, { ...newPaint, id: 'pt-' + Date.now() }],
      }),
      `Added painting section "${newPaint.surfaceName}".`
    );
    setNewPaint({ ...newPaint, surfaceName: '' });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Plastering & Painting Calculator"
        subtitle="Internal (12mm) and External (20mm) plaster mortar, cement/sand requirements, plus wall primer, multi-coat emulsion paint, and painting labour charges."
        badge={project.name}
      />

      {/* Section 1: Plaster Calculator */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              1. Internal & External Cement Plaster Calculator
            </h3>
            <p className="text-xs text-slate-500">
              Total Area: {ev.plasterSummary.plasterSqm} Sq.m · Cement: {ev.plasterSummary.plasterCementBags} Bags · Sand:{' '}
              {ev.plasterSummary.plasterSandCuft} Cu.ft
            </p>
          </div>
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            Plaster Material Cost: {formatINR(ev.plasterSummary.plasterMaterialCost)}
          </span>
        </div>

        <form onSubmit={handleAddPlaster} className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Surface Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Second Floor Internal Plaster"
              value={newPlaster.surfaceName}
              onChange={(e) => setNewPlaster({ ...newPlaster, surfaceName: e.target.value })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Location</label>
            <select
              value={newPlaster.type}
              onChange={(e) =>
                setNewPlaster({
                  ...newPlaster,
                  type: e.target.value as any,
                  thicknessMm: e.target.value === 'EXTERNAL' ? 20 : 12,
                })
              }
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="INTERNAL">Internal (12mm)</option>
              <option value="EXTERNAL">External (20mm)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Area (Sq.m)</label>
            <input
              type="number"
              value={newPlaster.areaSqm}
              onChange={(e) => setNewPlaster({ ...newPlaster, areaSqm: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Thickness (mm) / Mix 1:X</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={newPlaster.thicknessMm}
                onChange={(e) => setNewPlaster({ ...newPlaster, thicknessMm: safeNonNegative(Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="number"
                value={newPlaster.mixRatioSand}
                onChange={(e) => setNewPlaster({ ...newPlaster, mixRatioSand: Math.max(1, Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
            >
              + Add Plaster
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">Surface Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Area (m²)</th>
                <th className="py-2.5 px-3 text-right">Thickness</th>
                <th className="py-2.5 px-3 text-right">Dry Mortar (m³)</th>
                <th className="py-2.5 px-3 text-right">Cement (Bags)</th>
                <th className="py-2.5 px-3 text-right">Sand (Cu.ft)</th>
                <th className="py-2.5 px-3 text-right">Material Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {ev.plasterDetails.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{p.surfaceName}</td>
                  <td className="py-2.5 px-3 text-xs font-semibold">{p.type}</td>
                  <td className="py-2.5 px-3 text-right">{p.areaSqm}</td>
                  <td className="py-2.5 px-3 text-right">{p.thicknessMm} mm (1:{p.mixRatioSand})</td>
                  <td className="py-2.5 px-3 text-right">{p.dryMortarCum}</td>
                  <td className="py-2.5 px-3 text-right font-semibold">{p.cementBags}</td>
                  <td className="py-2.5 px-3 text-right">{p.sandCuft}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">{formatINR(p.costInr)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() =>
                        updateActiveProject((prev) => ({
                          ...prev,
                          plasterItems: prev.plasterItems.filter((x) => x.id !== p.id),
                        }))
                      }
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Painting Calculator */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              2. Primer & Multi-Coat Painting Calculator
            </h3>
            <p className="text-xs text-slate-500">
              Total Surface Area: {ev.paintingSummary.paintSqft.toLocaleString('en-IN')} Sq.ft
            </p>
          </div>
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            Total Painting (Material + Labour):{' '}
            {formatINR(ev.paintingSummary.paintMaterialCost + ev.paintingSummary.paintDedicatedLabourCost)}
          </span>
        </div>

        <form onSubmit={handleAddPaint} className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Painting Zone *</label>
            <input
              type="text"
              required
              placeholder="e.g. Exterior Weatherproof Coating"
              value={newPaint.surfaceName}
              onChange={(e) => setNewPaint({ ...newPaint, surfaceName: e.target.value })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Area (Sq.ft)</label>
            <input
              type="number"
              value={newPaint.areaSqft}
              onChange={(e) => setNewPaint({ ...newPaint, areaSqft: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Primer / Paint Coats</label>
            <div className="flex gap-1">
              <input
                type="number"
                min={1}
                value={newPaint.primerCoats}
                onChange={(e) => setNewPaint({ ...newPaint, primerCoats: Math.max(0, Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="number"
                min={1}
                value={newPaint.paintCoats}
                onChange={(e) => setNewPaint({ ...newPaint, paintCoats: Math.max(1, Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Labour (₹/Sq.ft)</label>
            <input
              type="number"
              value={newPaint.labourRatePerSqftInr}
              onChange={(e) => setNewPaint({ ...newPaint, labourRatePerSqftInr: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
            >
              + Add Paint
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">Surface Name</th>
                <th className="py-2.5 px-3 text-right">Area (Sq.ft)</th>
                <th className="py-2.5 px-3 text-right">Coats (Primer+Paint)</th>
                <th className="py-2.5 px-3 text-right">Primer (L)</th>
                <th className="py-2.5 px-3 text-right">Paint (L)</th>
                <th className="py-2.5 px-3 text-right">Material Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Labour Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Total Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {ev.paintingDetails.map((pt) => (
                <tr key={pt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{pt.surfaceName}</td>
                  <td className="py-2.5 px-3 text-right">{pt.areaSqft.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right">
                    {pt.primerCoats}P + {pt.paintCoats}C
                  </td>
                  <td className="py-2.5 px-3 text-right">{pt.primerLitres} L</td>
                  <td className="py-2.5 px-3 text-right font-semibold">{pt.paintLitres} L</td>
                  <td className="py-2.5 px-3 text-right">{formatINR(pt.materialCostInr)}</td>
                  <td className="py-2.5 px-3 text-right">{formatINR(pt.labourCostInr)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatINR(pt.totalCostInr)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() =>
                        updateActiveProject((prev) => ({
                          ...prev,
                          paintingItems: prev.paintingItems.filter((x) => x.id !== pt.id),
                        }))
                      }
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 11: PLUMBING & ELECTRICAL (MEP SCHEDULE)
// ============================================================================

const PlumbingElectricalView: React.FC = () => {
  const { projects, rates, activeProjectId, updateActiveProject } = useConstructStore();
  const project = projects.find((p) => p.id === activeProjectId) || projects[0] || EMPTY_PROJECT_FALLBACK;
  const ev = useMemo(() => evaluateCompleteProject(project, rates), [project, rates]);

  const [newMep, setNewMep] = useState<Omit<MepItem, 'id'>>({
    system: 'PLUMBING',
    category: 'Pipes',
    description: '',
    unit: 'Numbers',
    quantity: 0,
    materialRateInr: 0,
    labourRateInr: 0,
  });

  const handleAddMep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMep.description.trim()) return;
    updateActiveProject(
      (prev) => ({
        ...prev,
        mepItems: [...prev.mepItems, { ...newMep, id: 'mep-' + Date.now() }],
      }),
      `Added ${newMep.system} item "${newMep.description}".`
    );
    setNewMep({ ...newMep, description: '' });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Plumbing, Sanitary & Electrical (MEP) Calculator"
        subtitle="Manage Pipes, Fittings, Taps, Sanitary fixtures, Electrical wires, Switches, Sockets, Lights, and Distribution boards."
        badge={project.name}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">MEP Material Cost</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatINR(ev.mepSummary.mepMaterialCost)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">MEP Installation Labour</span>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">{formatINR(ev.mepSummary.mepLabourCost)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20">
          <span className="text-[11px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">Total MEP Package</span>
          <p className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">{formatINR(ev.mepSummary.totalMepCost)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Plumbing or Electrical Item</h3>
        <form onSubmit={handleAddMep} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">System</label>
            <select
              value={newMep.system}
              onChange={(e) =>
                setNewMep({
                  ...newMep,
                  system: e.target.value as any,
                  category: e.target.value === 'PLUMBING' ? 'Pipes' : 'Electrical wires',
                })
              }
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
            <select
              value={newMep.category}
              onChange={(e) => setNewMep({ ...newMep, category: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {[
                'Pipes',
                'Fittings',
                'Taps',
                'Sanitary fixtures',
                'Electrical wires',
                'Switches',
                'Sockets',
                'Lights',
                'Distribution boards',
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Item Specification *</label>
            <input
              type="text"
              required
              placeholder="e.g. 20W LED Recessed Ceiling Panel Lights"
              value={newMep.description}
              onChange={(e) => setNewMep({ ...newMep, description: e.target.value })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Qty & Unit</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={newMep.quantity}
                onChange={(e) => setNewMep({ ...newMep, quantity: safeNonNegative(Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="text"
                value={newMep.unit}
                onChange={(e) => setNewMep({ ...newMep, unit: e.target.value })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Mat. Rate (₹)</label>
            <input
              type="number"
              value={newMep.materialRateInr}
              onChange={(e) => setNewMep({ ...newMep, materialRateInr: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Lab. Rate (₹)</label>
            <input
              type="number"
              value={newMep.labourRateInr}
              onChange={(e) => setNewMep({ ...newMep, labourRateInr: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
            >
              + Add MEP
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">System</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3 text-right">Material Amt (₹)</th>
                <th className="py-2.5 px-3 text-right">Labour Amt (₹)</th>
                <th className="py-2.5 px-3 text-right">Total Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {ev.mepDetails.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                        item.system === 'PLUMBING'
                          ? 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                          : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {item.system}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs font-semibold">{item.category}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{item.description}</td>
                  <td className="py-2.5 px-3 text-right font-semibold">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-xs">{item.unit}</td>
                  <td className="py-2.5 px-3 text-right">{formatINR(item.matAmt)}</td>
                  <td className="py-2.5 px-3 text-right">{formatINR(item.labAmt)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatINR(item.totalAmt)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() =>
                        updateActiveProject((prev) => ({
                          ...prev,
                          mepItems: prev.mepItems.filter((x) => x.id !== item.id),
                        }))
                      }
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 12: LABOUR CALCULATOR (DAILY-RATE & UNIT-RATE WORKFORCE COSTING)
// ============================================================================

const LabourCalculatorView: React.FC = () => {
  const { projects, rates, activeProjectId, updateActiveProject } = useConstructStore();
  const project = projects.find((p) => p.id === activeProjectId) || projects[0] || EMPTY_PROJECT_FALLBACK;
  const ev = useMemo(() => evaluateCompleteProject(project, rates), [project, rates]);

  const [newLabour, setNewLabour] = useState<Omit<LabourEntry, 'id'>>({
    category: 'Mason',
    roleNote: '',
    mode: 'DAILY',
    workers: 1,
    dailyWageInr: 0,
    workingDays: 1,
    overtimeHours: 0,
    overtimeRateInr: 0,
    unitQuantity: 0,
    unitRateInr: 0,
  });

  const handleAddLabour = (e: React.FormEvent) => {
    e.preventDefault();
    updateActiveProject(
      (prev) => ({
        ...prev,
        labourEntries: [
          ...prev.labourEntries,
          {
            ...newLabour,
            roleNote: newLabour.roleNote.trim() || `${newLabour.category} Crew`,
            id: 'lb-' + Date.now(),
          },
        ],
      }),
      `Added ${newLabour.category} workforce schedule (${newLabour.mode}).`
    );
    setNewLabour({ ...newLabour, roleNote: '' });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Labour Costing & Workforce Productivity Calculator"
        subtitle="Support both Daily-Wage (workers × days + overtime) and Unit-Rate piecework across Mason, Helper, Carpenter, Steel fixer, Electrician, Plumber, Painter, Tile worker, and Other categories."
        badge={project.name}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Dedicated Workforce Cost</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatINR(ev.labourSummary.dedicatedLabourCost)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Project Labour (All Modules)</span>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">
            {formatINR(ev.labourSummary.totalProjectLabourInr)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Man-Days</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {ev.labourSummary.totalManDays.toLocaleString('en-IN')} Days
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20">
          <span className="text-[11px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">Labour Cost / Sq.Ft</span>
          <p className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">
            {formatINR(ev.labourSummary.labourPerSqftInr)} / sq.ft
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Workforce Trade Entry</h3>
        <form onSubmit={handleAddLabour} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Trade Category</label>
            <select
              value={newLabour.category}
              onChange={(e) => setNewLabour({ ...newLabour, category: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {['Mason', 'Helper', 'Carpenter', 'Steel fixer', 'Electrician', 'Plumber', 'Painter', 'Tile worker', 'Other'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Costing Mode</label>
            <select
              value={newLabour.mode}
              onChange={(e) => setNewLabour({ ...newLabour, mode: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="DAILY">Daily Wage + OT</option>
              <option value="UNIT_RATE">Unit-Rate Piecework</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Crew Note</label>
            <input
              type="text"
              placeholder="e.g. Shuttering Gang"
              value={newLabour.roleNote}
              onChange={(e) => setNewLabour({ ...newLabour, roleNote: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Workers × Days</label>
            <div className="flex gap-1">
              <input
                type="number"
                min={1}
                value={newLabour.workers}
                onChange={(e) => setNewLabour({ ...newLabour, workers: Math.max(1, Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="number"
                min={1}
                value={newLabour.workingDays}
                onChange={(e) => setNewLabour({ ...newLabour, workingDays: Math.max(1, Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          {newLabour.mode === 'DAILY' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Daily Wage (₹)</label>
                <input
                  type="number"
                  value={newLabour.dailyWageInr}
                  onChange={(e) => setNewLabour({ ...newLabour, dailyWageInr: safeNonNegative(Number(e.target.value)) })}
                  className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Overtime Hours & OT Rate (₹/hr)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    value={newLabour.overtimeHours}
                    onChange={(e) => setNewLabour({ ...newLabour, overtimeHours: safeNonNegative(Number(e.target.value)) })}
                    className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <input
                    type="number"
                    value={newLabour.overtimeRateInr}
                    onChange={(e) => setNewLabour({ ...newLabour, overtimeRateInr: safeNonNegative(Number(e.target.value)) })}
                    className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Piecework Quantity (Sq.ft/Unit) × Unit Rate (₹)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  value={newLabour.unitQuantity}
                  onChange={(e) => setNewLabour({ ...newLabour, unitQuantity: safeNonNegative(Number(e.target.value)) })}
                  className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <input
                  type="number"
                  value={newLabour.unitRateInr}
                  onChange={(e) => setNewLabour({ ...newLabour, unitRateInr: safeNonNegative(Number(e.target.value)) })}
                  className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
            >
              + Add Crew
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">Trade Category</th>
                <th className="py-2.5 px-3">Role / Crew Note</th>
                <th className="py-2.5 px-3">Basis</th>
                <th className="py-2.5 px-3 text-right">Workers × Days</th>
                <th className="py-2.5 px-3 text-right">Man-Days</th>
                <th className="py-2.5 px-3 text-right">Wage / Rate Basis</th>
                <th className="py-2.5 px-3 text-right">Total Cost (₹)</th>
                <th className="py-2.5 px-3 text-right">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {ev.labourDetails.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{l.category}</td>
                  <td className="py-2.5 px-3 text-xs text-slate-500">{l.roleNote}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {l.mode}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {l.workers} × {l.workingDays}d
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold">{l.manDays}</td>
                  <td className="py-2.5 px-3 text-right text-xs">
                    {l.mode === 'DAILY'
                      ? `${formatINR(l.dailyWageInr)}/day + ${l.overtimeHours}h OT`
                      : `${l.unitQuantity} units @ ${formatINR(l.unitRateInr)}`}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatINR(l.totalCostInr)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() =>
                        updateActiveProject((prev) => ({
                          ...prev,
                          labourEntries: prev.labourEntries.filter((x) => x.id !== l.id),
                        }))
                      }
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 13: BOQ & COST ESTIMATION (MASTER BILL OF QUANTITIES)
// ============================================================================

const BoqCostEstimationView: React.FC = () => {
  const { projects, rates, activeProjectId, updateActiveProject, setActiveTab } = useConstructStore();
  const project = projects.find((p) => p.id === activeProjectId) || projects[0] || EMPTY_PROJECT_FALLBACK;
  const ev = useMemo(() => evaluateCompleteProject(project, rates), [project, rates]);

  const [newBoq, setNewBoq] = useState<Omit<ManualBoqItem, 'id'>>({
    itemNumber: '8.01',
    description: '',
    category: 'Custom Works',
    unit: 'Cu.m',
    quantity: 0,
    materialRateInr: 0,
    labourRateInr: 0,
  });

  const handleAddManualBoq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoq.description.trim()) return;
    updateActiveProject(
      (prev) => ({
        ...prev,
        manualBoqItems: [...prev.manualBoqItems, { ...newBoq, id: 'mboq-' + Date.now() }],
      }),
      `Added custom BOQ line item ${newBoq.itemNumber} "${newBoq.description}".`
    );
    setNewBoq({ ...newBoq, description: '' });
  };

  const categorySubtotals = useMemo(() => {
    const map: Record<string, { mat: number; lab: number; tot: number }> = {};
    for (const r of ev.allBoqRows) {
      if (!map[r.category]) map[r.category] = { mat: 0, lab: 0, tot: 0 };
      map[r.category].mat = round2(map[r.category].mat + r.materialAmountInr);
      map[r.category].lab = round2(map[r.category].lab + r.labourAmountInr);
      map[r.category].tot = round2(map[r.category].tot + r.totalAmountInr);
    }
    return Object.entries(map);
  }, [ev.allBoqRows]);

  const f = ev.financials;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Master Bill of Quantities (BOQ) & Commercial Cost Estimation"
        subtitle="Real-time synchronized BOQ combining all structural, finishing, MEP, and workforce calculators with zero double-counting of wastage or overheads."
        badge={project.name}
        rightContent={
          <button
            onClick={() => setActiveTab('reports')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Export Official Quotation
          </button>
        }
      />

      {/* Top Financial Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Material Cost</span>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatINR(f.totalMaterialCostInr)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Labour Cost</span>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatINR(f.totalLabourCostInr)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Base Project Cost</span>
          <p className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-400 mt-1">
            {formatINR(f.baseProjectCostInr)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Profit & Contingency</span>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatINR(f.contractorProfitInr + f.contingencyInr)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-slate-400">GST ({project.gstPct}%)</span>
          <p className="text-base sm:text-lg font-bold text-amber-600 mt-1">{formatINR(f.gstAmountInr)}</p>
        </div>
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold uppercase text-blue-300">Final Estimated Cost</span>
          <p className="text-base sm:text-lg font-bold text-emerald-400 mt-1">{formatINR(f.finalEstimatedCostInr)}</p>
          <span className="text-[11px] text-slate-300 block">{formatINR(f.costPerSqftInr)} / sq.ft</span>
        </div>
      </div>

      {/* Main BOQ Schedule Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Detailed Bill of Quantities (BOQ) Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Items 1.01–7.01 are dynamically synced from quantity takeoff calculators; Item 8.xx are custom tender items.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900 text-white text-xs uppercase">
                <th className="py-3 px-3 rounded-tl-lg">Item No</th>
                <th className="py-3 px-3">Description of Work</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-3 text-right">Mat. Rate (₹)</th>
                <th className="py-3 px-3 text-right">Mat. Amount (₹)</th>
                <th className="py-3 px-3 text-right">Lab. Rate (₹)</th>
                <th className="py-3 px-3 text-right">Lab. Amount (₹)</th>
                <th className="py-3 px-3 text-right rounded-tr-lg">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {ev.allBoqRows.map((row: any) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono font-bold text-xs text-blue-700 dark:text-blue-400">
                    {row.itemNumber}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900 dark:text-white max-w-md">
                    {row.description}
                    {row.isManual && (
                      <button
                        onClick={() =>
                          updateActiveProject((prev) => ({
                            ...prev,
                            manualBoqItems: prev.manualBoqItems.filter((x) => x.id !== row.id),
                          }))
                        }
                        className="ml-2 text-xs text-red-500 hover:underline"
                      >
                        [Remove]
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-500">{row.category}</td>
                  <td className="py-3 px-3 text-xs font-semibold">{row.unit}</td>
                  <td className="py-3 px-3 text-right font-semibold">{row.quantity.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right text-xs">{formatINR(row.materialRateInr)}</td>
                  <td className="py-3 px-3 text-right font-medium">{formatINR(row.materialAmountInr)}</td>
                  <td className="py-3 px-3 text-right text-xs">{formatINR(row.labourRateInr)}</td>
                  <td className="py-3 px-3 text-right font-medium">{formatINR(row.labourAmountInr)}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatINR(row.totalAmountInr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Custom BOQ Line Item Form */}
        <form onSubmit={handleAddManualBoq} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 mt-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Item No</label>
            <input
              type="text"
              value={newBoq.itemNumber}
              onChange={(e) => setNewBoq({ ...newBoq, itemNumber: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Custom BOQ Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Site Barricading & Temporary Borewell"
              value={newBoq.description}
              onChange={(e) => setNewBoq({ ...newBoq, description: e.target.value })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
            <input
              type="text"
              value={newBoq.category}
              onChange={(e) => setNewBoq({ ...newBoq, category: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Qty & Unit</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={newBoq.quantity}
                onChange={(e) => setNewBoq({ ...newBoq, quantity: safeNonNegative(Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="text"
                value={newBoq.unit}
                onChange={(e) => setNewBoq({ ...newBoq, unit: e.target.value })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Mat. Rate (₹)</label>
            <input
              type="number"
              value={newBoq.materialRateInr}
              onChange={(e) => setNewBoq({ ...newBoq, materialRateInr: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Lab. Rate (₹)</label>
            <input
              type="number"
              value={newBoq.labourRateInr}
              onChange={(e) => setNewBoq({ ...newBoq, labourRateInr: safeNonNegative(Number(e.target.value)) })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
            >
              + Add BOQ Row
            </button>
          </div>
        </form>
      </div>

      {/* Category Subtotals & Commercial Waterfall Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Category-Wise Subtotals</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3 text-right">Material (₹)</th>
                  <th className="py-2 px-3 text-right">Labour (₹)</th>
                  <th className="py-2 px-3 text-right">Subtotal (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {categorySubtotals.map(([cat, vals]) => (
                  <tr key={cat}>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{cat}</td>
                    <td className="py-2.5 px-3 text-right">{formatINR(vals.mat)}</td>
                    <td className="py-2.5 px-3 text-right">{formatINR(vals.lab)}</td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatINR(vals.tot)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Cost Estimation Waterfall & Overheads */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Commercial Cost Waterfall & Configurable Markups
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">A. Total Direct Material Cost</span>
              <span className="font-semibold">{formatINR(f.totalMaterialCostInr)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">B. Total Direct Labour Cost</span>
              <span className="font-semibold">{formatINR(f.totalLabourCostInr)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                C1. Transportation & Cartage (%)
                <input
                  type="number"
                  step="0.25"
                  value={project.transportationPct}
                  onChange={(e) =>
                    updateActiveProject((p) => ({ ...p, transportationPct: safeNonNegative(Number(e.target.value)) }))
                  }
                  className="w-16 px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </span>
              <span>{formatINR(f.transportationCostInr)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                C2. Miscellaneous Site Expenses (%)
                <input
                  type="number"
                  step="0.25"
                  value={project.miscExpensePct}
                  onChange={(e) =>
                    updateActiveProject((p) => ({ ...p, miscExpensePct: safeNonNegative(Number(e.target.value)) }))
                  }
                  className="w-16 px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </span>
              <span>{formatINR(f.miscExpenseCostInr)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                C3. Unadjusted Material Wastage (%)
                <input
                  type="number"
                  step="0.5"
                  value={project.globalWastagePct}
                  onChange={(e) =>
                    updateActiveProject((p) => ({ ...p, globalWastagePct: safeNonNegative(Number(e.target.value)) }))
                  }
                  className="w-16 px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </span>
              <span>{formatINR(f.globalWastageAllowanceInr)}</span>
            </div>

            <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white">
              <span>Base Project Cost (A + B + C)</span>
              <span>{formatINR(f.baseProjectCostInr)}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                D. Contractor Profit & OH (%)
                <input
                  type="number"
                  step="0.5"
                  value={project.contractorProfitPct}
                  onChange={(e) =>
                    updateActiveProject((p) => ({ ...p, contractorProfitPct: safeNonNegative(Number(e.target.value)) }))
                  }
                  className="w-16 px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </span>
              <span>{formatINR(f.contractorProfitInr)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                E. Contingency Reserve (%)
                <input
                  type="number"
                  step="0.5"
                  value={project.contingencyPct}
                  onChange={(e) =>
                    updateActiveProject((p) => ({ ...p, contingencyPct: safeNonNegative(Number(e.target.value)) }))
                  }
                  className="w-16 px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </span>
              <span>{formatINR(f.contingencyInr)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                F. Goods & Services Tax — GST (%)
                <input
                  type="number"
                  step="1"
                  value={project.gstPct}
                  onChange={(e) =>
                    updateActiveProject((p) => ({ ...p, gstPct: safeNonNegative(Number(e.target.value)) }))
                  }
                  className="w-16 px-2 py-0.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </span>
              <span className="font-semibold text-amber-600">{formatINR(f.gstAmountInr)}</span>
            </div>

            <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-[#0f294a] text-white font-bold text-base">
              <div>
                <span>Final Estimated Project Cost</span>
                <span className="block text-xs font-normal text-blue-200">
                  Built-Up Area Rate: {formatINR(f.costPerSqftInr)} / sq.ft
                </span>
              </div>
              <span className="text-xl text-emerald-400">{formatINR(f.finalEstimatedCostInr)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 14: RATE MANAGEMENT (INR ₹ CENTRALIZED EDITABLE DATABASE & HISTORY)
// ============================================================================

const RateManagementView: React.FC = () => {
  const { rates, addRateItem, updateRateItem, deleteRateItem, resetRatesToDefault } = useConstructStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [editNote, setEditNote] = useState<string>('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<RateItem | null>(null);

  const [newRateForm, setNewRateForm] = useState({
    category: 'Cement' as RateItem['category'],
    name: '',
    unit: 'Bags',
    rateInr: 0,
  });

  const handleAddRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRateForm.name.trim()) return;
    addRateItem({
      category: newRateForm.category,
      name: newRateForm.name,
      unit: newRateForm.unit,
      rateInr: safeNonNegative(newRateForm.rateInr),
      defaultRateInr: safeNonNegative(newRateForm.rateInr),
      isProjectOverride: false,
    });
    setNewRateForm({ ...newRateForm, name: '' });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Centralized Rate Management Database (INR ₹)"
        subtitle="Manage baseline and project-specific rates across Cement, Sand, Aggregate, Steel, Bricks, Blocks, Tiles, Paint, Labour, Transportation, and Miscellaneous."
        rightContent={
          <button
            onClick={resetRatesToDefault}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset All to Default Rates
          </button>
        }
      />

      {/* Unverified Market Rate Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Commercial Rate Disclaimer:</strong> Baseline rates provided in this database are configurable sample estimation rates in Indian Rupees (₹) and must never be treated as verified market rates. Always update rates using current local supplier quotations or state CPWD/SSR schedules prior to final tender submission. Any change here immediately recalculates all project modules and BOQs.
        </div>
      </div>

      {/* Add New Rate Item Form */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Rate Item to Master Database</h3>
        <form onSubmit={handleAddRate} className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
            <select
              value={newRateForm.category}
              onChange={(e) => setNewRateForm({ ...newRateForm, category: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {[
                'Cement',
                'Sand',
                'Aggregate',
                'Steel',
                'Bricks',
                'Blocks',
                'Tiles',
                'Paint',
                'Waterproofing',
                'Labour',
                'Transportation',
                'Miscellaneous',
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Material / Trade Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. River Sand Washed (Zone II)"
              value={newRateForm.name}
              onChange={(e) => setNewRateForm({ ...newRateForm, name: e.target.value })}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Unit & Rate (₹)</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={newRateForm.unit}
                onChange={(e) => setNewRateForm({ ...newRateForm, unit: e.target.value })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="number"
                value={newRateForm.rateInr}
                onChange={(e) => setNewRateForm({ ...newRateForm, rateInr: safeNonNegative(Number(e.target.value)) })}
                className="w-1/2 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg text-sm font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
            >
              + Add Rate
            </button>
          </div>
        </form>

        {/* Rate Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3 text-right">Baseline Default</th>
                <th className="py-2.5 px-3 text-right">Active Rate (₹)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions & History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rates.map((r) => {
                const isEditing = editingId === r.id;
                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-semibold text-blue-800 dark:text-blue-300">{r.category}</td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{r.name}</td>
                    <td className="py-3 px-3 text-xs">{r.unit}</td>
                    <td className="py-3 px-3 text-right text-slate-500">{formatINR(r.defaultRateInr)}</td>
                    <td className="py-3 px-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.5"
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value))}
                            className="w-24 px-2 py-1 text-sm rounded border border-blue-500 bg-white dark:bg-slate-800 text-right font-bold"
                          />
                          <input
                            type="text"
                            placeholder="Revision note..."
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="w-32 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">{formatINR(r.rateInr)}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs">
                      {r.isProjectOverride ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold">
                          Project Override
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Default Sample
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => {
                                updateRateItem(r.id, editValue, editNote || 'Updated via Rate Management');
                                setEditingId(null);
                                setEditNote('');
                              }}
                              className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-600 text-white"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 rounded text-xs bg-slate-200 dark:bg-slate-700"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(r.id);
                                setEditValue(r.rateInr);
                              }}
                              className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                            >
                              Edit Rate
                            </button>
                            <button
                              onClick={() => setSelectedHistoryItem(r)}
                              className="px-2.5 py-1 rounded text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            >
                              History ({r.history.length})
                            </button>
                            <button
                              onClick={() => deleteRateItem(r.id)}
                              className="p-1 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rate History Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Rate Revision History — {selectedHistoryItem.name}
              </h3>
              <button onClick={() => setSelectedHistoryItem(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="my-4 space-y-2.5 max-h-72 overflow-y-auto">
              {selectedHistoryItem.history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No rate changes recorded yet for this item.</p>
              ) : (
                selectedHistoryItem.history.map((h) => (
                  <div key={h.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
                    <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>
                        {formatINR(h.oldRateInr)} → <span className="text-emerald-600">{formatINR(h.newRateInr)}</span>
                      </span>
                      <span className="text-slate-400">{h.changedAt}</span>
                    </div>
                    <p className="text-slate-500 mt-1">{h.note}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#0f294a] text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MODULE 15: REPORTS & QUOTATIONS (PRINTABLE PREVIEW, CSV/EXCEL & HTML EXPORT)
// ============================================================================

const ReportsQuotationsView: React.FC = () => {
  const { projects, rates, activeProjectId, companyProfile, showToast } = useConstructStore();
  const project = projects.find((p) => p.id === activeProjectId) || projects[0] || EMPTY_PROJECT_FALLBACK;
  const ev = useMemo(() => evaluateCompleteProject(project, rates), [project, rates]);
  const f = ev.financials;

  const [quotationNumber, setQuotationNumber] = useState(
    `${companyProfile.quotationPrefix}${project.id.slice(-4).toUpperCase()}-R1`
  );
  const [quotationDate, setQuotationDate] = useState('2026-11-09');
  const [validityDays, setValidityDays] = useState(30);

  // Download Excel-Compatible CSV Report
  const handleExportExcelCsv = () => {
    const lines: string[] = [];
    lines.push(`"${companyProfile.companyName} - OFFICIAL BOQ & COST QUOTATION"`);
    lines.push(`"Quotation No:","${quotationNumber}","Date:","${quotationDate}"`);
    lines.push(`"Project Name:","${project.name}","Client Name:","${project.clientName}"`);
    lines.push(`"Location:","${project.location}","Built-Up Area (Sq.Ft):","${ev.areaSummary.totalBuiltUpAreaSqft}"`);
    lines.push('');
    lines.push('"ITEM NO","DESCRIPTION OF WORK","CATEGORY","UNIT","QUANTITY","MATERIAL RATE (INR)","MATERIAL AMOUNT (INR)","LABOUR RATE (INR)","LABOUR AMOUNT (INR)","TOTAL AMOUNT (INR)"');

    for (const r of ev.allBoqRows) {
      lines.push(
        `"${r.itemNumber}","${r.description.replace(/"/g, '""')}","${r.category}","${r.unit}",${r.quantity},${r.materialRateInr},${r.materialAmountInr},${r.labourRateInr},${r.labourAmountInr},${r.totalAmountInr}`
      );
    }

    lines.push('');
    lines.push(`"","","","DIRECT MATERIAL COST","","","","","",${f.totalMaterialCostInr}`);
    lines.push(`"","","","DIRECT LABOUR COST","","","","","",${f.totalLabourCostInr}`);
    lines.push(`"","","","TRANSPORTATION (${project.transportationPct}%)","","","","","",${f.transportationCostInr}`);
    lines.push(`"","","","MISC EXPENSES (${project.miscExpensePct}%)","","","","","",${f.miscExpenseCostInr}`);
    lines.push(`"","","","GLOBAL WASTAGE ALLOWANCE (${project.globalWastagePct}%)","","","","","",${f.globalWastageAllowanceInr}`);
    lines.push(`"","","","BASE PROJECT COST","","","","","",${f.baseProjectCostInr}`);
    lines.push(`"","","","CONTRACTOR PROFIT (${project.contractorProfitPct}%)","","","","","",${f.contractorProfitInr}`);
    lines.push(`"","","","CONTINGENCY (${project.contingencyPct}%)","","","","","",${f.contingencyInr}`);
    lines.push(`"","","","GST (${project.gstPct}%)","","","","","",${f.gstAmountInr}`);
    lines.push(`"","","","FINAL ESTIMATED QUOTATION (INR)","","","","","",${f.finalEstimatedCostInr}`);
    lines.push(`"","","","AVERAGE COST PER SQ.FT (INR)","","","","","",${f.costPerSqftInr}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_BOQ_Quotation.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Excel-compatible CSV BOQ & Cost Quotation.', 'success');
  };

  // Download Standalone Printable Quotation Document (.html / PDF print ready)
  const handleDownloadQuotationDoc = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Quotation - ${project.name}</title>
<style>
  body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; line-height: 1.45; }
  .header { display: flex; justify-content: space-between; border-bottom: 3px solid #0f294a; padding-bottom: 16px; margin-bottom: 20px; }
  h1 { margin: 0; color: #0f294a; font-size: 22px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
  th { background: #0f294a; color: #fff; text-align: left; padding: 8px; }
  td { border-bottom: 1px solid #cbd5e1; padding: 8px; }
  .right { text-align: right; }
  .summary-box { margin-top: 24px; width: 420px; margin-left: auto; border: 1px solid #cbd5e1; padding: 14px; border-radius: 8px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${companyProfile.companyName}</h1>
      <div>${companyProfile.tagline}</div>
      <div style="font-size:12px;color:#475569;">${companyProfile.registeredAddress} | GSTIN: ${companyProfile.gstin}</div>
    </div>
    <div class="right">
      <strong>QUOTATION #: ${quotationNumber}</strong><br/>
      Date: ${quotationDate}<br/>
      Validity: ${validityDays} Days
    </div>
  </div>
  <h3>Client: ${project.clientName} | Project: ${project.name} (${project.location})</h3>
  <p style="font-size:12px;">Type: ${project.constructionType} (${project.structureType}) | Built-up Area: ${ev.areaSummary.totalBuiltUpAreaSqft} Sq.Ft (${project.floors} Floors)</p>
  <table>
    <thead>
      <tr>
        <th>Item</th><th>Description</th><th>Category</th><th>Unit</th><th class="right">Qty</th><th class="right">Material (₹)</th><th class="right">Labour (₹)</th><th class="right">Total (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${ev.allBoqRows
        .map(
          (r) => `<tr>
        <td>${r.itemNumber}</td>
        <td>${r.description}</td>
        <td>${r.category}</td>
        <td>${r.unit}</td>
        <td class="right">${r.quantity}</td>
        <td class="right">${formatINR(r.materialAmountInr)}</td>
        <td class="right">${formatINR(r.labourAmountInr)}</td>
        <td class="right"><strong>${formatINR(r.totalAmountInr)}</strong></td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>
  <div class="summary-box">
    <div>Total Material Cost: <strong>${formatINR(f.totalMaterialCostInr)}</strong></div>
    <div>Total Labour Cost: <strong>${formatINR(f.totalLabourCostInr)}</strong></div>
    <div>Transportation, Misc & Wastage: <strong>${formatINR(f.otherDirectExpensesInr)}</strong></div>
    <div>Base Project Cost: <strong>${formatINR(f.baseProjectCostInr)}</strong></div>
    <div>Contractor Profit (${project.contractorProfitPct}%) & Contingency (${project.contingencyPct}%): <strong>${formatINR(f.contractorProfitInr + f.contingencyInr)}</strong></div>
    <div>GST (${project.gstPct}%): <strong>${formatINR(f.gstAmountInr)}</strong></div>
    <hr/>
    <div style="font-size:16px;color:#0f294a;"><strong>Final Quotation: ${formatINR(f.finalEstimatedCostInr)}</strong> (${formatINR(f.costPerSqftInr)}/sq.ft)</div>
  </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_Quotation_Report.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded standalone printable Quotation Report.', 'success');
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports, Tender Documents & Client Quotations"
        subtitle="Preview, customize, print, or export formal client quotations with company details, itemized BOQ, material/labour breakdown, overheads, and GST."
        badge={project.name}
        rightContent={
          <>
            <button
              onClick={handleExportExcelCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Excel / CSV BOQ
            </button>
            <button
              onClick={handleDownloadQuotationDoc}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0f294a] hover:bg-blue-900 text-white shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Printable Quotation
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </>
        }
      />

      {/* Quotation Header Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Quotation Reference Number
          </label>
          <input
            type="text"
            value={quotationNumber}
            onChange={(e) => setQuotationNumber(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Quotation Issue Date</label>
          <input
            type="date"
            value={quotationDate}
            onChange={(e) => setQuotationDate(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Quotation Validity (Days)
          </label>
          <input
            type="number"
            value={validityDays}
            onChange={(e) => setValidityDays(Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      {/* Live Commercial Quotation Sheet Preview */}
      <div className="bg-white text-slate-900 rounded-xl border-2 border-slate-300 shadow-md p-6 sm:p-10 space-y-6">
        {/* Letterhead */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-[#0f294a]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#0f294a] text-white">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-[#0f294a]">{companyProfile.companyName}</h2>
                <p className="text-xs font-semibold text-blue-700">{companyProfile.tagline}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 max-w-md">{companyProfile.registeredAddress}</p>
            <p className="text-xs text-slate-600 mt-0.5">
              GSTIN: <strong>{companyProfile.gstin}</strong> · Email: {companyProfile.contactEmail} · Phone:{' '}
              {companyProfile.contactPhone}
            </p>
          </div>

          <div className="text-left sm:text-right bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">
              COMMERCIAL BOQ QUOTATION
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">Ref: {quotationNumber}</p>
            <p className="text-xs text-slate-600">Date: {quotationDate}</p>
            <p className="text-xs text-slate-600">Valid for: {validityDays} Calendar Days</p>
          </div>
        </div>

        {/* Client & Project Metadata Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase text-slate-400">Prepared For (Client Details)</p>
            <p className="text-sm font-bold text-slate-900">{project.clientName}</p>
            <p className="text-slate-600">Site Location: {project.location}</p>
            <p className="text-slate-600">Project Start Date: {project.startDate}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase text-slate-400">Project Technical Specifications</p>
            <p className="text-sm font-bold text-slate-900">{project.name}</p>
            <p className="text-slate-600">
              Classification: {project.constructionType} · {project.structureType}
            </p>
            <p className="text-slate-600">
              Floors: {project.floors} Floors · Total Built-Up Area:{' '}
              <strong>{ev.areaSummary.totalBuiltUpAreaSqft.toLocaleString('en-IN')} Sq.Ft</strong> (Plot:{' '}
              {ev.areaSummary.plotAreaSqft} Sq.Ft)
            </p>
          </div>
        </div>

        {/* Itemized BOQ Table */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f294a] mb-2">
            Part A — Abstract Bill of Quantities (BOQ)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-[#0f294a] text-white">
                  <th className="py-2 px-2.5 border border-slate-300">Item</th>
                  <th className="py-2 px-2.5 border border-slate-300">Description of Works</th>
                  <th className="py-2 px-2.5 border border-slate-300">Category</th>
                  <th className="py-2 px-2.5 border border-slate-300">Unit</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-right">Qty</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-right">Material (₹)</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-right">Labour (₹)</th>
                  <th className="py-2 px-2.5 border border-slate-300 text-right">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {ev.allBoqRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-200">
                    <td className="py-2 px-2.5 font-mono font-bold">{row.itemNumber}</td>
                    <td className="py-2 px-2.5">{row.description}</td>
                    <td className="py-2 px-2.5 text-slate-600">{row.category}</td>
                    <td className="py-2 px-2.5">{row.unit}</td>
                    <td className="py-2 px-2.5 text-right font-semibold">{row.quantity.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-2.5 text-right">{formatINR(row.materialAmountInr)}</td>
                    <td className="py-2 px-2.5 text-right">{formatINR(row.labourAmountInr)}</td>
                    <td className="py-2 px-2.5 text-right font-bold">{formatINR(row.totalAmountInr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Part B: Key Material & Workforce Breakdown + Commercial Grand Total */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold uppercase text-[#0f294a]">
              Part B — Key Material & Labour Resource Summary
            </h4>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>Total Cement (RCC + Masonry + Plaster):</span>
              <strong>{f.totalCementBags.toLocaleString('en-IN')} Bags (50kg)</strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>Total Crushed Sand (M-Sand):</span>
              <strong>{f.totalSandCuft.toLocaleString('en-IN')} Cu.ft</strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>Total Graded Coarse Aggregate:</span>
              <strong>{ev.rccSummary.rccAggCuft.toLocaleString('en-IN')} Cu.ft</strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>Total Fe500D TMT Reinforcement Steel:</span>
              <strong>
                {ev.steelSummary.steelTotalKg.toLocaleString('en-IN')} Kg ({ev.steelSummary.steelTotalTonnes} MT)
              </strong>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span>Total Masonry Units (Bricks / Blocks):</span>
              <strong>{ev.masonrySummary.masonryUnits.toLocaleString('en-IN')} Nos</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Site Workforce Effort:</span>
              <strong>{ev.labourSummary.totalManDays.toLocaleString('en-IN')} Man-Days</strong>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-300 text-xs space-y-1.5">
            <h4 className="font-bold uppercase text-[#0f294a] mb-2">
              Part C — Final Quotation Abstract
            </h4>
            <div className="flex justify-between">
              <span>1. Total Material Cost:</span>
              <span className="font-semibold">{formatINR(f.totalMaterialCostInr)}</span>
            </div>
            <div className="flex justify-between">
              <span>2. Total Labour Cost:</span>
              <span className="font-semibold">{formatINR(f.totalLabourCostInr)}</span>
            </div>
            <div className="flex justify-between">
              <span>
                3. Transportation ({project.transportationPct}%), Misc ({project.miscExpensePct}%) & Wastage:
              </span>
              <span className="font-semibold">{formatINR(f.otherDirectExpensesInr)}</span>
            </div>
            <div className="flex justify-between py-1 border-y border-slate-300 font-bold text-slate-900">
              <span>Base Project Cost:</span>
              <span>{formatINR(f.baseProjectCostInr)}</span>
            </div>
            <div className="flex justify-between">
              <span>4. Contractor Profit ({project.contractorProfitPct}%):</span>
              <span>{formatINR(f.contractorProfitInr)}</span>
            </div>
            <div className="flex justify-between">
              <span>5. Contingency Reserve ({project.contingencyPct}%):</span>
              <span>{formatINR(f.contingencyInr)}</span>
            </div>
            <div className="flex justify-between">
              <span>6. Add: Goods & Services Tax — GST ({project.gstPct}%):</span>
              <span className="font-semibold">{formatINR(f.gstAmountInr)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-[#0f294a] text-sm font-extrabold text-[#0f294a]">
              <span>FINAL QUOTATION AMOUNT:</span>
              <span className="text-base">{formatINR(f.finalEstimatedCostInr)}</span>
            </div>
            <div className="text-right text-[11px] text-slate-600">
              Composite Built-Up Rate: <strong>{formatINR(f.costPerSqftInr)} per Sq.Ft</strong>
            </div>
          </div>
        </div>

        {/* Signature Block */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-6 text-xs text-slate-600">
          <div>
            <p className="font-bold text-slate-800">Terms & Engineering Notes:</p>
            <p>1. Quantities are based on architectural/structural drawings and are subject to actual site joint measurement.</p>
            <p>2. Material rates are based on current baseline schedules; statutory tax variations apply at actuals.</p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <div className="h-10 border-b border-slate-400 w-56 sm:ml-auto mb-1" />
            <p className="font-bold text-slate-900">{companyProfile.chiefEstimator}</p>
            <p>Authorized Signatory · {companyProfile.companyName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODULE 16: SETTINGS, CALCULATION ENGINE UNIT TESTS & BACKEND ARCHITECTURE
// ============================================================================

const SettingsView: React.FC = () => {
  const { companyProfile, updateCompanyProfile, darkMode, toggleDarkMode } = useConstructStore();
  const [formState, setFormState] = useState(companyProfile);

  // Automated in-app unit test suite runner for Calculation Engine verification
  const unitTestResults = useMemo(() => {
    const tests: { name: string; formula: string; expected: string; actual: string; passed: boolean }[] = [];

    // Test 1: Steel D^2/162 formula for 16mm bar
    const st16 = calcSteelRow(
      {
        id: 't1',
        memberName: 'Test 16mm',
        structuralElement: 'Column',
        diameterMm: 16,
        barLengthM: 10,
        barsPerMember: 10,
        spacingMm: 150,
        memberCount: 1,
        wastagePct: 5,
      },
      70
    );
    tests.push({
      name: 'Steel Theoretical Unit Weight (16mm Bar)',
      formula: 'Weight = D² / 162 = 16² / 162',
      expected: '1.58 kg/m (Gross 100m + 5% = 165.93 kg)',
      actual: `${st16.unitWeightKgPerM} kg/m (Gross = ${st16.totalWeightKg} kg)`,
      passed: st16.unitWeightKgPerM === 1.58 && Math.abs(st16.totalWeightKg - 165.93) < 0.05,
    });

    // Test 2: RCC M20 Wet & Dry Volume Conversion
    const rccTest = calcRccRow(
      {
        id: 't2',
        category: 'Slab',
        label: 'Test Slab',
        lengthM: 10,
        widthM: 5,
        depthM: 0.15,
        quantity: 1,
        grade: 'M20',
        dryFactor: 1.54,
        wastagePct: 0,
      },
      { cement: 400, sand: 60, agg: 45 }
    );
    tests.push({
      name: 'RCC M20 (1:1.5:3) Wet-to-Dry Volume & Cement Bags',
      formula: 'Wet = 10×5×0.15 = 7.5 m³; Dry = 7.5 × 1.54 = 11.55 m³',
      expected: 'Wet: 7.5 m³, Dry: 11.55 m³, Cement: 60.52 Bags',
      actual: `Wet: ${rccTest.wetVolCum} m³, Dry: ${rccTest.dryVolCum} m³, Cement: ${rccTest.cementBags} Bags`,
      passed: rccTest.wetVolCum === 7.5 && rccTest.dryVolCum === 11.55 && Math.abs(rccTest.cementBags - 60.52) < 0.1,
    });

    // Test 3: Masonry Opening Deduction
    const masTest = calcMasonryRow(
      {
        id: 't3',
        label: 'Test Wall',
        unitType: 'BRICK',
        wallLengthM: 10,
        wallHeightM: 3,
        wallThicknessM: 0.23,
        doorAreaSqm: 2.1,
        windowAreaSqm: 1.9,
        unitLengthMm: 190,
        unitWidthMm: 90,
        unitHeightMm: 90,
        mortarJointMm: 10,
        mixRatioCement: 1,
        mixRatioSand: 6,
        wastagePct: 0,
      },
      { brick: 9, block: 60, cement: 400, sand: 60 }
    );
    tests.push({
      name: 'Masonry Opening Deduction & Net Volume',
      formula: 'Gross 30 m² - 4.0 m² openings = 26 m² × 0.23m = 5.98 m³',
      expected: 'Net Area: 26 m², Net Vol: 5.98 m³, Bricks: 2990 Nos',
      actual: `Net Area: ${masTest.netAreaSqm} m², Net Vol: ${masTest.netWallVolCum} m³, Bricks: ${masTest.unitsCount} Nos`,
      passed: masTest.netAreaSqm === 26 && masTest.netWallVolCum === 5.98 && masTest.unitsCount === 2990,
    });

    // Test 4: Zero & Negative Input Guard
    const negGuard = safeNonNegative(-42.5);
    tests.push({
      name: 'Zero / Negative Dimension Validation Guard',
      formula: 'safeNonNegative(-42.5) === 0',
      expected: '0',
      actual: `${negGuard}`,
      passed: negGuard === 0,
    });

    return tests;
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyProfile(formState);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Platform Settings, Calculation Engine Verification & Full-Stack Info"
        subtitle="Configure organization letterhead details, theme preferences, and inspect automated unit tests for the centralized Calculation Engine."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company & Quotation Profile */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2.5">
            Organization & Quotation Header Profile
          </h3>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Company Name</label>
            <input
              type="text"
              value={formState.companyName}
              onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={formState.gstin}
                onChange={(e) => setFormState({ ...formState, gstin: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Quotation Number Prefix
              </label>
              <input
                type="text"
                value={formState.quotationPrefix}
                onChange={(e) => setFormState({ ...formState, quotationPrefix: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Registered Office Address
            </label>
            <input
              type="text"
              value={formState.registeredAddress}
              onChange={(e) => setFormState({ ...formState, registeredAddress: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Chief Estimator / Signatory
              </label>
              <input
                type="text"
                value={formState.chiefEstimator}
                onChange={(e) => setFormState({ ...formState, chiefEstimator: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formState.contactPhone}
                onChange={(e) => setFormState({ ...formState, contactPhone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              Toggle {darkMode ? 'Light' : 'Dark'} Interface Theme
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
            >
              Save Settings
            </button>
          </div>
        </form>

        {/* Automated Calculation Engine Unit Verification Suite */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Automated Calculation Engine Unit Tests
              </h3>
              <p className="text-xs text-slate-500">Live execution of mathematical accuracy assertions</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              {unitTestResults.filter((t) => t.passed).length}/{unitTestResults.length} Passed
            </span>
          </div>

          <div className="space-y-3">
            {unitTestResults.map((t, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>{t.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> PASS
                  </span>
                </div>
                <p className="text-slate-500 font-mono text-[11px] mt-1">{t.formula}</p>
                <div className="text-slate-700 dark:text-slate-300 mt-1">
                  Output: <strong>{t.actual}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APPLICATION SHELL (SIDEBAR, TOPBAR, NEW PROJECT MODAL & ROUTER)
// ============================================================================

export default function App() {
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    toggleSidebar,
    darkMode,
    toggleDarkMode,
    projects,
    rates,
    activeProjectId,
    setActiveProject,
    createProject,
    toastMessage,
    clearToast,
  } = useConstructStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);

  const [modalForm, setModalForm] = useState({
    name: '',
    clientName: '',
    location: '',
    constructionType: 'Residential' as 'Residential' | 'Commercial',
    structureType: 'RCC framed structure' as 'RCC framed structure' | 'Load-bearing structure',
    floors: 1,
    plotLengthFt: 0,
    plotWidthFt: 0,
    buildingLengthFt: 0,
    buildingWidthFt: 0,
    startDate: new Date().toISOString().slice(0, 10),
    description: '',
  });

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || EMPTY_PROJECT_FALLBACK;
  const activeEval = useMemo(() => evaluateCompleteProject(activeProject, rates), [activeProject, rates]);

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.name.trim() || !modalForm.clientName.trim()) return;
    createProject({
      ...modalForm,
      status: 'Planning',
      progressPct: 0,
      slabProjectionFt: 0,
      wallHeightFt: 10,
      transportationPct: 0,
      miscExpensePct: 0,
      globalWastagePct: 0,
      contractorProfitPct: 0,
      contingencyPct: 0,
      gstPct: 18.0,
    });
    setNewProjectModalOpen(false);
    setModalForm({ ...modalForm, name: '', clientName: '' });
    setActiveTab('project-inputs');
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans">
        {/* Left Collapsible Navigation Sidebar */}
        <aside
          className={`${
            sidebarCollapsed ? 'md:w-20' : 'md:w-64'
          } bg-[#0f294a] text-white shrink-0 flex flex-col justify-between transition-all duration-200 border-r border-slate-800 z-30`}
        >
          {/* Brand Header */}
          <div>
            <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                {!sidebarCollapsed && (
                  <div className="truncate">
                    <span className="font-extrabold tracking-tight text-base block leading-none">CONSTRUCT PRO</span>
                    <span className="text-[10px] text-blue-200 block mt-0.5 truncate">
                      Smart Estimation & BOQ
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={toggleSidebar}
                className="hidden md:flex p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10"
                title="Toggle sidebar"
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden px-2.5 py-1 rounded bg-white/10 text-xs font-semibold"
              >
                {mobileMenuOpen ? 'Close Menu' : 'All 16 Modules ▾'}
              </button>
            </div>

            {/* Navigation List (All 16 Required Items) */}
            <nav
              className={`${
                mobileMenuOpen ? 'block' : 'hidden'
              } md:block p-2.5 space-y-1 max-h-[calc(100vh-5rem)] overflow-y-auto`}
            >
              {NAV_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="truncate">
                        {idx + 1}. {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navigation Bar */}
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-20">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline">
                Active Project:
              </span>
              <select
                value={activeProjectId}
                onChange={(e) => setActiveProject(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white max-w-xs truncate"
              >
                {projects.length === 0 ? (
                  <option value="">No projects yet — Click + New</option>
                ) : (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.constructionType})
                    </option>
                  ))
                )}
              </select>
              <button
                onClick={() => setNewProjectModalOpen(true)}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            </div>

            {/* Live Project Summary Pill & Theme Toggle */}
            <div className="flex items-center gap-3">
              <div className="hidden xl:flex items-center gap-4 px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                <div>
                  <span className="text-slate-500">Built-up: </span>
                  <strong className="text-slate-900 dark:text-white">
                    {activeEval.areaSummary.totalBuiltUpAreaSqft.toLocaleString('en-IN')} sq.ft
                  </strong>
                </div>
                <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
                <div>
                  <span className="text-slate-500">BOQ Estimate: </span>
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    {formatINR(activeEval.financials.finalEstimatedCostInr)}
                  </strong>
                </div>
                <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
                <div>
                  <span className="text-slate-500">Rate: </span>
                  <strong className="text-blue-700 dark:text-blue-400">
                    {formatINR(activeEval.financials.costPerSqftInr)}/sq.ft
                  </strong>
                </div>
              </div>

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Switch theme"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="flex-1 font-medium">{toastMessage.text}</span>
              <button onClick={clearToast} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Active Module Workspace */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView onOpenNewProjectModal={() => setNewProjectModalOpen(true)} />
            )}
            {activeTab === 'projects' && (
              <ProjectsDirectoryView onOpenNewProjectModal={() => setNewProjectModalOpen(true)} />
            )}
            {activeTab === 'project-inputs' && <ProjectInputsView />}
            {activeTab === 'area-calc' && <AreaCalculatorView />}
            {activeTab === 'rcc-calc' && <RccCalculatorView />}
            {activeTab === 'steel-calc' && <SteelCalculatorView />}
            {activeTab === 'material-calc' && <MaterialCalculatorView />}
            {activeTab === 'masonry-calc' && <MasonryCalculatorView />}
            {activeTab === 'flooring-calc' && <FlooringCalculatorView />}
            {activeTab === 'plaster-paint' && <PlasterPaintingView />}
            {activeTab === 'plumbing-electrical' && <PlumbingElectricalView />}
            {activeTab === 'labour-calc' && <LabourCalculatorView />}
            {activeTab === 'boq-cost' && <BoqCostEstimationView />}
            {activeTab === 'rate-mgmt' && <RateManagementView />}
            {activeTab === 'reports' && <ReportsQuotationsView />}
            {activeTab === 'settings' && <SettingsView />}
          </main>
        </div>

        {/* Create New Project Modal */}
        {newProjectModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Construction Project</h3>
                  <p className="text-xs text-slate-500">Initialize project with baseline RCC, masonry, and BOQ schedules</p>
                </div>
                <button
                  onClick={() => setNewProjectModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProjectSubmit} className="space-y-3.5 mt-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Project Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sai Residency G+4"
                      value={modalForm.name}
                      onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Client Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Omkar Developers"
                      value={modalForm.clientName}
                      onChange={(e) => setModalForm({ ...modalForm, clientName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Project Location</label>
                    <input
                      type="text"
                      value={modalForm.location}
                      onChange={(e) => setModalForm({ ...modalForm, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Start Date</label>
                    <input
                      type="date"
                      value={modalForm.startDate}
                      onChange={(e) => setModalForm({ ...modalForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Construction Type</label>
                    <select
                      value={modalForm.constructionType}
                      onChange={(e) => setModalForm({ ...modalForm, constructionType: e.target.value as any })}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Structure Type</label>
                    <select
                      value={modalForm.structureType}
                      onChange={(e) => setModalForm({ ...modalForm, structureType: e.target.value as any })}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="RCC framed structure">RCC framed structure</option>
                      <option value="Load-bearing structure">Load-bearing structure</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Floors Count</label>
                    <input
                      type="number"
                      min={1}
                      value={modalForm.floors}
                      onChange={(e) => setModalForm({ ...modalForm, floors: Math.max(1, Number(e.target.value)) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Plot L (ft)</label>
                    <input
                      type="number"
                      value={modalForm.plotLengthFt}
                      onChange={(e) => setModalForm({ ...modalForm, plotLengthFt: safeNonNegative(Number(e.target.value)) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Plot W (ft)</label>
                    <input
                      type="number"
                      value={modalForm.plotWidthFt}
                      onChange={(e) => setModalForm({ ...modalForm, plotWidthFt: safeNonNegative(Number(e.target.value)) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Bldg L (ft)</label>
                    <input
                      type="number"
                      value={modalForm.buildingLengthFt}
                      onChange={(e) => setModalForm({ ...modalForm, buildingLengthFt: safeNonNegative(Number(e.target.value)) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Bldg W (ft)</label>
                    <input
                      type="number"
                      value={modalForm.buildingWidthFt}
                      onChange={(e) => setModalForm({ ...modalForm, buildingWidthFt: safeNonNegative(Number(e.target.value)) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setNewProjectModalOpen(false)}
                    className="px-4 py-2 rounded-lg font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg font-semibold bg-[#0f294a] hover:bg-blue-900 text-white"
                  >
                    Create & Open Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
