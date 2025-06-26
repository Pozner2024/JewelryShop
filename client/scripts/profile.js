// --- Скрипт для страницы профиля/админки ---
document.addEventListener("DOMContentLoaded", () => {
  const adminDashboard = document.querySelector(".admin-dashboard");
  if (!adminDashboard) {
    return; // Не на странице профиля администратора, ничего не делать.
  }

  const navButtons = adminDashboard.querySelectorAll(".admin-nav-btn");
  const sections = adminDashboard.querySelectorAll(".admin-section");

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
});
