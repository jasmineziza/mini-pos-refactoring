import { getProducts, addSale } from './db.js';
import { formatMoney, roundMoney, showToast } from './shared.js';
import { calculateTotals } from './cart.js';

const productGrid = document.getElementById('productGrid');
const cartItems = document.getElementById('cartItems');
const itemCountEl = document.getElementById('itemCount');
const subtotalEl = document.getElementById('subtotal');
const discountAmountEl = document.getElementById('discountAmount');
const grandTotalEl = document.getElementById('grandTotal');
const discountValueEl = document.getElementById('discountValue');
const discountTypeEl = document.getElementById('discountType');
const clearCartBtn = document.getElementById('clearCart');
const checkoutBtn = document.getElementById('checkoutBtn');

let cart = [];

async function renderProducts() {
  const products = await getProducts();
  
  if (products.length === 0) {
    productGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">No products available</div>';
    return;
  }

  productGrid.innerHTML = products.map(p => `
    <button data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" class="add-product border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:bg-indigo-50 transition text-left">
  <div class="font-semibold text-gray-900 mb-1">${p.name}</div>
  <div class="text-lg font-bold text-indigo-600">${formatMoney(p.price)}</div>
    </button>
  `).join('');

  document.querySelectorAll('.add-product').forEach(btn => {
    btn.addEventListener('click', () => {
      const prod = {
        id: Number(btn.dataset.id),
        name: btn.dataset.name,
        price: Number(btn.dataset.price)
      };
      addToCart(prod);
    });
  });
}

function addToCart(prod) {
  const found = cart.find(c => c.id === prod.id);
  if (found) found.qty += 1;
  else cart.push({ ...prod, qty: 1 });
  renderCart();
  showToast(`${prod.name} added to cart`, 'success');
}

function getTotals() {
  return calculateTotals(cart, discountValueEl.value, discountTypeEl.value);
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="text-center text-gray-500 py-4">Cart is empty</div>';
    itemCountEl.textContent = '0';
    subtotalEl.textContent = formatMoney(0);
    discountAmountEl.textContent = `-${formatMoney(0)}`;
    grandTotalEl.textContent = formatMoney(0);
    return;
  }

  const { itemCount, subtotal, discount, total } = getTotals();

  cartItems.innerHTML = cart.map((c, idx) => {
    return `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex-1">
          <div class="font-medium text-gray-900">${c.name}</div>
          <div class="text-sm text-gray-600">${formatMoney(c.price)} × ${c.qty}</div>
        </div>
        <div class="flex items-center gap-2">
          <button data-idx="${idx}" class="dec-btn w-8 h-8 rounded border border-gray-300 hover:bg-gray-100">−</button>
          <button data-idx="${idx}" class="inc-btn w-8 h-8 rounded border border-gray-300 hover:bg-gray-100">+</button>
          <button data-idx="${idx}" class="rem-btn w-8 h-8 rounded border border-red-300 text-red-600 hover:bg-red-50">×</button>
        </div>
      </div>
    `;
  }).join('');

  itemCountEl.textContent = itemCount;
  subtotalEl.textContent = formatMoney(subtotal);
  discountAmountEl.textContent = `-${formatMoney(discount)}`;
  grandTotalEl.textContent = formatMoney(total);

  // Attach handlers
  document.querySelectorAll('.dec-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      cart[idx].qty = Math.max(1, cart[idx].qty - 1);
      renderCart();
    });
  });

  document.querySelectorAll('.inc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      cart[idx].qty += 1;
      renderCart();
    });
  });

  document.querySelectorAll('.rem-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      cart.splice(idx, 1);
      renderCart();
    });
  });
}

clearCartBtn.addEventListener('click', () => {
  if (cart.length > 0 && confirm('Clear cart?')) {
    cart = [];
    renderCart();
    showToast('Cart cleared');
  }
});

function generateThermalReceipt({ subtotal, discount, total }) {
  const date = new Date().toLocaleString();
  
  // Receipt is 32 characters wide for thermal printer
  let receipt = [
    'Mini POS - Codecraft by Syed',
    '--------------------------------',
    `Date: ${date}`,
    '--------------------------------',
    'Items:',
    ...cart.map(item => [
      item.name,
      `${item.qty} x ${formatMoney(item.price)}    ${formatMoney(item.qty * item.price)}`
    ]).flat(),
    '--------------------------------',
    `Subtotal:          ${formatMoney(subtotal)}`,
    `Discount:         -${formatMoney(discount)}`,
    '--------------------------------',
    `Total:             ${formatMoney(total)}`,
    '--------------------------------',
    '',
    '       Thank You!',
    '    Please Visit Again',
    ''
  ].join('\\n');

  return receipt;
}

function printReceipt(receipt) {
  const printWindow = window.open('', '', 'width=300,height=600');
  printWindow.document.write(`
    <html>
      <head>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm; /* Thermal receipt width */
            margin: 0;
            padding: 10px;
          }
          pre {
            white-space: pre-wrap;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <pre>${receipt}</pre>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// Add discount input listeners
[discountValueEl, discountTypeEl].forEach(el => {
  el.addEventListener('input', renderCart);
});

async function processSale(withPrint = false) {
  if (cart.length === 0) {
    showToast('Cart is empty', 'error');
    return;
  }

  const { subtotal, discount, total } = getTotals();

  const sale = {
    date: new Date().toISOString(),
    items: cart.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
    subtotal: roundMoney(subtotal),
    discount: roundMoney(discount),
    total: roundMoney(total)
  };

  await addSale(sale);
  
  if (withPrint) {
    // Generate and print thermal receipt
    const receipt = generateThermalReceipt(sale);
    printReceipt(receipt);
  }
  
  cart = [];
  renderCart();
  showToast('Sale completed successfully!', 'success');
}

// Quick checkout without printing
checkoutBtn.addEventListener('click', () => processSale(false));

// Checkout with bill printing
document.getElementById('printBillBtn').addEventListener('click', () => processSale(true));

renderProducts();
renderCart();
