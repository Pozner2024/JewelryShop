// client/scripts/product.js
// --- Скрипт для страницы товара: выбор размера, количества и т.д. ---
document.addEventListener("DOMContentLoaded", () => {
  // --- Выбор размера ---
  const sizeButtons = document.querySelectorAll(".size-btn");
  if (sizeButtons.length > 0) {
    sizeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        sizeButtons.forEach((btn) => btn.classList.remove("size-btn--active"));
        button.classList.add("size-btn--active");
      });
    });
  }

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
});
