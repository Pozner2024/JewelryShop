// client/scripts/product.js
// --- Выбор количества ---
const quantityBlock = document.querySelector(".quantity");
if (quantityBlock) {
  const minusBtn = quantityBlock.querySelector(".quantity__btn--minus");
  const plusBtn = quantityBlock.querySelector(".quantity__btn--plus");
  const quantityInput = quantityBlock.querySelector(".quantity__input");

  minusBtn.addEventListener("click", () => {
    let currentValue = parseInt(quantityInput.value, 10);
    if (currentValue > quantityInput.min) {
      quantityInput.value = currentValue - 1;
    }
  });

  plusBtn.addEventListener("click", () => {
    let currentValue = parseInt(quantityInput.value, 10);
    if (currentValue < quantityInput.max) {
      quantityInput.value = currentValue + 1;
    }
  });

  quantityInput.addEventListener("change", () => {
    let currentValue = parseInt(quantityInput.value, 10);
    const min = parseInt(quantityInput.min, 10);
    const max = parseInt(quantityInput.max, 10);
    if (currentValue < min) {
      quantityInput.value = min;
    }
    if (currentValue > max) {
      quantityInput.value = max;
    }
  });
}

// Переключение вкладок на странице товара
const tabButtons = document.querySelectorAll(".tabs__btn");
const tabPanels = document.querySelectorAll(".tabs__panel");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", function () {
    // Убираем активный класс у всех кнопок и панелей
    tabButtons.forEach((b) => b.classList.remove("tabs__btn--active"));
    tabPanels.forEach((p) => p.classList.remove("tabs__panel--active"));

    // Добавляем активный класс к выбранной кнопке и панели
    btn.classList.add("tabs__btn--active");
    const panelName = btn.getAttribute("data-tab");
    document
      .querySelector(`.tabs__panel[data-panel='${panelName}']`)
      .classList.add("tabs__panel--active");
  });
});
