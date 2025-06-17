# Server-Side Handlebars Setup для проекта Jewelry Shop

## Структура шаблонов на сервере

Шаблоны Handlebars теперь размещены на сервере и обрабатываются с помощью Express.

### Структура каталогов:

```
server/
├── views/
│   ├── layouts/
│   │   └── main.hbs           # Основной layout с хедером, футером и модалами
│   ├── partials/
│   │   ├── header.hbs         # Шаблон хедера
│   │   ├── footer.hbs         # Шаблон футера
│   │   └── auth-modals.hbs    # Модальные окна авторизации
│   ├── index.hbs              # Главная страница
│   ├── catalog.hbs            # Страница каталога
│   └── product.hbs            # Страница товара
└── modules/
    └── handlebars-helpers.js  # Вспомогательные функции
```

## Настройка Express

### Зависимости:

- `express-handlebars` - интеграция Handlebars с Express
- `handlebars` - движок шаблонов

### Конфигурация в server.js:

```javascript
import { engine } from "express-handlebars";
import { helpers } from "./modules/handlebars-helpers.js";

// Настройка Handlebars
webserver.engine(
  ".hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(process.cwd(), "views/layouts"),
    partialsDir: path.join(process.cwd(), "views/partials"),
    helpers: helpers,
  })
);

webserver.set("view engine", ".hbs");
webserver.set("views", path.join(process.cwd(), "views"));
```

## Маршруты

### Главная страница:

- **URL:** `/`
- **Шаблон:** `index.hbs`
- **Данные:** features, featuredProducts

### Каталог:

- **URL:** `/catalog`
- **Шаблон:** `catalog.hbs`
- **Данные:** products (можно загружать из БД)

### Страница товара:

- **URL:** `/product/:slug`
- **Шаблон:** `product.hbs`
- **Данные:** product, services, relatedProducts

## Доступные Handlebars helpers

- `{{times n}}` - повторить блок n раз
- `{{minus a b}}` - вычесть b из a
- `{{inc value}}` - увеличить значение на 1
- `{{eq a b}}` - сравнить на равенство
- `{{gt a b}}` - сравнить на больше
- `{{formatPrice price}}` - форматировать цену
- `{{isActive currentPath targetPath}}` - проверить активную ссылку

## Примеры использования

### Отображение рейтинга:

```handlebars
{{#times product.rating}}
  <span class="rating__star rating__star--filled">★</span>
{{/times}}
{{#times (minus 5 product.rating)}}
  <span class="rating__star">★</span>
{{/times}}
```

### Условное отображение:

```handlebars
{{#if product.badge}}
  <div class="badge badge--{{product.badgeType}}">{{product.badge}}</div>
{{/if}}
```

### Цикл по массиву:

```handlebars
{{#each product.specifications}}
  <li>
    <span>{{name}}:</span>
    <span>{{value}}</span>
  </li>
{{/each}}
```

## Статические файлы

Статические файлы (CSS, JS, изображения) по-прежнему обслуживаются через Vite и располагаются в папке `client/`.

## Преимущества серверного рендеринга

1. **SEO-оптимизация** - поисковые системы видят готовый HTML
2. **Быстрая загрузка** - страница отображается сразу
3. **Безопасность** - данные не передаются в клиентский JavaScript
4. **Простота** - нет проблем с модулями и сборкой на фронтенде

## Запуск

```bash
npm run dev
```

Сервер будет доступен по адресу: http://localhost:80

## Миграция страниц

Старые HTML файлы в папке `client/` теперь содержат редиректы на серверные версии:

- `client/product-necklace.html` → `/product/platinum-necklace-sapphires`
- И так далее для других страниц

## Следующие шаги

1. Переработать остальные HTML файлы аналогично
2. Добавить загрузку данных из базы данных
3. Создать дополнительные шаблоны для других типов страниц
4. Добавить кэширование для оптимизации производительности
