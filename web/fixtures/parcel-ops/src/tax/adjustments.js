export function calculateTaxAdjustment(region, total) {
  return region === 'CA' ? Math.round(total * 0.03 * 100) / 100 : 0
}
