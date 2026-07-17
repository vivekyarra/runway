import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateTaxAdjustment } from '../src/tax/adjustments.js'

test('calculateTaxAdjustment applies the declared regional adjustment', () => {
  assert.equal(calculateTaxAdjustment('CA', 51.15), 1.53)
  assert.equal(calculateTaxAdjustment('NY', 51.15), 0)
})
