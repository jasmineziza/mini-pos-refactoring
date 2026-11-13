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

// State keranjang dibungkus di modul ini; pos.js hanya mengubahnya lewat fungsi di bawah.
let items = [];

export function getItems() {
  return items;
}

export function isEmpty() {
  return items.length === 0;
}

export function addItem(prod) {
  const found = items.find(item => item.id === prod.id);
  if (found) found.qty += 1;
  else items.push({ ...prod, qty: 1 });
}

export function changeQty(idx, delta) {
  items[idx].qty = Math.max(1, items[idx].qty + delta);
}

export function removeItem(idx) {
  items.splice(idx, 1);
}

export function clearCart() {
  items = [];
}
