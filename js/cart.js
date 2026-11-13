// Logika keranjang & perhitungan total. Modul murni (tanpa DOM) supaya bisa diuji di Node.

export function calculateDiscount(subtotal, discountValue, discountType) {
  const value = parseFloat(discountValue) || 0;
  if (discountType === 'percent') {
    return subtotal * (value / 100);
  }
  return value;
}

export function calculateTotals(items, discountValue, discountType) {
  if (items.length === 0) {
    return { itemCount: 0, subtotal: 0, discount: 0, total: 0 };
  }
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const discount = calculateDiscount(subtotal, discountValue, discountType);
  const total = Math.max(0, subtotal - discount);
  return { itemCount, subtotal, discount, total };
}
