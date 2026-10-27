let selectedItemId = null;

function renderMenuCards() {
  const menuGrid = document.getElementById("menu-grid");
  if (!menuGrid) {
    return;
  }

  menuGrid.innerHTML = Object.values(MENU_ITEMS)
    .map((item) => {
      const isSidesMenu = item.id === "lisakkeet";
      const promo = hasPromo(item)
        ? `<span class="promo-chip">${getPromoLabel(item)}</span>`
        : "";
      const priceHtml = isSidesMenu
        ? `<span class="price">Erillinen valikko</span>`
        : hasPromo(item)
        ? `<span class="price-old">${euro(item.price)}</span><span class="price promo-price">${euro(getItemPrice(item))}</span>`
        : `<span class="price">${euro(getItemPrice(item))}</span>`;
      return `
      <article class="menu-card">
        <img class="menu-image" src="${item.image}" alt="${item.name}" loading="lazy" />
        <h3>${item.name}</h3>
        <p class="menu-description">${item.description}</p>
        ${promo}
        <div class="price-row">
          <div class="price-stack">${priceHtml}</div>
          <button class="plus-btn" type="button" data-item-id="${item.id}" aria-label="Muokkaa ${item.name}">+</button>
        </div>
      </article>
    `;
    })
    .join("");
}

function renderModalGallery(activeItemId) {
  const gallery = document.getElementById("modal-product-gallery");
  if (!gallery) {
    return;
  }

  gallery.innerHTML = Object.values(MENU_ITEMS)
    .map((entry) => {
      const isActive = entry.id === activeItemId ? "is-active" : "";
      return `
        <button class="gallery-item ${isActive}" type="button" data-item-id="${entry.id}">
          <img src="${entry.image}" alt="${entry.name}" loading="lazy" />
          <span>${entry.name}</span>
        </button>
      `;
    })
    .join("");
}

function openCustomizeDialog(itemId) {
  if (itemId === "lisakkeet") {
    closeCustomizeDialog();
    openSidesDialog();
    return;
  }

  const item = getItemById(itemId);
  const dialog = document.getElementById("customize-dialog");
  const form = document.getElementById("customize-form");

  if (!item || !dialog || !form) {
    return;
  }

  selectedItemId = item.id;
  form.reset();

  document.getElementById("dialog-item-name").textContent = `Muokkaa: ${item.name}`;
  document.getElementById("dialog-item-description").textContent = item.description;
  document.getElementById("dialog-item-image").src = item.image;
  document.getElementById("dialog-item-image").alt = item.name;

  const priceEl = document.getElementById("dialog-item-price");
  if (hasPromo(item)) {
    priceEl.innerHTML = `<span class="price-old">${euro(item.price)}</span> <span class="promo-price">${euro(getItemPrice(item))}</span> <span class="promo-chip">${getPromoLabel(item)}</span>`;
  } else {
    priceEl.textContent = euro(getItemPrice(item));
  }

  renderModalGallery(item.id);

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  }
}

function renderSidesDialog() {
  const sidesGrid = document.getElementById("sides-grid");
  if (!sidesGrid) {
    return;
  }

  sidesGrid.innerHTML = SIDE_ITEMS.map(
    (side) => `
      <label class="side-row" for="${side.id}">
        <span class="side-name">${side.name}</span>
        <span class="side-price">${euro(side.price)}</span>
        <input id="${side.id}" name="${side.id}" type="number" min="0" max="20" value="0" />
      </label>
    `
  ).join("");
}

function openSidesDialog() {
  const dialog = document.getElementById("sides-dialog");
  const form = document.getElementById("sides-form");
  if (!dialog || !form) {
    return;
  }

  form.reset();
  renderSidesDialog();
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  }
}

function closeSidesDialog() {
  const dialog = document.getElementById("sides-dialog");
  if (dialog && typeof dialog.close === "function") {
    dialog.close();
  }
}

function closeCustomizeDialog() {
  const dialog = document.getElementById("customize-dialog");
  if (dialog && typeof dialog.close === "function") {
    dialog.close();
  }
}

function attachMenuEvents() {
  const menuGrid = document.getElementById("menu-grid");
  const form = document.getElementById("customize-form");
  const sidesForm = document.getElementById("sides-form");
  const cancelBtn = document.getElementById("dialog-cancel");
  const sidesCancelBtn = document.getElementById("sides-cancel");
  const status = document.getElementById("menu-status");
  const gallery = document.getElementById("modal-product-gallery");

  menuGrid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest("button[data-item-id]");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    openCustomizeDialog(button.dataset.itemId);
  });

  gallery.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest("button[data-item-id]");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    openCustomizeDialog(button.dataset.itemId);
  });

  cancelBtn.addEventListener("click", closeCustomizeDialog);
  sidesCancelBtn.addEventListener("click", closeSidesDialog);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selectedItemId) {
      return;
    }

    const formData = new FormData(form);
    const qty = Number(formData.get("qty"));
    if (!Number.isInteger(qty) || qty < 1) {
      return;
    }

    const mods = Object.keys(MOD_LABELS).filter((key) => formData.get(key) === "on");
    addCustomizedItem(selectedItemId, qty, mods);
    updateHeaderSummary();

    const item = getItemById(selectedItemId);
    status.textContent = `${item.name} lisatty koriin.`;
    status.classList.add("show");

    closeCustomizeDialog();
  });

  sidesForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(sidesForm);
    let addedLines = 0;

    SIDE_ITEMS.forEach((side) => {
      const qty = Number(formData.get(side.id));
      if (Number.isInteger(qty) && qty > 0) {
        addSideItem(side.id, qty);
        addedLines += 1;
      }
    });

    if (addedLines === 0) {
      status.textContent = "Valitse lisukkeille maara ensin.";
      status.classList.add("show");
      return;
    }

    updateHeaderSummary();
    status.textContent = "Lisukkeet lisatty koriin.";
    status.classList.add("show");
    closeSidesDialog();
  });
}

renderMenuCards();
attachMenuEvents();
updateHeaderSummary();
setupCartSync();
