// server/modules/handlebars-helpers.js

const helpers = {
  // Повторяет блок n раз. Внутри блока можно использовать {{@index}} для доступа к индексу.
  times(n, options) {
    let accum = "";
    // Пытаемся привести n к числу
    const count = parseInt(n, 10);
    if (isNaN(count) || count <= 0) {
      return ""; // ничего не рендерим, если некорректное число
    }
    for (let i = 0; i < count; ++i) {
      // Передаём в контекст @index значение i
      accum += options.fn({ ...this, "@index": i, index: i });
    }
    return accum;
  },

  // Арифметика
  add(a, b) {
    const aNum = Number(a);
    const bNum = Number(b);
    if (isNaN(aNum) || isNaN(bNum)) {
      return "";
    }
    return aNum + bNum;
  },
  subtract(a, b) {
    const aNum = Number(a);
    const bNum = Number(b);
    if (isNaN(aNum) || isNaN(bNum)) {
      return "";
    }
    return aNum - bNum;
  },
  // minus дублирует subtract, можно оставить или убрать
  minus(a, b) {
    const aNum = Number(a);
    const bNum = Number(b);
    if (isNaN(aNum) || isNaN(bNum)) {
      return "";
    }
    return aNum - bNum;
  },
  inc(value) {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      return "";
    }
    return num + 1;
  },

  // Условные сравнения (блоковые хелперы)
  eq(a, b, options) {
    // строгое сравнение
    if (a === b) {
      return options.fn(this);
    }
    return options.inverse(this);
  },
  gt(a, b, options) {
    const aNum = Number(a);
    const bNum = Number(b);
    if (!isNaN(aNum) && !isNaN(bNum) && aNum > bNum) {
      return options.fn(this);
    }
    return options.inverse(this);
  },
  lt(a, b, options) {
    const aNum = Number(a);
    const bNum = Number(b);
    if (!isNaN(aNum) && !isNaN(bNum) && aNum < bNum) {
      return options.fn(this);
    }
    return options.inverse(this);
  },
  // Можно добавить другие сравнения по необходимости

  // Форматирование и утилиты
  formatPrice(price) {
    // Предполагаем, что price может быть строкой или числом
    const str = String(price);
    // Добавляем пробелы между тысячами, если это число
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  },
  isActive(currentPath, targetPath, options) {
    // Блоковый хелпер: если совпадают пути, рендерит options.fn, иначе options.inverse
    if (currentPath === targetPath) {
      return options.fn(this);
    }
    return options.inverse(this);
  },

  // Пример хелпера для генерации ссылки с активным классом (необязательно)
  // activeLink(currentPath, targetPath, options) {
  //   const activeClass = (currentPath === targetPath) ? 'active' : '';
  //   return `<a href="${targetPath}" class="${activeClass}">${options.fn(this)}</a>`;
  // },

  // Добавьте здесь другие хелперы по потребности...
  json: function (context) {
    return JSON.stringify(context);
  },
  multiply: function (a, b) {
    return (parseFloat(a) * parseInt(b, 10)).toFixed(2);
  },
};
export default helpers;
