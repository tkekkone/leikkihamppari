const menuItems = [
  {
    id: "hamburilainen",
    name: "Hampurilainen",
    price: 4.5,
    description: "Klassinen burgeri ja pehmeä sämpylä.",
  },
  {
    id: "tuplisti",
    name: "Tuplisti",
    price: 6.9,
    description: "Tuplapihvi ja tuplasti makua.",
  },
  {
    id: "setti",
    name: "Setti",
    price: 8.9,
    description: "Burgeri + ranskalaiset + juoma.",
  },
  {
    id: "lasten-ateria",
    name: "Lasten ateria",
    price: 5.9,
    description: "Pieni burgeri, mini-ranut ja mehu.",
  },
  {
    id: "pitkis",
    name: "Pitkis",
    price: 6.4,
    description: "Pitkä hampurilainen isoon nälkään.",
  },
  {
    id: "kanahampurilainen",
    name: "Kanahampurilainen",
    price: 5.0,
    description: "Rapea kana, raikas maku.",
  },
  {
    id: "lisakkeet",
    name: "Lisäkkeet",
    price: 3.0,
    description: "Valitse lisukkeet annokseen.",
  },
];

const modLabels = {
  juusto: "Juusto",
  sipuli: "Sipuli",
  kastike: "Kastike",
  tomaatti: "Tomaatti",
  salaatti: "Salaatti",
};

const cart = [];
let selectedItemId = null;

const menuGrid = document.getElementById("menu-grid");
const dialog = document.getElementById("customize-dialog");
const customizeForm = document.getElementById("customize-form");
const customizeTitle = document.getElementById("customize-title");
const customizePrice = document.getElementById("customize-price");
const qtyInput = document.getElementById("qty");
const cancelCustomize = document.getElementById("cancel-customize");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const runningTotal = document.getElementById("running-total");
const clearCartBtn = document.getElementById("clear-cart");
const checkoutBtn = document.getElementById("checkout");
const receiptDialog = document.getElementById("receipt-dialog");
const receiptContent = document.getElementById("receipt-content");
const closeReceiptBtn = document.getElementById("close-receipt");

function euro(value) {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

function cartRowTotal(row) {
  return row.basePrice * row.qty;
}

function grandTotal() {
  return cart.reduce((sum, row) => sum + cartRowTotal(row), 0);
}

function renderMenu() {
  menuGrid.innerHTML = "";

  menuItems.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "menu-card";
    card.style.animationDelay = `${index * 55}ms`;

    card.innerHTML = `
      <h3>${item.name}</h3>
      <p class="menu-description">${item.description}</p>
      <div class="price-row">
        <span class="price">${euro(item.price)}</span>
        <button type="button" data-item-id="${item.id}">Valitse</button>
      </div>
    `;

    card.querySelector("button").addEventListener("click", () => openCustomize(item.id));
    menuGrid.appendChild(card);
  });
}

function openCustomize(itemId) {
  selectedItemId = itemId;
  const item = menuItems.find((entry) => entry.id === itemId);

  customizeTitle.textContent = `Muokkaa: ${item.name}`;
  customizePrice.textContent = `Hinta: ${euro(item.price)}`;

  customizeForm.reset();
  qtyInput.value = "1";

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  }
}

function collectSelectedMods(formData) {
  return Object.keys(modLabels).filter((key) => formData.get(key) === "on");
}

function addToCart(row) {
  const existing = cart.find(
    (entry) =>
      entry.itemId === row.itemId &&
      entry.mods.length === row.mods.length &&
      entry.mods.every((mod, idx) => mod === row.mods[idx])
  );

  if (existing) {
    existing.qty += row.qty;
  } else {
    cart.push(row);
  }

  renderCart();
}

function renderCart() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty">Kori on vielä tyhjä.</p>';
  } else {
    cart.forEach((row, index) => {
      const item = document.createElement("article");
      item.className = "cart-item";

      const modsText = row.mods.length ? row.mods.map((key) => modLabels[key]).join(", ") : "Ei lisätäytteitä";

      item.innerHTML = `
        <div class="cart-row">
          <span class="item-name">${row.name}</span>
          <strong>${euro(cartRowTotal(row))}</strong>
        </div>
        <p class="mods">Täytteet: ${modsText}</p>
        <div class="cart-row">
          <div class="qty-controls">
            <button type="button" data-op="minus" data-index="${index}">-</button>
            <span>${row.qty}</span>
            <button type="button" data-op="plus" data-index="${index}">+</button>
          </div>
          <button type="button" class="remove-btn" data-op="remove" data-index="${index}">Poista</button>
        </div>
      `;

      cartItems.appendChild(item);
    });
  }

  const total = grandTotal();
  cartTotal.textContent = euro(total);
  runningTotal.textContent = `Yhteensä ${euro(total)}`;
}

function adjustLine(index, op) {
  const row = cart[index];
  if (!row) {
    return;
  }

  if (op === "plus") {
    row.qty += 1;
  }

  if (op === "minus") {
    row.qty -= 1;
    if (row.qty <= 0) {
      cart.splice(index, 1);
    }
  }

  if (op === "remove") {
    cart.splice(index, 1);
  }

  renderCart();
}

function checkout() {
  if (cart.length === 0) {
    alert("Kori on tyhjä. Lisää ensin tuotteita.");
    return;
  }

  const rows = cart
    .map((row) => {
      const mods = row.mods.length ? row.mods.map((key) => modLabels[key]).join(", ") : "Ei lisätäytteitä";
      return `<li>${row.qty} x ${row.name} (${mods}) - ${euro(cartRowTotal(row))}</li>`;
    })
    .join("");

  receiptContent.innerHTML = `
    <p><strong>Tilaus yhteensä: ${euro(grandTotal())}</strong></p>
    <ul>${rows}</ul>
  `;

  if (typeof receiptDialog.showModal === "function") {
    receiptDialog.showModal();
  }

  cart.length = 0;
  renderCart();
}

customizeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(customizeForm);
  const qty = Number(formData.get("qty"));

  if (!selectedItemId || !Number.isInteger(qty) || qty < 1) {
    return;
  }

  const item = menuItems.find((entry) => entry.id === selectedItemId);
  const mods = collectSelectedMods(formData).sort();

  addToCart({
    itemId: item.id,
    name: item.name,
    basePrice: item.price,
    qty,
    mods,
  });

  dialog.close();
});

cancelCustomize.addEventListener("click", () => dialog.close());

cartItems.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const index = Number(target.dataset.index);
  const op = target.dataset.op;

  if (!Number.isInteger(index) || !op) {
    return;
  }

  adjustLine(index, op);
});

clearCartBtn.addEventListener("click", () => {
  cart.length = 0;
  renderCart();
});

checkoutBtn.addEventListener("click", checkout);
closeReceiptBtn.addEventListener("click", () => receiptDialog.close());

renderMenu();
renderCart();
