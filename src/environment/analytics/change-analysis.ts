/**
 * Change Analysis — Generic framework for comparing two datasets.
 * Handles zero denominators safely. Never claims precision beyond data resolution.
 */



export interface ChangeResult {
  difference: number;
  percentChange: number | null; // null if denominator is zero
  absoluteChange: number;
  baselineValue: number;
  comparisonValue: number;
  unit: string;
  label: string;
}

export interface AreaChangeResult {
  changedPoints: number;
  totalPoints: number;
  changedPercent: number;
  increasedCount: number;
  decreasedCount: number;
  meanChange: number;
  unit: string;
}

/**
 * Computes change between two scalar values.
 * Returns null for percentChange if baseline is zero.
 */
export function computeScalarChange(
  baseline: number,
  comparison: number,
  unit: string,
  label: string,
): ChangeResult {
  const difference = comparison - baseline;
  const absoluteChange = Math.abs(difference);
  const percentChange = baseline !== 0
    ? Math.round(((comparison - baseline) / Math.abs(baseline)) * 10000) / 100
    : null;

  return {
    difference: Math.round(difference * 1000) / 1000,
    percentChange,
    absoluteChange: Math.round(absoluteChange * 1000) / 1000,
    baselineValue: baseline,
    comparisonValue: comparison,
    unit,
    label,
  };
}

/**
 * Computes area-level change from two arrays of values at corresponding locations.
 * Arrays must be aligned (same spatial grid).
 */
export function computeAreaChange(
  baselineValues: number[],
  comparisonValues: number[],
  unit: string,
  threshold = 0.01,
): AreaChangeResult {
  const len = Math.min(baselineValues.length, comparisonValues.length);

  if (len === 0) {
    return {
      changedPoints: 0,
      totalPoints: 0,
      changedPercent: 0,
      increasedCount: 0,
      decreasedCount: 0,
      meanChange: 0,
      unit,
    };
  }

  let changedPoints = 0;
  let increasedCount = 0;
  let decreasedCount = 0;
  let sumChange = 0;

  for (let i = 0; i < len; i++) {
    const diff = (comparisonValues[i] ?? 0) - (baselineValues[i] ?? 0);
    sumChange += diff;

    if (Math.abs(diff) > threshold) {
      changedPoints++;
      if (diff > 0) increasedCount++;
      else decreasedCount++;
    }
  }

  const changedPercent = len > 0
    ? Math.round((changedPoints / len) * 10000) / 100
    : 0;

  return {
    changedPoints,
    totalPoints: len,
    changedPercent,
    increasedCount,
    decreasedCount,
    meanChange: Math.round((sumChange / len) * 1000) / 1000,
    unit,
  };
}
