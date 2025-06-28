// Навигация по страницам через JS
// Пример: переход по кнопкам с определёнными id

// Универсальная навигация по страницам через data-nav-url
// Любой элемент с data-nav-url="/somepath" будет осуществлять переход

function updateUrlWithPage(page) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  return url.pathname + url.search;
}

document.addEventListener("DOMContentLoaded", function () {
  document.body.addEventListener("click", function (e) {
    // 1. Пагинация
    const pageBtn = e.target.closest("[data-page]");
    if (pageBtn && !pageBtn.disabled) {
      const page = pageBtn.getAttribute("data-page");
      if (page) {
        console.log("Переход на страницу:", page);
        if (pageBtn.tagName === "A") e.preventDefault();
        window.location.href = updateUrlWithPage(page);
        return;
      }
    }

    // 2. Универсальная навигация по data-nav-url
    const navTarget = e.target.closest("[data-nav-url]");
    if (navTarget) {
      const url = navTarget.getAttribute("data-nav-url");
      if (url) {
        console.log("Навигация по data-nav-url:", url);
        if (navTarget.tagName === "A") e.preventDefault();
        window.location.href = url;
        return;
      }
    }
  });
});
