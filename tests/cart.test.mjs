// Unit test logika murni. Jalankan: node --test tests/cart.test.mjs
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { money, formatMoney, roundMoney, CURRENCY } from '../js/format.js';
import {
  calculateDiscount, calculateTotals,
  getItems, isEmpty, addItem, changeQty, removeItem, clearCart
} from '../js/cart.js';

const kopi = { id: 1, name: 'Kopi', price: 15000 };
const roti = { id: 2, name: 'Roti', price: 10000 };

beforeEach(() => clearCart());

test('money() & formatMoney() memformat 2 desimal dengan simbol mata uang', () => {
  assert.equal(money(1.005), '1.00');
  assert.equal(money(33.3), '33.30');
  assert.equal(formatMoney(15000), `${CURRENCY}15000.00`);
  assert.equal(roundMoney(33.300000000000004), 33.3);
});

test('calculateDiscount(): persen, nominal, dan input kosong', () => {
  assert.equal(calculateDiscount(40000, '10', 'percent'), 4000);
  assert.equal(calculateDiscount(40000, '5000', 'flat'), 5000);
  assert.equal(calculateDiscount(40000, '', 'percent'), 0);
});

test('calculateTotals(): keranjang kosong selalu nol, meski diskon diisi', () => {
  assert.deepEqual(calculateTotals([], '5000', 'flat'), { itemCount: 0, subtotal: 0, discount: 0, total: 0 });
});

test('calculateTotals(): subtotal, diskon persen, total', () => {
  const items = [{ ...kopi, qty: 2 }, { ...roti, qty: 1 }];
  assert.deepEqual(calculateTotals(items, '10', 'percent'), { itemCount: 3, subtotal: 40000, discount: 4000, total: 36000 });
});

test('calculateTotals(): total tidak pernah negatif', () => {
  const items = [{ ...roti, qty: 1 }];
  assert.equal(calculateTotals(items, '99999', 'flat').total, 0);
});

test('addItem() menambah qty bila produk sudah ada', () => {
  addItem(kopi); addItem(kopi); addItem(roti);
  assert.deepEqual(getItems().map(i => [i.name, i.qty]), [['Kopi', 2], ['Roti', 1]]);
});

test('changeQty() tidak bisa di bawah 1; removeItem() & clearCart()', () => {
  addItem(kopi); addItem(roti);
  changeQty(0, -1);
  assert.equal(getItems()[0].qty, 1);
  changeQty(0, +1);
  assert.equal(getItems()[0].qty, 2);
  removeItem(0);
  assert.deepEqual(getItems().map(i => i.name), ['Roti']);
  clearCart();
  assert.ok(isEmpty());
});
