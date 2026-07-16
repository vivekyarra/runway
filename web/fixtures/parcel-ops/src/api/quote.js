import { quoteSummary } from '../quote.js'

export function createQuoteResponse(items, taxRate) {
  return { quote: quoteSummary(items, taxRate), source: 'parcel-ops' }
}
