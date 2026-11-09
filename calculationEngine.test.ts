import { describe, it, expect } from 'vitest';
import {
  calculateAreaMetrics,
  calculateRccMember,
  calculateSteelEntry,
  calculateMasonryWall,
  calculateMasterBoq,
} from './calculationEngine';

describe('CONSTRUCT PRO Centralized Calculation Engine', () => {
  it('calculates plot, built-up, carpet, and slab areas accurately', () => {
    const res = calculateAreaMetrics({
      plotLengthFt: 50,
      plotWidthFt: 40,
      buildingLengthFt: 40,
      buildingWidthFt: 30,
      floors: 3,
      slabProjectionFt: 1.5,
      rooms: [
        { id: '1', name: 'Living Room', floorNumber: 1, lengthFt: 16, widthFt: 12, heightFt: 10, wallThicknessFt: 0.75, count: 3 },
      ],
    });
    expect(res.plotAreaSqft).toBe(2000);
    expect(res.groundFloorAreaSqft).toBe(1200);
    expect(res.totalBuiltUpAreaSqft).toBe(3600);
    expect(res.carpetAreaSqft).toBe(576);
  });

  it('calculates RCC wet/dry volume and M20 constituent materials properly', () => {
    const res = calculateRccMember(
      {
        id: 'rcc1',
        category: 'Slab',
        label: 'Main Roof Slab',
        lengthM: 10,
        widthM: 5,
        depthM: 0.15,
        quantity: 1,
        grade: 'M20',
        dryVolumeFactor: 1.54,
        wastagePct: 0,
      },
      { cementPerBagInr: 410, sandPerCuftInr: 65, aggregatePerCuftInr: 48 }
    );
    expect(res.wetVolumeCum).toBe(7.5);
    expect(res.dryVolumeCum).toBe(11.55);
    expect(res.cementBags).toBeGreaterThan(60);
    expect(res.totalMaterialCostInr).toBeGreaterThan(0);
  });

  it('calculates steel weight using theoretical formula D^2 / 162 kg/m', () => {
    const res = calculateSteelEntry(
      {
        id: 'st1',
        memberName: 'Column C1',
        structuralElement: 'Column',
        diameterMm: 16,
        barLengthM: 12,
        barsPerMember: 8,
        spacingMm: 150,
        memberCount: 10,
        wastagePct: 5,
      },
      74
    );
    // 16^2 / 162 = 256 / 162 = 1.5802 -> 1.58 kg/m
    expect(res.unitWeightKgPerM).toBe(1.58);
    expect(res.totalBarLengthM).toBe(960);
    expect(res.grossSteelWeightKg).toBeGreaterThan(1590);
  });

  it('deducts door and window openings accurately in Masonry Calculator', () => {
    const res = calculateMasonryWall(
      {
        id: 'm1',
        label: 'External Wall',
        unitType: 'BRICK',
        wallLengthM: 10,
        wallHeightM: 3,
        wallThicknessM: 0.23,
        openings: [{ label: 'Door D1', widthM: 1.0, heightM: 2.1, count: 2 }],
        unitLengthMm: 190,
        unitWidthMm: 90,
        unitHeightMm: 90,
        mortarJointMm: 10,
        mixRatioCement: 1,
        mixRatioSand: 6,
        wastagePct: 5,
      },
      { unitPriceInr: 9, cementBagRateInr: 410, sandCuftRateInr: 65 }
    );
    expect(res.grossAreaSqm).toBe(30);
    expect(res.deductedOpeningAreaSqm).toBe(4.2);
    expect(res.netWallAreaSqm).toBe(25.8);
    expect(res.unitQuantityNos).toBeGreaterThan(2900);
  });

  it('prevents double-counting wastage in BOQ when item quantity already includes wastage', () => {
    const boq = calculateMasterBoq(
      [
        {
          id: 'b1',
          itemNumber: '1.01',
          description: 'RCC M20 Concrete (with wastage included)',
          category: 'RCC Works',
          unit: 'cum',
          quantity: 10,
          materialRateInr: 5500,
          labourRateInr: 1200,
          includesWastageInQty: true,
        },
      ],
      {
        transportationPct: 2,
        miscExpensePct: 1,
        globalWastagePct: 5,
        contractorProfitPct: 10,
        contingencyPct: 3,
        gstPct: 18,
      },
      1000
    );
    expect(boq.additionalWastageInr).toBe(0);
    expect(boq.finalEstimatedCostInr).toBeGreaterThan(boq.directBaseCostInr);
  });
});