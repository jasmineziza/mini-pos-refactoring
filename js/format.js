// Format angka uang. Modul ini murni (tanpa DOM) supaya bisa diuji di Node.
export const CURRENCY = '₹';

export function money(n) {
  return (Math.round(Number(n) * 100) / 100).toFixed(2);
}

export function formatMoney(n) {
  return `${CURRENCY}${money(n)}`;
}
