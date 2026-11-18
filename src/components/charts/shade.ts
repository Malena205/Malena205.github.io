/**
 * Bar colour for a value relative to the largest one in its chart: the lightest
 * chart colour for the smallest values, darkening towards the largest.
 */
export function shade(value: number, max: number) {
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  // Stops at the third step: blending all the way to the darkest one turns the middle greyish.
  return `color-mix(in oklab, var(--chart-1), var(--chart-3) ${Math.round(share * 100)}%)`;
}
