// Простой smoke-тест для проверки, что файл cart.js подключается без ошибок

test("cart.js should load without errors", () => {
  expect(true).toBe(true);
});

// @vitest-environment happy-dom
import { describe, test, beforeEach, afterEach, expect, vi } from "vitest";

import "./cart.js";

describe("Cart page", () => {
  let addToCartButton;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="product-card" data-product-id="123">
        <button class="product-card__btn">Add to Cart</button>
      </div>
      <div id="loginModal"></div>
      <span class="header__cart-count"></span>
    `;
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ cart: [] }),
      })
    );

    document.dispatchEvent(new Event("DOMContentLoaded"));

    addToCartButton = document.querySelector(".product-card__btn");
  });

  afterEach(() => {
    delete global.fetch;
    document.body.innerHTML = "";
  });

  test("add to cart button exists and can be clicked", async () => {
    expect(addToCartButton).not.toBeNull();
    const event = new MouseEvent("click", { bubbles: true });
    addToCartButton.dispatchEvent(event);
    // Ждём завершения асинхронного обработчика
    await Promise.resolve();
    expect(global.fetch).toHaveBeenCalled();
  });
});
