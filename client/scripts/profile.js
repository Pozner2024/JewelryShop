// --- Скрипт для страницы профиля/админки ---
document.addEventListener("DOMContentLoaded", () => {
  const adminDashboard = document.querySelector(".admin-dashboard");
  if (!adminDashboard) {
    return; // Не на странице профиля администратора, ничего не делать.
  }

  const navButtons = adminDashboard.querySelectorAll(".admin-nav-btn");
  const sections = adminDashboard.querySelectorAll(".admin-section");

  // --- Автоматическое переключение на вкладку Products по tab=products ---
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get("tab");
  if (tab === "products") {
    navButtons.forEach((btn) => {
      btn.classList.remove("active");
    });
    sections.forEach((section) => {
      section.style.display = "none";
    });
    const productsBtn = Array.from(navButtons).find(
      (btn) => btn.dataset.target === "products-section"
    );
    const productsSection = adminDashboard.querySelector("#products-section");
    if (productsBtn && productsSection) {
      productsBtn.classList.add("active");
      productsSection.style.display = "block";
    }
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Деактивировать все кнопки и скрыть все секции
      navButtons.forEach((btn) => btn.classList.remove("active"));
      sections.forEach((section) => {
        section.style.display = "none";
      });

      // Активировать нажатую кнопку
      button.classList.add("active");

      // Показать целевую секцию
      const targetId = button.dataset.target;
      const targetSection = adminDashboard.querySelector(`#${targetId}`);
      if (targetSection) {
        targetSection.style.display = "block";
      }
    });
  });

  // --- Обработка отправки формы добавления товара ---
  const addProductForm = document.getElementById("addProductForm");
  if (addProductForm) {
    addProductForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = new FormData(addProductForm);
      // Проверяем, выбраны ли файлы
      const hasFiles = Array.from(formData.getAll("images")).some(
        (f) => f && f.size > 0
      );
      if (hasFiles) {
        // Отправляем как multipart/form-data
        try {
          const response = await fetch("/admin/products/new", {
            method: "POST",
            body: formData,
          });
          if (response.ok) {
            closeAddProductModal();
            window.location.href = window.location.pathname + "?tab=products";
          } else {
            alert("Failed to add product");
          }
        } catch (err) {
          alert("Error: " + err.message);
        }
      } else {
        // Если файлов нет — отправляем как JSON (старый вариант)
        const data = {
          name: formData.get("name"),
          price: formData.get("price"),
          old_price: formData.get("old_price"),
          brand: formData.get("brand"),
          article: formData.get("article"),
          category: formData.get("category"),
          description: formData.get("description"),
        };
        const specifications = {};
        if (formData.get("spec_material"))
          specifications.material = formData.get("spec_material");
        if (formData.get("spec_stone_type"))
          specifications.stone_type = formData.get("spec_stone_type");
        if (formData.get("spec_weight"))
          specifications.weight = formData.get("spec_weight");
        if (formData.get("spec_length"))
          specifications.length = formData.get("spec_length");
        data.spec_json = JSON.stringify(specifications);
        try {
          const response = await fetch("/admin/products/new", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (response.ok) {
            closeAddProductModal();
            window.location.href = window.location.pathname + "?tab=products";
          } else {
            alert("Failed to add product");
          }
        } catch (err) {
          alert("Error: " + err.message);
        }
      }
    });
  }

  // --- Фильтрация по категориям ---
  document.querySelectorAll(".btn-filter").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".btn-filter")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.category;
      document.querySelectorAll(".admin-table tbody tr").forEach((row) => {
        if (cat === "all" || row.dataset.category === cat) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  });

  // --- Предпросмотр и drag&drop для изображений ---
  setupImagePreview("addProductForm", "add-dropzone", "add-image-preview");
  setupImagePreview("editProductForm", "edit-dropzone", "edit-image-preview");
});

