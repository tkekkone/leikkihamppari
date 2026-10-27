const MENU_ITEMS = {
  hamburilainen: {
    id: "hamburilainen",
    name: "Hampurilainen",
    price: 4.5,
    description: "Klassinen burgeri ja pehmea sampyla.",
    image: "images/products/hamburilainen.svg",
  },
  tuplisti: {
    id: "tuplisti",
    name: "Tuplisti",
    price: 6.9,
    description: "Tuplapihvi ja tuplasti makua.",
    image: "images/products/tuplisti.svg",
  },
  setti: {
    id: "setti",
    name: "Setti",
    price: 8.9,
    description: "Burgeri + ranskalaiset + juoma.",
    image: "images/products/setti.svg",
  },
  "lasten-ateria": {
    id: "lasten-ateria",
    name: "Lasten ateria",
    price: 5.9,
    description: "Pieni burgeri, mini-ranut ja mehu.",
    image: "images/products/lasten-ateria.svg",
  },
  pitkis: {
    id: "pitkis",
    name: "Pitkis",
    price: 6.4,
    description: "Pitka hampurilainen isoon nalkaan.",
    image: "images/products/pitkis.svg",
    promoPercent: 25,
  },
  kanahampurilainen: {
    id: "kanahampurilainen",
    name: "Kanahampurilainen",
    price: 5.0,
    description: "Rapea kana, raikas maku.",
    image: "images/products/kanahampurilainen.svg",
  },
  lisakkeet: {
    id: "lisakkeet",
    name: "Lisakkeet",
    price: 3.0,
    description: "Valitse lisukkeet annokseen.",
    image: "images/products/lisakkeet.svg",
  },
};

const PRODUCT_PAGE_BY_ID = {
  hamburilainen: "hamburilainen.html",
  tuplisti: "tuplisti.html",
  setti: "setti.html",
  "lasten-ateria": "lasten-ateria.html",
  pitkis: "pitkis.html",
  kanahampurilainen: "kanahampurilainen.html",
  lisakkeet: "lisakkeet.html",
};

const MOD_LABELS = {
  juusto: "Juusto",
  sipuli: "Sipuli",
  kastike: "Kastike",
  tomaatti: "Tomaatti",
  salaatti: "Salaatti",
};

const SIDE_ITEMS = [
  {
    id: "side-sipulirenkaat",
    name: "Sipulirenkaat",
    price: 3.5,
  },
  {
    id: "side-ranskalaiset",
    name: "Ranskalaiset",
    price: 3.0,
  },
  {
    id: "side-pehmis",
    name: "Pehmis",
    price: 2.5,
  },
  {
    id: "side-slush",
    name: "Slush juoma",
    price: 2.8,
  },
];

const CART_KEY = "leikkiburger_cart";
const WINDOW_CART_PREFIX = "__LEIKKIBURGER_CART__=";

