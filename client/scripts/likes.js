document.addEventListener("DOMContentLoaded", () => {
  // Attach the event listener to the document to handle clicks on any page
  document.body.addEventListener("click", async (event) => {
    const wishlistButton = event.target.closest(".product-card__wishlist");
    const removeButton = event.target.closest(".product-card__btn-remove");

    if (!wishlistButton && !removeButton) {
      return; // Exit if the click was not on a relevant button
    }

    // Prevent default button behavior
    event.preventDefault();

    const productContainer = event.target.closest(
      ".product-card, .product-detail__container"
    );
    if (!productContainer) {
      console.error("Product container not found.");
      return;
    }

    const productId = productContainer.dataset.productId;
    if (!productId) {
      console.error("Product ID not found.");
      return;
    }

    // Handle remove button click (only on profile page)
    if (removeButton) {
      try {
        const response = await fetch("/api/likes/toggle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ productId }),
        });
        const result = await response.json();
        if (result.success && !result.liked) {
          // Successfully unliked, now remove from DOM
          productContainer.style.transition = "opacity 0.5s ease";
          productContainer.style.opacity = "0";
          setTimeout(() => productContainer.remove(), 500);
        }
      } catch (error) {
        console.error("Error removing favorite:", error);
      }
      return; // Stop execution after handling remove
    }

    // --- Logic for Wishlist Heart Icon ---
    const profileDropdown = document.getElementById("profileDropdown");
    if (!profileDropdown) {
      const loginModal = document.getElementById("loginModal");
      if (loginModal) {
        loginModal.classList.add("show");
        document.body.style.overflow = "hidden";
      }
      return;
    }

    try {
      const response = await fetch("/api/likes/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      if (response.status === 401) {
        alert("Please log in to like products.");
        window.location.href = "/?login=true";
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to toggle like status.");
      }

      const result = await response.json();

      if (result.success) {
        wishlistButton.classList.toggle("liked", result.liked);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });
});
