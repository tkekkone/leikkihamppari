function renderCartPage() {
  const cartItems = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout");

  const cart = getCart();
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty">Kori on tyhja.</p>';
    cartTotalEl.textContent = euro(0);
    checkoutBtn.disabled = true;
    updateHeaderSummary();
    return;
  }

  cartItems.innerHTML = cart
    .map((row, index) => {
      const rowMods = Array.isArray(row.mods) ? row.mods : [];
      const mods = rowMods.length
        ? rowMods.map((mod) => MOD_LABELS[mod] || mod).join(", ")
        : "Ei lisataytteita";
      return `
        <article class="cart-item">
          <div class="cart-row">
            <span class="item-name">${row.qty} x ${row.name}</span>
            <strong>${euro(row.qty * row.price)}</strong>
          </div>
          <p class="mods">Taytteet: ${mods}</p>
          <button class="remove-btn" data-index="${index}" type="button">Poista rivi</button>
        </article>
      `;
    })
    .join("");

  cartTotalEl.textContent = euro(cartTotal(cart));
  checkoutBtn.disabled = false;
  updateHeaderSummary();
}

document.getElementById("cart-items").addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const index = Number(target.dataset.index);
  if (!Number.isInteger(index)) {
    return;
  }

  removeCartRow(index);
  renderCartPage();
});

document.getElementById("clear-cart").addEventListener("click", () => {
  clearCart();
  renderCartPage();
});

document.getElementById("checkout").addEventListener("click", () => {
  const message = document.getElementById("checkout-message");
  message.textContent = `Tilaus vahvistettu. Summa ${euro(cartTotal())}. Leikkikeittio aloittaa valmistuksen.`;
  message.classList.add("show");
  clearCart();
  renderCartPage();
});

renderCartPage();
setupCartSync(renderCartPage);
