// partials-loader.js

async function loadPartial(url, selector) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network error");
    const html = await response.text();
    document.querySelector(selector).innerHTML = html;
  } catch (e) {
    console.error(`Ошибка загрузки partial: ${url}`, e);
  }
}

// Загружаем header, footer и modal
window.addEventListener("DOMContentLoaded", () => {
  loadPartial("/partials/header", "#header");
  loadPartial("/partials/footer", "#footer");
  loadPartial("/partials/modal", "#modal");
});

// Обработчик клика по карточкам товаров в секции Featured Products
if (document.querySelector(".featured__grid")) {
  document
    .querySelector(".featured__grid")
    .addEventListener("click", function (e) {
      let card = e.target.closest(".product-card");
      if (card) {
        // Пример: для первой карточки (data-slug="gold-ring-diamond") переход на /product/1
        // В реальном проекте лучше использовать data-id
        if (card.dataset.slug === "gold-ring-diamond") {
          window.location.href = "/product/1";
        }
        // Можно добавить другие условия для других карточек
      }
    });
}
