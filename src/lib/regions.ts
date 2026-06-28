import type { Region } from '../data/types'

// A small, honest set of US cost-of-living contexts. payMultiplier scales the
// national BLS wage; livingCostUSD is a rough annual living cost used in Life Math.
export const REGIONS: Region[] = [
  { id: 'national', label: 'US national average', payMultiplier: 1.0, livingCostUSD: 24000 },
  { id: 'high-cost', label: 'High-cost metro (SF / NYC)', payMultiplier: 1.32, livingCostUSD: 42000 },
  { id: 'mid-metro', label: 'Mid-size metro (Austin / Denver)', payMultiplier: 1.06, livingCostUSD: 30000 },
  { id: 'low-cost', label: 'Low-cost area (Midwest / South)', payMultiplier: 0.86, livingCostUSD: 19000 },
]

export const DEFAULT_REGION = REGIONS[0]

export const regionById = (id: string): Region =>
  REGIONS.find((r) => r.id === id) ?? DEFAULT_REGION
