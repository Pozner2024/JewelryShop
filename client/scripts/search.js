// Скрипт для отображения поисковой строки по клику на лупу в хэдере

document.addEventListener("DOMContentLoaded", function () {
  const searchContainer = document.querySelector(".header__search");
  const searchBtn = document.querySelector(".header__search-btn");
  const searchForm = document.querySelector(".header__search-form");
  const searchInput = document.querySelector(".header__search-input");

  let autocompleteBox;
  let suggestions = [];
  let selectedIndex = -1;

  if (!searchBtn || !searchForm) return;

  searchBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    searchContainer.classList.toggle("header__search--active");
    if (searchContainer.classList.contains("header__search--active")) {
      searchInput.focus();
    }
  });

  document.addEventListener("click", function (e) {
    if (!searchContainer.contains(e.target)) {
      searchContainer.classList.remove("header__search--active");
    }
  });

  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `/catalog?search=${encodeURIComponent(query)}`;
    }
  });

  // --- AUTOCOMPLETE ---
  function closeAutocomplete() {
    if (autocompleteBox) {
      autocompleteBox.remove();
      autocompleteBox = null;
      suggestions = [];
      selectedIndex = -1;
    }
  }

  function renderAutocomplete(items) {
    closeAutocomplete();
    if (!items.length) return;
    autocompleteBox = document.createElement("ul");
    autocompleteBox.className = "search-autocomplete";
    items.forEach((item, idx) => {
      const li = document.createElement("li");
      li.textContent = item.name;
      li.tabIndex = 0;
      li.className = "search-autocomplete__item";
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        window.location.href = `/product/${item.id}`;
      });
      autocompleteBox.appendChild(li);
    });
    searchContainer.appendChild(autocompleteBox);
  }

  searchInput.addEventListener("input", async function () {
    const q = searchInput.value.trim();
    if (q.length < 2) {
      closeAutocomplete();
      return;
    }
    try {
      const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      suggestions = data;
      renderAutocomplete(data);
    } catch (e) {
      closeAutocomplete();
    }
  });

  searchInput.addEventListener("blur", () => {
    setTimeout(closeAutocomplete, 100);
  });

  // Клавиатурная навигация
  searchInput.addEventListener("keydown", (e) => {
    if (!autocompleteBox || !suggestions.length) return;
    const items = Array.from(autocompleteBox.children);
    if (e.key === "ArrowDown") {
      selectedIndex = (selectedIndex + 1) % items.length;
      items.forEach((el, i) =>
        el.classList.toggle("active", i === selectedIndex)
      );
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      items.forEach((el, i) =>
        el.classList.toggle("active", i === selectedIndex)
      );
      e.preventDefault();
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      window.location.href = `/product/${suggestions[selectedIndex].id}`;
      closeAutocomplete();
      e.preventDefault();
    }
  });
});
