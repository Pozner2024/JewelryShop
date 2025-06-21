document.addEventListener("DOMContentLoaded", () => {
  const displayDiv = document.getElementById("about-content-display");
  const editorDiv = document.getElementById("about-content-editor");
  const editButton = document.getElementById("edit-about-btn");
  const saveButton = document.getElementById("save-about-btn");
  const cancelButton = document.getElementById("cancel-about-btn");
  const textarea = document.getElementById("about-content-textarea");

  let editor;

  // Function to initialize the editor
  function initializeEditor(data) {
    if (editor) {
      editor.destroy();
    }
    editor = new EditorJS({
      holder: "about-content-editor",
      data: data,
      readOnly: false,
    });
  }

  // Function to render blocks to HTML
  function renderBlocks(blocks) {
    let html = "";
    blocks.forEach((block) => {
      switch (block.type) {
        case "header":
          html += `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
          break;
        case "paragraph":
          html += `<p>${block.data.text}</p>`;
          break;
        case "list":
          const listStyle = block.data.style === "ordered" ? "ol" : "ul";
          html += `<${listStyle}>`;
          block.data.items.forEach((item) => {
            html += `<li>${item}</li>`;
          });
          html += `</${listStyle}>`;
          break;
        // Add other block types here as needed
        default:
          console.log("Unknown block type", block.type);
          break;
      }
    });
    return html;
  }

  // Initial content rendering
  try {
    const initialContent = JSON.parse(displayDiv.innerHTML);
    if (initialContent.blocks) {
      displayDiv.innerHTML = renderBlocks(initialContent.blocks);
    }
  } catch (e) {
    // Content is likely plain HTML, do nothing
  }

  if (editButton) {
    editButton.addEventListener("click", () => {
      const currentContent = JSON.parse(
        textarea.value || displayDiv.dataset.raw
      );

      displayDiv.style.display = "none";
      editorDiv.style.display = "block";
      editButton.style.display = "none";
      saveButton.style.display = "inline-block";
      cancelButton.style.display = "inline-block";

      initializeEditor(currentContent);
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      if (editor) {
        editor.destroy();
      }
      displayDiv.style.display = "block";
      editorDiv.style.display = "none";
      editButton.style.display = "inline-block";
      saveButton.style.display = "none";
      cancelButton.style.display = "none";
    });
  }

  if (saveButton) {
    saveButton.addEventListener("click", async () => {
      try {
        const outputData = await editor.save();
        const response = await fetch("/about/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: JSON.stringify(outputData) }),
        });

        if (response.ok) {
          const newContentHtml = renderBlocks(outputData.blocks);
          displayDiv.innerHTML = newContentHtml;
          displayDiv.dataset.raw = JSON.stringify(outputData);

          // Toggle back to display mode
          cancelButton.click();
          window.location.reload(); // Or update UI dynamically
        } else {
          alert("Failed to save content.");
        }
      } catch (error) {
        console.error("Error saving content:", error);
        alert("An error occurred while saving.");
      }
    });
  }

  // Store initial content in textarea for editing
  try {
    const initialContent = JSON.parse(displayDiv.innerHTML);
    textarea.value = JSON.stringify(initialContent, null, 2);
    displayDiv.dataset.raw = textarea.value;
  } catch (e) {
    // if it's not a json, it's html
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = displayDiv.innerHTML;
    // This is a simplistic conversion, you might need a more robust html-to-editor.js logic
    const data = {
      blocks: [
        {
          type: "paragraph",
          data: {
            text: tempDiv.innerText,
          },
        },
      ],
    };
    textarea.value = JSON.stringify(data);
    displayDiv.dataset.raw = textarea.value;
  }
});
