// client/scripts/auth.js
document.addEventListener("DOMContentLoaded", () => {
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

  // Открываем окно входа, если не залогинен
  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (isLoggedIn) {
        toggleUserMenu();
      } else {
        showModal(loginModal);
      }
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
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
  function hideModal(modal) {
    modal.style.display = "none";
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
  function updateAuthInterface(isLoggedIn, username = "") {
    const usernameDisplay = document.getElementById("usernameDisplay");
    if (isLoggedIn) {
      usernameDisplay.textContent = username;
    } else {
      usernameDisplay.textContent = "";
    }
  }

  function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const username = localStorage.getItem("username") || "";
    updateAuthInterface(isLoggedIn, username);
  }

  // Отправка формы регистрации
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const userData = {
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
    };
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const result = await response
        .json()
        .catch(() => ({ message: "Невозможно распарсить ответ" }));
      const msgEl = document.getElementById("registerStatusMessage");
      if (response.ok) {
        msgEl.textContent = "Регистрация прошла успешно! Теперь войдите.";
        msgEl.className = "status-message success";
        registerForm.reset();
        setTimeout(() => {
          hideModal(registerModal);
          showModal(loginModal);
        }, 1500);
      } else {
        msgEl.textContent = result.message || "Ошибка регистрации";
        msgEl.className = "status-message error";
      }
    } catch (err) {
      const msgEl = document.getElementById("registerStatusMessage");
      msgEl.textContent = "Сетевая ошибка. Попробуйте позже.";
      msgEl.className = "status-message error";
    }
  });

  // Отправка формы входа
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const userData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const result = await response
        .json()
        .catch(() => ({ message: "Невозможно распарсить ответ" }));
      const msgEl = document.getElementById("loginStatusMessage");
      if (response.ok) {
        msgEl.textContent = "Вход выполнен!";
        msgEl.className = "status-message success";
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", result.user.username);
        localStorage.setItem("token", result.token);
        hideModal(loginModal);
        updateAuthInterface(true, result.user.username);
      } else {
        msgEl.textContent = result.message || "Ошибка входа";
        msgEl.className = "status-message error";
      }
    } catch (err) {
      const msgEl = document.getElementById("loginStatusMessage");
      msgEl.textContent = "Сетевая ошибка. Попробуйте позже.";
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

  // Выход из аккаунта
  logoutBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.clear();
    hideModal(userMenu);
    updateAuthInterface(false);
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
  function togglePasswordVisibility(input, toggle) {
    if (input.type === "password") {
      input.type = "text";
      toggle.textContent = "🙈";
    } else {
      input.type = "password";
      toggle.textContent = "🙉";
    }
  }
  document
    .getElementById("loginPasswordToggle")
    ?.addEventListener("click", () => {
      const input = loginForm.querySelector('[name="password"]');
      if (input)
        togglePasswordVisibility(
          input,
          document.getElementById("loginPasswordToggle")
        );
    });
  document
    .getElementById("registerPasswordToggle")
    ?.addEventListener("click", () => {
      const input = registerForm.querySelector('[name="password"]');
      if (input)
        togglePasswordVisibility(
          input,
          document.getElementById("registerPasswordToggle")
        );
    });
});
