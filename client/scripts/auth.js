// client/scripts/auth.js
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const profileBtn = document.getElementById("profileBtn");
  const loginModal = document.getElementById("loginModal");
  const registerModal = document.getElementById("registerModal");
  const userMenu = document.getElementById("userMenu");

  const closeLoginModal = document.getElementById("closeLoginModal");
  const closeRegisterModal = document.getElementById("closeRegisterModal");
  const showRegisterModal = document.getElementById("showRegisterModal");
  const showLoginModal = document.getElementById("showLoginModal");

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const logoutBtn = document.getElementById("logoutBtn");

  checkAuthStatus();

  const profileDropdownBtn = document.getElementById("profileDropdownBtn");
  const profileDropdown = document.getElementById("profileDropdown");

  if (profileDropdownBtn) {
    profileDropdownBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      profileDropdown.classList.toggle("show");
    });
  }

  window.addEventListener("click", (event) => {
    if (
      profileDropdown &&
      !profileDropdown.contains(event.target) &&
      !profileDropdownBtn.contains(event.target)
    ) {
      profileDropdown.classList.remove("show");
    }
  });

  // Handle account activation
  if (urlParams.has("activated")) {
    const msgEl = document.getElementById("loginStatusMessage");
    if (msgEl) {
      msgEl.textContent = "Аккаунт успешно активирован. Пожалуйста, войдите.";
      msgEl.className = "status-message success";
    }
    showModal(loginModal);
    // Remove the query parameter from the URL
    const newUrl =
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname;
    window.history.pushState({ path: newUrl }, "", newUrl);
  }

  // Open login modal if url has ?login=true
  if (urlParams.has("login")) {
    const loginOrEmailField = document.querySelector(
      '#loginForm input[name="loginOrEmail"]'
    );
    if (loginOrEmailField) {
      loginOrEmailField.value =
        urlParams.get("user_login") || urlParams.get("user_email") || "";
    }
    showModal(loginModal);
  }

  // Open login window if not logged in
  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showModal(loginModal);
    });
  }

  function toggleUserMenu() {
    if (!userMenu) return;
    const isHidden =
      userMenu.style.display === "none" || !userMenu.style.display;
    if (isHidden) {
      userMenu.style.display = "block";
      const rect = profileBtn.getBoundingClientRect();
      userMenu.style.position = "absolute";
      userMenu.style.top = `${rect.bottom + 10}px`;
      userMenu.style.left = `${rect.left}px`;
    } else {
      userMenu.style.display = "none";
    }
  }

  function showModal(modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function hideModal(modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
  }

  // Закрытие модалей
  closeLoginModal?.addEventListener("click", () => hideModal(loginModal));
  closeRegisterModal?.addEventListener("click", () => hideModal(registerModal));
  loginModal?.addEventListener(
    "click",
    (e) => e.target === loginModal && hideModal(loginModal)
  );
  registerModal?.addEventListener(
    "click",
    (e) => e.target === registerModal && hideModal(registerModal)
  );
  showRegisterModal?.addEventListener("click", (e) => {
    e.preventDefault();
    hideModal(loginModal);
    showModal(registerModal);
  });
  showLoginModal?.addEventListener("click", (e) => {
    e.preventDefault();
    hideModal(registerModal);
    showModal(loginModal);
  });

  // Функция обновления UI по статусу
  function updateAuthInterface(isLoggedIn, userData = null) {
    const usernameDisplay = document.getElementById("usernameDisplay");
    if (isLoggedIn && userData) {
      usernameDisplay.textContent = userData.login;
    } else {
      usernameDisplay.textContent = "";
    }
  }

  function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userData = JSON.parse(localStorage.getItem("userData") || "null");
    updateAuthInterface(isLoggedIn, userData);
  }

  // Registration form submission
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const userData = {
      login: formData.get("login"),
      email: formData.get("email"),
      password: formData.get("password"),
    };
    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(userData),
      });
      const result = await response.json();
      const msgEl = document.getElementById("registerStatusMessage");
      msgEl.textContent = result.message;
      msgEl.className = `status-message ${response.ok ? "success" : "error"}`;

      if (response.ok) {
        registerForm.reset();
        msgEl.textContent =
          "Please check your email and follow the activation link";
      }
    } catch (err) {
      const msgEl = document.getElementById("registerStatusMessage");
      msgEl.textContent = "Ошибка сети. Пожалуйста, попробуйте позже.";
      msgEl.className = "status-message error";
    }
  });

  // Login form submission
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const userData = {
      loginOrEmail: formData.get("loginOrEmail"),
      password: formData.get("password"),
    };
    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const result = await response.json();
      const msgEl = document.getElementById("loginStatusMessage");
      msgEl.textContent = result.message;
      msgEl.className = `status-message ${response.ok ? "success" : "error"}`;

      if (response.ok) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userData", JSON.stringify(result.user));
        hideModal(loginModal);
        updateAuthInterface(true, result.user);
        window.location.reload();
      }
    } catch (err) {
      const msgEl = document.getElementById("loginStatusMessage");
      msgEl.textContent = "Ошибка сети. Пожалуйста, попробуйте позже.";
      msgEl.className = "status-message error";
    }
  });

  // Добавляем токен в заголовки всех запросов fetch
  const originalFetch = window.fetch;
  window.fetch = (input, init = {}) => {
    const token = localStorage.getItem("token");
    init.headers = {
      ...(init.headers || {}),
      ...(token ? { "X-Session-Id": token } : {}),
    };
    return originalFetch(input, init);
  };

  // Logout
  logoutBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await fetch("/api/users/logout");
      localStorage.clear();
      updateAuthInterface(false);
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
    }
  });

  // Плавная прокрутка якорей
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (a) {
      e.preventDefault();
      document
        .getElementById(a.getAttribute("href").slice(1))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // Переключатель видимости пароля
  const toggles = document.querySelectorAll(".password-toggle");
  toggles.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const input = this.previousElementSibling;
      const type = input.type === "password" ? "text" : "password";
      input.type = type;
      this.classList.toggle("show");
    });
  });
});
