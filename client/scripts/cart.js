// --- Скрипт для корзины: добавление, обновление, оформление заказа ---
document.addEventListener("DOMContentLoaded", () => {
  // --- Глобальная логика "Добавить в корзину" ---
  document.body.addEventListener("click", async (event) => {
    const addToCartButton = event.target.closest(
      ".product-card__btn, .product-info__btn-cart"
    );
    if (!addToCartButton) return;

    event.preventDefault();

    const productCard = event.target.closest(
      ".product-card, .product-detail__container"
    );
    if (!productCard) return;

    const productId = productCard.dataset.productId;
    if (!productId) return;

    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ productId: productId, quantity: 1 }),
      });

      if (response.status === 401) {
        // Not logged in
        document.getElementById("loginModal")?.classList.add("show");
        return;
      }

      if (!response.ok) throw new Error("Failed to add to cart");

      // Optionally, show a success message or animation
      addToCartButton.textContent = "Added!";
      setTimeout(() => {
        addToCartButton.textContent = "Add to Cart";
      }, 2000);

      updateCartIconCount();
    } catch (error) {
      console.error(error);
    }
  });

  // --- Логика для страницы корзины ---
  const cartPage = document.querySelector(".cart-page");
  if (cartPage) {
    const cartItemsContainer = cartPage.querySelector(".cart-items");

    cartItemsContainer.addEventListener("click", async (event) => {
      const target = event.target;
      const cartItem = target.closest(".cart-item");
      if (!cartItem) return;

      const productId = cartItem.dataset.productId;
      const quantityInput = cartItem.querySelector(".quantity__input");
      let currentQuantity = parseInt(quantityInput.value, 10);

      if (target.matches(".quantity__btn--plus")) {
        currentQuantity++;
        updateCartItem(productId, currentQuantity, quantityInput);
      } else if (target.matches(".quantity__btn--minus")) {
        currentQuantity--;
        updateCartItem(productId, currentQuantity, quantityInput);
      } else if (target.matches(".cart-item__remove")) {
        updateCartItem(productId, 0, quantityInput); // Setting quantity to 0 removes it
      }
    });

    cartItemsContainer.addEventListener("change", (event) => {
      const target = event.target;
      if (target.matches(".quantity__input")) {
        const cartItem = target.closest(".cart-item");
        const productId = cartItem.dataset.productId;
        const newQuantity = parseInt(target.value, 10);
        updateCartItem(productId, newQuantity, target);
      }
    });

    // --- Оформление заказа ---
    const checkoutButton = cartPage.querySelector(
      ".button--primary.button--full"
    );
    if (checkoutButton) {
      checkoutButton.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
          const response = await fetch("/api/cart/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          });
          const data = await response.json();
          if (response.ok && data.success) {
            cartPage.querySelector(
              ".cart-content"
            ).innerHTML = `<p class="cart-success-message">Thank you for your purchase!</p>`;
            updateCartIconCount();
          } else {
            alert(data.message || "Checkout failed.");
          }
        } catch (error) {
          alert("Checkout failed.");
        }
      });
    }
  }

  // --- Функция обновления товара в корзине ---
  async function updateCartItem(productId, quantity, inputElement) {
    try {
      const response = await fetch("/api/cart/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) throw new Error("Failed to update cart");

      if (quantity <= 0) {
        inputElement.closest(".cart-item").remove();
      } else {
        inputElement.value = quantity;
      }

      updateCartSummary();
    } catch (error) {
      console.error(error);
    }
  }

  // --- Функция обновления итоговой суммы корзины ---
  function updateCartSummary() {
    const allItems = document.querySelectorAll(".cart-item");
    if (allItems.length === 0) {
      document.querySelector(
        ".cart-content"
      ).innerHTML = `<p class="cart-empty-message">Your cart is empty. <a href="/catalog">Continue shopping</a>.</p>`;
      return;
    }

    let subtotal = 0;
    allItems.forEach((item) => {
      // Убираем все символы кроме цифр и точки
      let priceText = item.querySelector(".cart-item__price").textContent;
      priceText = priceText.replace(/[^\d.\-]/g, "");
      const price = parseFloat(priceText);
      const quantity = parseInt(
        item.querySelector(".quantity__input").value,
        10
      );
      const itemTotal =
        (isNaN(price) ? 0 : price) * (isNaN(quantity) ? 0 : quantity);
      item.querySelector(
        ".cart-item__total-price"
      ).textContent = `$${itemTotal.toFixed(2)}`;
      subtotal += itemTotal;
    });

    document.querySelector(
      ".summary-subtotal"
    ).textContent = `$${subtotal.toFixed(2)}`;
    document.querySelector(
      ".summary-grand-total"
    ).textContent = `$${subtotal.toFixed(2)}`;
  }

  // --- Функция обновления иконки корзины ---
  async function updateCartIconCount() {
    try {
      const response = await fetch("/api/cart");
      if (!response.ok) return;
      const data = await response.json();
      const count = data.cart.reduce((sum, item) => sum + item.quantity, 0);
      const cartCountElement = document.querySelector(".header__cart-count");
      if (cartCountElement) {
        cartCountElement.textContent = count;
        cartCountElement.style.display = count > 0 ? "flex" : "none";
      }
    } catch (error) {
      console.error("Failed to fetch cart count", error);
    }
  }

  // --- Первичное обновление при загрузке страницы ---
  updateCartIconCount();
});
