function getPageItem() {
  const root = document.body;
  const itemId = root.getAttribute("data-item-id");
  return MENU_ITEMS[itemId];
}

function toProductAssetPath(path) {
  return `../${path}`;
}

function renderAllProductImages(currentItemId) {
  const gallery = document.getElementById("all-product-images");
  if (!gallery) {
    return;
  }

  gallery.innerHTML = Object.values(MENU_ITEMS)
    .map((entry) => {
      const isActive = entry.id === currentItemId ? "is-active" : "";
      return `
        <a class="gallery-item ${isActive}" href="${PRODUCT_PAGE_BY_ID[entry.id]}">
          <img src="${toProductAssetPath(entry.image)}" alt="${entry.name}" loading="lazy" />
          <span>${entry.name}</span>
        </a>
      `;
    })
    .join("");
}

function renderProductPage() {
  const item = getPageItem();
  if (!item) {
    return;
  }

  document.getElementById("item-name").textContent = item.name;
  document.getElementById("item-description").textContent = item.description;
  document.getElementById("item-image").src = toProductAssetPath(item.image);
  document.getElementById("item-image").alt = item.name;

  const itemPrice = document.getElementById("item-price");
  if (hasPromo(item)) {
    itemPrice.innerHTML = `<span class="price-old">${euro(item.price)}</span> <span class="promo-price">${euro(getItemPrice(item))}</span> <span class="promo-chip">${getPromoLabel(item)}</span>`;
  } else {
    itemPrice.textContent = euro(getItemPrice(item));
  }

  renderAllProductImages(item.id);

  const form = document.getElementById("customize-form");
  const message = document.getElementById("status-message");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const qty = Number(formData.get("qty"));
    if (!Number.isInteger(qty) || qty < 1) {
      return;
    }

    const mods = Object.keys(MOD_LABELS).filter((key) => formData.get(key) === "on");
    addCustomizedItem(item.id, qty, mods);
    updateHeaderSummary();

    message.textContent = `${item.name} lisatty koriin.`;
    message.classList.add("show");
  });
}

renderProductPage();
updateHeaderSummary();
