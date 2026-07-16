export function quoteTotal(items, taxRate = 0) {
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const delivery = subtotal >= 50 ? 0 : 6.5
  return Math.round((subtotal + delivery) * (1 + taxRate) * 100) / 100
}

export function quoteSummary(items, taxRate) {
  return {
    count: items.reduce((total, item) => total + item.quantity, 0),
    total: quoteTotal(items, taxRate),
  }
}
