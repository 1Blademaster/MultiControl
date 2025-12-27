export function intToCoord(val: number): number {
  return val / 1e7
}

export function centiDegToDeg(val: number): number {
  try {
    if (val === 65535) {
      return 0
    }
    return val / 100.0
  } catch (e) {
    return 0
  }
}

export function mmToM(val: number): number {
  return val / 1000.0
}

export function mvToV(val: number): number {
  return val / 1000.0
}

export function caToA(val: number): number {
  return val / 100.0
}

export function formatNumber(val: number, decimals: number = 2): string {
  if (val === undefined || val === null || isNaN(val)) {
    return (0).toFixed(decimals)
  }
  return val.toFixed(decimals)
}
