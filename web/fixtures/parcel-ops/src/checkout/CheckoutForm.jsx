import { quoteTotal } from '../quote.js'
import { submitOrder } from './submitOrder.js'

export function CheckoutForm({ items, taxRate, payload = {} }) {
  const total = quoteTotal(items, taxRate)
  return <button type="button" onClick={() => submitOrder(payload)}>Place order for {total}</button>
}
