document.addEventListener("DOMContentLoaded", () => {
  const adminDashboard = document.querySelector(".admin-dashboard");
  if (!adminDashboard) {
    return; // Not on admin profile page, do nothing.
  }

  const navButtons = adminDashboard.querySelectorAll(".admin-nav-btn");
  const sections = adminDashboard.querySelectorAll(".admin-section");

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Deactivate all buttons and hide all sections
      navButtons.forEach((btn) => btn.classList.remove("active"));
      sections.forEach((section) => {
        section.style.display = "none";
      });

      // Activate the clicked button
      button.classList.add("active");

      // Show the target section
      const targetId = button.dataset.target;
      const targetSection = adminDashboard.querySelector(`#${targetId}`);
      if (targetSection) {
        targetSection.style.display = "block";
      }
    });
  });
});
