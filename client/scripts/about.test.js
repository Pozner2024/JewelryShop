// @vitest-environment happy-dom
// Простой smoke-тест для проверки, что файл about.js подключается без ошибок

import { describe, test, beforeEach, afterEach, expect, vi } from "vitest";

// Импортируем сам скрипт, чтобы он выполнился в тестовой среде
import "./about.js";

describe("About page", () => {
  let editButton;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="about-content-display"></div>
      <button id="edit-about-btn"></button>
      <button id="save-about-btn"></button>
      <button id="cancel-about-btn"></button>
      <textarea id="about-content-editor"></textarea>
    `;
    global.tinymce = { get: () => null, init: vi.fn() };

    // Запускаем инициализацию скрипта вручную
    document.dispatchEvent(new Event("DOMContentLoaded"));

    editButton = document.getElementById("edit-about-btn");
  });

  afterEach(() => {
    delete global.tinymce;
    document.body.innerHTML = "";
  });

  test("edit button exists and can be clicked", () => {
    expect(editButton).not.toBeNull();
    editButton.click();
    expect(global.tinymce.init).toHaveBeenCalled();
  });
});
