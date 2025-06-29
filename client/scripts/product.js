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

// --- Lightbox Gallery ---
(function () {
  // Собираем все изображения галереи
  const mainImg = document.getElementById("mainProductImage");
  const thumbImgs = Array.from(
    document.querySelectorAll(".product-gallery__thumb-img")
  );
  // Массив ссылок на изображения (главное + миниатюры)
  const galleryImages = [mainImg ? mainImg.src : ""].concat(
    thumbImgs.map((img) => img.src)
  );
  let currentGalleryIndex = 0;

  window.openGallery = function (idx) {
    currentGalleryIndex = idx;
    document.getElementById("galleryModal").style.display = "flex";
    document.getElementById("galleryModalImg").src = galleryImages[idx];
  };
  window.closeGallery = function () {
    document.getElementById("galleryModal").style.display = "none";
  };
  window.prevGalleryImg = function () {
    currentGalleryIndex =
      (currentGalleryIndex - 1 + galleryImages.length) % galleryImages.length;
    document.getElementById("galleryModalImg").src =
      galleryImages[currentGalleryIndex];
  };
  window.nextGalleryImg = function () {
    currentGalleryIndex = (currentGalleryIndex + 1) % galleryImages.length;
    document.getElementById("galleryModalImg").src =
      galleryImages[currentGalleryIndex];
  };
  document.addEventListener("keydown", function (e) {
    const modal = document.getElementById("galleryModal");
    if (modal && modal.style.display !== "none") {
      if (e.key === "Escape") closeGallery();
      if (e.key === "ArrowLeft") prevGalleryImg();
      if (e.key === "ArrowRight") nextGalleryImg();
    }
  });
})();
