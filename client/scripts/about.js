// --- Скрипт для страницы "О нас" (редактирование контента админом) ---
document.addEventListener("DOMContentLoaded", () => {
  const displayDiv = document.getElementById("about-content-display");
  const editButton = document.getElementById("edit-about-btn");
  const saveButton = document.getElementById("save-about-btn");
  const cancelButton = document.getElementById("cancel-about-btn");

  // --- Показать редактор ---
  function showEditor() {
    const editor = tinymce.get("about-content-editor");
    if (editor) {
      editor.show();
    }
    displayDiv.style.display = "none";
    editButton.style.display = "none";
    saveButton.style.display = "inline-block";
    cancelButton.style.display = "inline-block";
  }

  // --- Скрыть редактор ---
  function hideEditor() {
    const editor = tinymce.get("about-content-editor");
    if (editor) {
      editor.hide();
    }
    displayDiv.style.display = "block";
    editButton.style.display = "inline-block";
    saveButton.style.display = "none";
    cancelButton.style.display = "none";
  }

  // --- Обработка кнопки "Редактировать" ---
  if (editButton) {
    editButton.addEventListener("click", () => {
      const editor = tinymce.get("about-content-editor");
      if (editor) {
        showEditor();
      } else {
        tinymce.init({
          selector: "#about-content-editor",
          plugins: "code link lists table",
          toolbar:
            "undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link | code",
          height: 500,
          setup: function (editor) {
            editor.on("init", function () {
              showEditor();
            });
          },
        });
      }
    });
  }

  // --- Обработка кнопки "Отмена" ---
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      hideEditor();
    });
  }

  // --- Обработка кнопки "Сохранить" ---
  if (saveButton) {
    saveButton.addEventListener("click", async () => {
      const editor = tinymce.get("about-content-editor");
      if (!editor) {
        alert("Editor not found!");
        return;
      }

      const content = editor.getContent();

      try {
        const response = await fetch("/about/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: content }),
        });

        if (response.ok) {
          displayDiv.innerHTML = content;
          hideEditor();
        } else {
          alert("Failed to save content.");
        }
      } catch (error) {
        console.error("Error saving content:", error);
        alert("An error occurred while saving.");
      }
    });
  }
});
