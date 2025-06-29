import http from "k6/http";
import { sleep, check } from "k6";

export let options = {
  vus: 20, // количество одновременных пользователей
  duration: "1m", // длительность теста
};

export default function () {
  // 1. Просмотр каталога товаров
  let res1 = http.get("http://localhost:3000/catalog");
  check(res1, { "каталог загружается": (r) => r.status === 200 });

  // 2. Просмотр страницы товара (например, id=1)
  let res2 = http.get("http://localhost:3000/product/1");
  check(res2, { "страница товара загружается": (r) => r.status === 200 });

  // 3. Добавление товара в корзину (пример POST-запроса)
  let res3 = http.post(
    "http://localhost:3000/api/cart",
    JSON.stringify({ productId: 1, quantity: 1 }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  check(res3, { "товар добавлен в корзину": (r) => r.status === 200 });

  // 4. Оформление заказа (пример POST-запроса)
  let res4 = http.post(
    "http://localhost:3000/api/order",
    JSON.stringify({
      cart: [{ productId: 1, quantity: 1 }],
      user: { name: "Test", address: "Test street" },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(res4, { "заказ оформлен": (r) => r.status === 200 });

  sleep(1); // пауза между итерациями
}
