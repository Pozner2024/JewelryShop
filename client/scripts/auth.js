// --- Скрипт авторизации и регистрации пользователя ---
document.addEventListener("DOMContentLoaded", () => {
  // --- Получение элементов DOM ---
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

  // --- Обработчик выпадающего меню профиля ---
  if (profileDropdownBtn) {
    console.log("Навешиваю обработчик на profileDropdownBtn");
    profileDropdownBtn.addEventListener("click", (event) => {
      console.log("Клик по иконке профиля!");
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

  // --- Обработка активации аккаунта через ссылку ---
  if (urlParams.has("activated")) {
    const msgEl = document.getElementById("loginStatusMessage");
    if (msgEl) {
      msgEl.textContent = "Account successfully activated. Please log in.";
      msgEl.className = "status-message success";
    }
    showModal(loginModal);
    // Удаляем параметр из URL
    const newUrl =
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname;
    window.history.pushState({ path: newUrl }, "", newUrl);
  }

  // --- Открытие модального окна входа, если есть ?login=true ---
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

  // --- Открытие окна входа, если пользователь не авторизован ---
  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showModal(loginModal);
    });
  }

  // --- Переключение отображения меню пользователя ---
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

  // --- Показать модальное окно ---
  function showModal(modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  // --- Скрыть модальное окно ---
  function hideModal(modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
  }

  // --- Закрытие модальных окон ---
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

  // --- Обновление интерфейса в зависимости от статуса авторизации ---
  function updateAuthInterface(isLoggedIn, userData = null) {
    const usernameDisplay = document.getElementById("usernameDisplay");
    if (isLoggedIn && userData) {
      usernameDisplay.textContent = userData.login;
    } else {
      usernameDisplay.textContent = "";
    }
  }

  // --- Проверка статуса авторизации пользователя ---
  function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userData = JSON.parse(localStorage.getItem("userData") || "null");
    updateAuthInterface(isLoggedIn, userData);
  }

  // --- Обработка отправки формы регистрации ---
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
          "Check your email and follow the link to activate your account";
      }
    } catch (err) {
      const msgEl = document.getElementById("registerStatusMessage");
      msgEl.textContent = "Network error. Please try again later.";
      msgEl.className = "status-message error";
    }
  });

  // --- Обработка отправки формы входа ---
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
      msgEl.textContent = "Network error. Please try again later.";
      msgEl.className = "status-message error";
    }
  });

  // --- Добавление токена в заголовки всех fetch-запросов ---
  const originalFetch = window.fetch;
  window.fetch = (input, init = {}) => {
    const token = localStorage.getItem("token");
    init.headers = {
      ...(init.headers || {}),
      ...(token ? { "X-Session-Id": token } : {}),
    };
    return originalFetch(input, init);
  };

  // --- Обработка выхода пользователя ---
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

  // --- Плавная прокрутка к якорям ---
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (a) {
      e.preventDefault();
      const anchorId = a.getAttribute("href").slice(1);
      if (anchorId) {
        document
          .getElementById(anchorId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  // --- Переключатель видимости пароля ---
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
