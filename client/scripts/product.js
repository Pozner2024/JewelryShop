// client/scripts/product.js
document.addEventListener("DOMContentLoaded", () => {
  initProductGallery();
  initSizeSelection();
  initQuantityControls();
  initTabs();
  initWishlist();
  initProductCardClicks();
});

function initProductGallery() {
  const mainImage = document.getElementById("mainProductImage");
  document.querySelectorAll(".product-gallery__thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      document
        .querySelectorAll(".product-gallery__thumb--active")
        .forEach((t) => t.classList.remove("product-gallery__thumb--active"));
      thumb.classList.add("product-gallery__thumb--active");
      const img = thumb.querySelector(".product-gallery__thumb-img");
      if (mainImage && img) {
        mainImage.src = img.src;
        mainImage.alt = img.alt;
      }
    });
  });
}

function initSizeSelection() {
  document.querySelectorAll(".size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".size-btn--active")
        .forEach((b) => b.classList.remove("size-btn--active"));
      btn.classList.add("size-btn--active");
    });
  });
}

function initQuantityControls() {
  const input = document.querySelector(".quantity__input");
  const minus = document.querySelector(".quantity__btn--minus");
  const plus = document.querySelector(".quantity__btn--plus");
  if (!input || !minus || !plus) return;

  minus.addEventListener("click", () => {
    const min = parseInt(input.min) || 1;
    input.value = Math.max(parseInt(input.value) - 1, min);
  });
  plus.addEventListener("click", () => {
    const max = parseInt(input.max) || Infinity;
    input.value = Math.min(parseInt(input.value) + 1, max);
  });
  input.addEventListener("change", () => {
    const val = parseInt(input.value);
    const min = parseInt(input.min) || 1;
    const max = parseInt(input.max) || Infinity;
    input.value = isNaN(val) ? min : Math.min(Math.max(val, min), max);
  });
}

function initTabs() {
  document.querySelectorAll(".tabs__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      document
        .querySelectorAll(".tabs__btn--active")
        .forEach((b) => b.classList.remove("tabs__btn--active"));
      document
        .querySelectorAll(".tabs__panel--active")
        .forEach((p) => p.classList.remove("tabs__panel--active"));
      btn.classList.add("tabs__btn--active");
      document
        .querySelector(`.tabs__panel[data-panel="${target}"]`)
        ?.classList.add("tabs__panel--active");
    });
  });
}

function initWishlist() {
  document
    .querySelectorAll(".product-gallery__wishlist, .product-card__wishlist")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        btn.classList.toggle("wishlist--active");
        const heart = btn.querySelector(
          ".product-gallery__heart, .product-card__heart"
        );
        if (heart) {
          if (btn.classList.contains("wishlist--active")) {
            heart.style.fill = "#e74c3c";
            btn.title = "Remove from wishlist";
          } else {
            heart.style.fill = "none";
            btn.title = "Add to wishlist";
          }
        }
      });
    });
}

function initProductCardClicks() {
  document.querySelectorAll(".product-card").forEach((card) => {
    const slug = card.dataset.slug;
    card.addEventListener("click", (e) => {
      if (
        e.target.closest(
          ".product-card__wishlist, .product-card__add-to-cart, .product-card__quick-view"
        )
      )
        return;
      if (slug === "gold-ring-diamond") {
        window.location.href = "product.html";
      } else if (slug) {
        window.location.href = `/product/${slug}`;
      }
    });
    // Визуальные эффекты:
    card.style.cursor = "pointer";
    card.addEventListener(
      "mousedown",
      () => (card.style.transform = "scale(0.98) translateY(-4px)")
    );
    ["mouseup", "mouseleave"].forEach((evt) =>
      card.addEventListener(evt, () => (card.style.transform = ""))
    );
  });
}

// Делегированный Add to Cart
document.addEventListener("click", (e) => {
  if (e.target.matches(".product-info__btn-cart, .product-card__add-to-cart")) {
    e.preventDefault();
    addToCartAnimation(e.target);
    // здесь можно вызвать actual add-to-cart
  }
  if (e.target.matches(".product-info__btn-buy")) {
    e.preventDefault();
    const data = getProductData(e.target);
    showQuickOrderModal(data);
  }
});

function addToCartAnimation(btn) {
  const txt = btn.textContent;
  btn.textContent = "Added!";
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = txt;
    btn.disabled = false;
  }, 1500);
}

function getProductData(btn) {
  // Пример: собираем данные о товаре с карточки или страницы
  const product = btn.closest(".product-info, .product-card");
  if (!product) return {};
  return {
    title:
      product.querySelector(".product-title")?.textContent || "Быстрый заказ",
    body: `
      <div>
        <p>Товар: <strong>${
          product.querySelector(".product-title")?.textContent || ""
        }</strong></p>
        <p>Цена: <strong>${
          product.querySelector(".product-price")?.textContent || ""
        }</strong></p>
        <button class="modal-order-btn">Оформить заказ</button>
      </div>
    `,
  };
}

async function showQuickOrderModal(data) {
  // data: {title, body}
  const modal = document.getElementById("main-modal");
  if (!modal) return;
  // Загружаем partial с сервера с нужными данными
  const params = new URLSearchParams({
    title: data.title,
    body: data.body,
  });
  const response = await fetch(`/partials/modal?${params.toString()}`);
  const html = await response.text();
  modal.outerHTML = html;
  const newModal = document.getElementById("main-modal");
  newModal.style.display = "flex";
  document.body.style.overflow = "hidden";
  // Закрытие по крестику и фону
  newModal.querySelector("#close-modal").onclick = () => {
    newModal.style.display = "none";
    document.body.style.overflow = "auto";
  };
  newModal.onclick = (e) => {
    if (e.target === newModal) {
      newModal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  };
}
