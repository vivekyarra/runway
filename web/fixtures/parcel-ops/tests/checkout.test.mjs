import assert from 'node:assert/strict'
import test from 'node:test'
import { submitOrder } from '../src/checkout/submitOrder.js'

test('submitOrder preserves payload and records the fixture timestamp', () => {
  assert.deepEqual(submitOrder({ id: 'order-7', total: 51.15 }), { id: 'order-7', total: 51.15, submittedAt: 'demo' })
})