// --- Модальное окно Add Product ---
window.showAddProductModal = function () {
  const modal = document.getElementById("addProductModal");
  if (modal) {
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }
};
window.closeAddProductModal = function () {
  const modal = document.getElementById("addProductModal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
};

// --- Удаление товара ---
window.deleteProduct = async function (id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  try {
    const response = await fetch(`/admin/products/${id}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      window.location.href = window.location.pathname + "?tab=products";
    } else {
      const data = await response.json();
      alert(data.error || "Failed to delete product");
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
};

// --- Модальное окно Edit Product ---
window.showEditProductModal = function (product) {
  const modal = document.getElementById("editProductModal");
  const form = document.getElementById("editProductForm");
  if (modal && form) {
    form.id.value = product.id;
    form.name.value = product.name;
    form.price.value = product.price;
    form.old_price.value = product.old_price || "";
    form.brand.value = product.brand || "";
    form.article.value = product.article || "";
    form.category.value = product.category || "";
    form.description.value = product.description || "";
    // Автозаполнение характеристик
    let specs = {};
    try {
      if (product.spec_json) {
        specs =
          typeof product.spec_json === "string"
            ? JSON.parse(product.spec_json)
            : product.spec_json;
      }
    } catch (e) {
      specs = {};
    }
    form.spec_material.value = specs.material || "";
    form.spec_stone_type.value = specs.stone_type || "";
    form.spec_weight.value = specs.weight || "";
    form.spec_length.value = specs.length || "";
    // Предпросмотр уже загруженных изображений с drag&drop и удалением
    const preview = document.getElementById("edit-image-preview");
    preview.innerHTML = "";
    let images = [];
    try {
      if (product.images) {
        images =
          typeof product.images === "string"
            ? JSON.parse(product.images || "[]")
            : product.images;
      }
    } catch (e) {
      images = [];
    }
    if (!Array.isArray(images)) {
      images = [];
    }
    // Сохраняем массив в window для drag&drop, всегда длиной 4
    window._editImages = images.slice(0, 4);
    while (window._editImages.length < 4) window._editImages.push(null);
    if (form.existing_images) {
      form.existing_images.value = JSON.stringify(window._editImages);
    }
    function renderEditImages() {
      preview.innerHTML = "";
      for (let idx = 0; idx < 4; idx++) {
        const url = window._editImages[idx];
        const item = document.createElement("div");
        item.className = "image-preview__item";
        item.draggable = true;
        item.ondragstart = function (ev) {
          ev.dataTransfer.setData("text/plain", idx);
          item.classList.add("dragging");
        };
        item.ondragend = function () {
          item.classList.remove("dragging");
        };
        item.ondragover = function (ev) {
          ev.preventDefault();
          item.classList.add("dragover");
        };
        item.ondragleave = function () {
          item.classList.remove("dragover");
        };
        item.ondrop = function (ev) {
          ev.preventDefault();
          item.classList.remove("dragover");
          const fromIdx = +ev.dataTransfer.getData("text/plain");
          if (fromIdx !== idx) {
            const arr = window._editImages;
            const temp = arr[fromIdx];
            arr[fromIdx] = arr[idx];
            arr[idx] = temp;
            renderEditImages();
          }
        };
        if (url) {
          const img = document.createElement("img");
          img.src = url;
          item.appendChild(img);
          // Кнопка удаления
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "image-preview__remove";
          btn.innerHTML = "&times;";
          btn.title = "Удалить изображение";
          btn.onclick = function () {
            window._editImages[idx] = null;
            renderEditImages();
            if (form.existing_images) {
              form.existing_images.value = JSON.stringify(window._editImages);
            }
          };
          item.appendChild(btn);
        }
        preview.appendChild(item);
      }
      // После любого изменения превью обновляем скрытое поле
      if (form.existing_images) {
        form.existing_images.value = JSON.stringify(window._editImages);
      }
    }
    renderEditImages();
    // modal open
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }
};
window.closeEditProductModal = function () {
  const modal = document.getElementById("editProductModal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
};

// --- Обработка отправки формы редактирования товара ---
document.addEventListener("DOMContentLoaded", () => {
  const editProductForm = document.getElementById("editProductForm");
  if (editProductForm) {
    editProductForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = new FormData(editProductForm);
      const id = formData.get("id");
      // Проверяем, выбраны ли файлы
      const hasFiles = Array.from(formData.getAll("images")).some(
        (f) => f && f.size > 0
      );
      if (hasFiles) {
        try {
          const response = await fetch(`/admin/products/${id}/edit`, {
            method: "POST",
            body: formData,
          });
          if (response.ok) {
            closeEditProductModal();
            window.location.href = window.location.pathname + "?tab=products";
          } else {
            alert("Failed to update product");
          }
        } catch (err) {
          alert("Error: " + err.message);
        }
      } else {
        const data = {
          name: formData.get("name"),
          price: formData.get("price"),
          old_price: formData.get("old_price"),
          brand: formData.get("brand"),
          article: formData.get("article"),
          category: formData.get("category"),
          description: formData.get("description"),
        };
        const specifications = {};
        if (formData.get("spec_material"))
          specifications.material = formData.get("spec_material");
        if (formData.get("spec_stone_type"))
          specifications.stone_type = formData.get("spec_stone_type");
        if (formData.get("spec_weight"))
          specifications.weight = formData.get("spec_weight");
        if (formData.get("spec_length"))
          specifications.length = formData.get("spec_length");
        data.spec_json = JSON.stringify(specifications);
        try {
          const response = await fetch(`/admin/products/${id}/edit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (response.ok) {
            closeEditProductModal();
            window.location.href = window.location.pathname + "?tab=products";
          } else {
            alert("Failed to update product");
          }
        } catch (err) {
          alert("Error: " + err.message);
        }
      }
    });
  }
});