function euro(value) {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

function readWindowCart() {
  try {
    const raw = window.name || "";
    if (!raw.startsWith(WINDOW_CART_PREFIX)) {
      return null;
    }

    const payload = raw.slice(WINDOW_CART_PREFIX.length);
    const parsed = JSON.parse(payload);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeWindowCart(cart) {
  try {
    window.name = `${WINDOW_CART_PREFIX}${JSON.stringify(cart)}`;
  } catch {
    // Ignore fallback write errors.
  }
}

function getItemById(itemId) {
  return MENU_ITEMS[itemId];
}

function getSideById(sideId) {
  return SIDE_ITEMS.find((entry) => entry.id === sideId);
}

function getKnownUnitPrice(itemId) {
  const menuItem = getItemById(itemId);
  if (menuItem) {
    return getItemPrice(menuItem);
  }

  const sideItem = getSideById(itemId);
  if (sideItem) {
    return sideItem.price;
  }

  return 0;
}

function getItemPrice(itemOrId) {
  const item = typeof itemOrId === "string" ? getItemById(itemOrId) : itemOrId;
  if (!item) {
    return 0;
  }

  if (!item.promoPercent) {
    return item.price;
  }

  return Number((item.price * (1 - item.promoPercent / 100)).toFixed(2));
}

function hasPromo(itemOrId) {
  const item = typeof itemOrId === "string" ? getItemById(itemOrId) : itemOrId;
  return Boolean(item && item.promoPercent);
}

function getPromoLabel(itemOrId) {
  const item = typeof itemOrId === "string" ? getItemById(itemOrId) : itemOrId;
  if (!item || !item.promoPercent) {
    return "";
  }
  return `-${item.promoPercent}% tarjous`;
}

function normalizeCart(cart) {
  let changed = false;
  const normalized = cart
    .map((row) => {
      if (!row || typeof row !== "object") {
        changed = true;
        return null;
      }

      const itemId = typeof row.itemId === "string" ? row.itemId : "";
      const knownPrice = getKnownUnitPrice(itemId);
      const parsedPrice = Number(row.price);
      const price = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : knownPrice;

      const parsedQty = Number(row.qty);
      const qty = Number.isInteger(parsedQty) && parsedQty > 0 ? parsedQty : 1;

      const mods = Array.isArray(row.mods) ? row.mods.filter((mod) => typeof mod === "string") : [];

      const menuItem = getItemById(itemId);
      const sideItem = getSideById(itemId);
      const fallbackName = menuItem ? menuItem.name : sideItem ? sideItem.name : "Tuote";
      const name = typeof row.name === "string" && row.name.trim() ? row.name : fallbackName;

      const normalizedRow = {
        itemId,
        name,
        price,
        qty,
        mods,
      };

      if (
        row.itemId !== normalizedRow.itemId ||
        row.name !== normalizedRow.name ||
        row.price !== normalizedRow.price ||
        row.qty !== normalizedRow.qty ||
        !Array.isArray(row.mods)
      ) {
        changed = true;
      }

      if (!normalizedRow.itemId || !Number.isFinite(normalizedRow.price) || normalizedRow.price <= 0) {
        changed = true;
        return null;
      }

      return normalizedRow;
    })
    .filter(Boolean);

  return { normalized, changed };
}

function getCart() {
  let parsed = null;
  let fromLocalStorage = false;

  try {
    const localRaw = localStorage.getItem(CART_KEY);
    if (localRaw) {
      const localParsed = JSON.parse(localRaw);
      if (Array.isArray(localParsed)) {
        parsed = localParsed;
        fromLocalStorage = true;
      }
    }
  } catch {
    // localStorage may be blocked on file:// in some browsers.
  }

  const fallback = readWindowCart();
  if (!parsed) {
    parsed = fallback;
  } else if (fromLocalStorage && parsed.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
    // On file:// in some browsers each html can see its own localStorage bucket.
    // If local is empty but fallback has data, prefer fallback to keep pages in sync.
    parsed = fallback;
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const { normalized, changed } = normalizeCart(parsed);
  if (changed) {
    saveCart(normalized);
  }

  return normalized;
}

function saveCart(cart) {
  writeWindowCart(cart);

  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // localStorage may be unavailable; window.name fallback already updated.
  }
}

function addCartRow(itemId, name, price, qty, mods = []) {
  if (!itemId || !name || !Number.isInteger(qty) || qty < 1) {
    return;
  }

  const cart = getCart();
  const sortedMods = [...mods].sort();

  const existing = cart.find(
    (entry) =>
      entry.itemId === itemId &&
      entry.mods.length === sortedMods.length &&
      entry.mods.every((mod, index) => mod === sortedMods[index])
  );

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      itemId,
      name,
      price,
      qty,
      mods: sortedMods,
    });
  }

  saveCart(cart);
}

function addCustomizedItem(itemId, qty, mods) {
  const item = MENU_ITEMS[itemId];
  if (!item) {
    return;
  }

  addCartRow(itemId, item.name, getItemPrice(item), qty, mods);
}

function addSideItem(sideId, qty) {
  const side = SIDE_ITEMS.find((entry) => entry.id === sideId);
  if (!side) {
    return;
  }

  addCartRow(side.id, side.name, side.price, qty, []);
}

function cartTotal(cart = getCart()) {
  return cart.reduce((sum, row) => sum + row.price * row.qty, 0);
}

function cartCount(cart = getCart()) {
  return cart.reduce((sum, row) => sum + row.qty, 0);
}

function removeCartRow(index) {
  const cart = getCart();
  if (index < 0 || index >= cart.length) {
    return;
  }

  cart.splice(index, 1);
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function updateHeaderSummary() {
  const totalEl = document.getElementById("header-total");
  const countEl = document.getElementById("header-count");
  if (!totalEl || !countEl) {
    return;
  }

  const cart = getCart();
  totalEl.textContent = euro(cartTotal(cart));
  countEl.textContent = `${cartCount(cart)} kpl`;
}

function setupCartSync(onCartChange) {
  const refresh = () => {
    if (typeof onCartChange === "function") {
      onCartChange();
    } else {
      updateHeaderSummary();
    }
  };

  window.addEventListener("storage", (event) => {
    if (!event.key || event.key === CART_KEY) {
      refresh();
    }
  });

  window.addEventListener("pageshow", refresh);
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refresh();
    }
  });
}
