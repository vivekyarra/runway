import assert from 'node:assert/strict'
import test from 'node:test'
import { quoteSummary, quoteTotal } from '../src/quote.js'

test('quoteTotal applies delivery threshold and tax deterministically', () => {
  assert.equal(quoteTotal([{ price: 20, quantity: 2 }]), 46.5)
  assert.equal(quoteTotal([{ price: 20, quantity: 2 }], 0.1), 51.15)
})

test('quoteSummary reports count and total', () => {
  assert.deepEqual(quoteSummary([{ price: 30, quantity: 2 }], 0), { count: 2, total: 60 })
})