// --- Изменить функцию editProduct для открытия модалки ---
window.editProduct = function (id) {
  // Найти данные товара в таблице (можно хранить их в data-атрибутах или искать по products в window)
  const row = document
    .querySelector(`button[onclick='editProduct(${id})']`)
    .closest("tr");
  const product = {
    id,
    name: row.children[1].textContent,
    price: row.children[2].textContent,
    brand: row.children[3].textContent,
    description: row.dataset.description || "",
    old_price: row.dataset.oldPrice || "",
    article: row.dataset.article || "",
    category: row.dataset.category || "",
    spec_json: row.dataset.specJson || "",
    images: row.dataset.images || "",
  };
  showEditProductModal(product);
};

// --- Предпросмотр и drag&drop для изображений ---
function setupImagePreview(formId, dropzoneId, previewId) {
  const form = document.getElementById(formId);
  if (!form) return;
  const dropzone = document.getElementById(dropzoneId);
  const preview = document.getElementById(previewId);
  const fileInputs = form.querySelectorAll('input[type="file"][name="images"]');

  // Предпросмотр
  function updatePreview() {
    preview.innerHTML = "";
    fileInputs.forEach((input, idx) => {
      if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const item = document.createElement("div");
          item.className = "image-preview__item";
          item.draggable = true;
          // Drag&Drop сортировка
          item.ondragstart = function (ev) {
            ev.dataTransfer.setData("text/plain", idx);
            item.classList.add("dragging");
          };
          item.ondragend = function () {
            item.classList.remove("dragging");
          };
          item.ondragover = function (ev) {
            ev.preventDefault();
            item.classList.add("dragover");
          };
          item.ondragleave = function () {
            item.classList.remove("dragover");
          };
          item.ondrop = function (ev) {
            ev.preventDefault();
            item.classList.remove("dragover");
            const fromIdx = +ev.dataTransfer.getData("text/plain");
            const toIdx = idx;
            if (fromIdx !== toIdx) {
              // Меняем файлы местами
              const dtFrom = new DataTransfer();
              if (fileInputs[fromIdx].files[0])
                dtFrom.items.add(fileInputs[fromIdx].files[0]);
              const dtTo = new DataTransfer();
              if (fileInputs[toIdx].files[0])
                dtTo.items.add(fileInputs[toIdx].files[0]);
              fileInputs[fromIdx].files = dtTo.files;
              fileInputs[toIdx].files = dtFrom.files;
              updatePreview();
            }
          };
          const img = document.createElement("img");
          img.src = e.target.result;
          item.appendChild(img);
          // Кнопка удаления
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "image-preview__remove";
          btn.innerHTML = "&times;";
          btn.title = "Удалить изображение";
          btn.onclick = function () {
            input.value = "";
            updatePreview();
          };
          item.appendChild(btn);
          preview.appendChild(item);
        };
        reader.readAsDataURL(input.files[0]);
      }
    });
  }
  fileInputs.forEach((input) => {
    input.addEventListener("change", updatePreview);
  });

  // Drag&Drop
  if (dropzone) {
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
    dropzone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    });
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      const files = Array.from(e.dataTransfer.files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, fileInputs.length);
      let inputIdx = 0;
      files.forEach((file) => {
        // Найти первый свободный input
        while (
          inputIdx < fileInputs.length &&
          fileInputs[inputIdx].files.length > 0
        ) {
          inputIdx++;
        }
        if (inputIdx < fileInputs.length) {
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInputs[inputIdx].files = dt.files;
          inputIdx++;
        }
      });
      updatePreview();
    });
    // Клик по зоне — открыть первый input
    dropzone.addEventListener("click", () => {
      if (fileInputs[0]) fileInputs[0].click();
    });
  }
}
