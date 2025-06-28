// --- Admin Products Page Logic ---

document.addEventListener("DOMContentLoaded", function () {
  // Форма добавления продукта (если есть)
  const addProductForm = document.getElementById("addProductForm");
  if (addProductForm) {
    addProductForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = new FormData(addProductForm);
      // ...добавьте остальные текстовые поля, как раньше...
      // Отправляем форму с файлами
      const response = await fetch("/admin/products/new", {
        method: "POST",
        body: formData, // НЕ указывайте Content-Type, browser сам выставит boundary!
      });
      // ...обработка ответа...
    });
  }

  // Preview & Drag-n-drop for images
  const imageInputs = document.querySelectorAll(
    'input[type="file"][name="images"]'
  );
  const previewContainer = document.getElementById("image-preview");
  if (imageInputs.length && previewContainer) {
    imageInputs.forEach((input, idx) => {
      input.addEventListener("change", function () {
        updatePreview();
      });
    });
  }

  function updatePreview() {
    if (!previewContainer) return;
    previewContainer.innerHTML = "";
    imageInputs.forEach((input, idx) => {
      if (input.files.length > 0) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(input.files[0]);
        img.style.maxWidth = "100px";
        img.style.margin = "0 8px 8px 0";
        img.className = "image-preview__item";
        previewContainer.appendChild(img);
        // Drag & drop events
        img.draggable = true;
        img.ondragstart = function (e) {
          e.dataTransfer.setData("text/plain", idx);
          img.classList.add("dragging");
        };
        img.ondragend = function () {
          img.classList.remove("dragging");
        };
        img.ondragover = function (e) {
          e.preventDefault();
          img.classList.add("dragover");
        };
        img.ondragleave = function () {
          img.classList.remove("dragover");
        };
        img.ondrop = function (e) {
          e.preventDefault();
          img.classList.remove("dragover");
          const fromIdx = +e.dataTransfer.getData("text/plain");
          const toIdx = idx;
          if (fromIdx !== toIdx) {
            // Меняем файлы местами
            const dtFrom = new DataTransfer();
            if (imageInputs[fromIdx].files[0])
              dtFrom.items.add(imageInputs[fromIdx].files[0]);
            const dtTo = new DataTransfer();
            if (imageInputs[toIdx].files[0])
              dtTo.items.add(imageInputs[toIdx].files[0]);
            imageInputs[fromIdx].files = dtTo.files;
            imageInputs[toIdx].files = dtFrom.files;
            updatePreview();
          }
        };
      }
    });
  }

  // Dropzone logic (если есть dropzone)
  const dropzone = document.getElementById("dropzone");
  if (dropzone && imageInputs.length) {
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      const files = Array.from(e.dataTransfer.files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, imageInputs.length);
      let inputIdx = 0;
      files.forEach((file) => {
        // Найти первый свободный input
        while (
          inputIdx < imageInputs.length &&
          imageInputs[inputIdx].files.length > 0
        ) {
          inputIdx++;
        }
        if (inputIdx < imageInputs.length) {
          const dt = new DataTransfer();
          dt.items.add(file);
          imageInputs[inputIdx].files = dt.files;
          inputIdx++;
        }
      });
      updatePreview();
    });
  }

  // Функция смены главного изображения
  window.setMainImage = function (url) {
    const mainImg = document.getElementById("mainProductImage");
    if (mainImg) mainImg.src = url;
  };

  // Custom file input logic
  document.querySelectorAll(".custom-file-input").forEach(function (input) {
    var label = input.closest(".custom-file-label");
    var fileNameSpan = label.querySelector(".custom-file-name");
    var fileTextSpan = label.querySelector(".custom-file-text");
    fileTextSpan.addEventListener("click", function () {
      input.click();
    });
    input.addEventListener("change", function () {
      if (input.files && input.files.length > 0) {
        fileNameSpan.textContent = input.files[0].name;
      } else {
        fileNameSpan.textContent = "";
      }
    });
  });
});
