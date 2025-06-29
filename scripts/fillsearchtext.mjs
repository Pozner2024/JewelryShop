import { getAllProducts, updateProduct } from "../server/modules/db.js";

async function fillSearchTextForAllProducts() {
  const products = await getAllProducts();
  for (const product of products) {
    await updateProduct(product.id, product);
    console.log(`Updated search_text for product id=${product.id}`);
  }
  console.log("search_text updated for all products!");
  process.exit(0);
}

fillSearchTextForAllProducts().catch((e) => {
  console.error(e);
  process.exit(1);
});
