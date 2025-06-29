// --- Хелперы для Handlebars (вспомогательные функции для шаблонов) ---
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

  // Арифметика (сложение)
  add(a, b) {
    const aNum = Number(a);
    const bNum = Number(b);
    if (isNaN(aNum) || isNaN(bNum)) {
      return "";
    }
    return aNum + bNum;
  },
  // Арифметика (вычитание)
  subtract(a, b) {
    const aNum = Number(a);
    const bNum = Number(b);
    if (isNaN(aNum) || isNaN(bNum)) {
      return "";
    }
    return aNum - bNum;
  },
  // minus дублирует subtract
  minus(a, b) {
    const aNum = Number(a);
    const bNum = Number(b);
    if (isNaN(aNum) || isNaN(bNum)) {
      return "";
    }
    return aNum - bNum;
  },
  // Инкремент
  inc(value) {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      return "";
    }
    return num + 1;
  },

  // Условные сравнения (блочные хелперы)
  eq(a, b) {
    return a === b;
  },
  gt(a, b, options) {
    // Блочный хелпер (оставляем для совместимости)
    const aNum = Number(a);
    const bNum = Number(b);
    if (!isNaN(aNum) && !isNaN(bNum) && aNum > bNum) {
      return options.fn(this);
    }
    return options.inverse(this);
  },
  lt(a, b, options) {
    // Блочный хелпер (оставляем для совместимости)
    const aNum = Number(a);
    const bNum = Number(b);
    if (!isNaN(aNum) && !isNaN(bNum) && aNum < bNum) {
      return options.fn(this);
    }
    return options.inverse(this);
  },
  // Обычные (inline) сравнения для шаблонов
  gt_inline(a, b) {
    const aNum = Number(a);
    const bNum = Number(b);
    if (isNaN(aNum) || isNaN(bNum)) return false;
    return aNum > bNum;
  },
  lt_inline(a, b) {
    const aNum = Number(a);
    const bNum = Number(b);
    if (isNaN(aNum) || isNaN(bNum)) return false;
    return aNum < bNum;
  },

  // Форматирование и утилиты
  formatPrice(price) {
    // Предполагаем, что price может быть строкой или числом
    const str = String(price);
    // Добавляем пробелы между тысячами, если это число
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  },
  // Блоковый хелпер: если совпадают пути, рендерит options.fn, иначе options.inverse
  isActive(currentPath, targetPath, options) {
    if (currentPath === targetPath) {
      return options.fn(this);
    }
    return options.inverse(this);
  },

  json: function (context) {
    return JSON.stringify(context);
  },
  multiply: function (a, b) {
    return (parseFloat(a) * parseInt(b, 10)).toFixed(2);
  },
  divide: function (value, divisor) {
    if (!value || !divisor) return 0;
    return (parseFloat(value) / parseFloat(divisor)).toFixed(2);
  },

  // --- Диапазон чисел для циклов (например, для звёзд рейтинга) ---
  range(start, end) {
    const arr = [];
    for (let i = start; i <= end; i++) {
      arr.push(i);
    }
    return arr;
  },
  // Меньше или равно (lte)
  lte(a, b) {
    return a <= b;
  },
  capitalize: function (str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  // --- Добавлено для поддержки изображений товаров ---
  getFirstImage: function (images) {
    try {
      const arr = typeof images === "string" ? JSON.parse(images) : images;
      if (arr && arr.length) return arr[0];
      return "";
    } catch (e) {
      return "";
    }
  },
  parseImages: function (images) {
    if (!images) return [];
    try {
      const arr = typeof images === "string" ? JSON.parse(images) : images;
      if (arr && arr.length) return arr;
      return [];
    } catch (e) {
      return [];
    }
  },
  objectEntries: function (obj) {
    if (!obj || typeof obj !== "object") return [];
    return Object.entries(obj);
  },
  // Логический И для inline-выражений
  and() {
    // arguments — псевдомассив, последний аргумент — options
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(Boolean);
  },
};

// --- Вспомогательная функция для генерации диапазона чисел ---
export function range(start, end) {
  const arr = [];
  for (let i = start; i <= end; i++) {
    arr.push(i);
  }
  return arr;
}

export function lte(a, b) {
  return a <= b;
}

export function formatDate(dateString) {
  if (!dateString) {
    return "";
  }
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

export function parseImages(images) {
  if (!images) return [];
  try {
    const arr = typeof images === "string" ? JSON.parse(images) : images;
    if (arr && arr.length) return arr;
    return [];
  } catch (e) {
    return [];
  }
}

export function getFirstImage(images) {
  try {
    const arr = typeof images === "string" ? JSON.parse(images) : images;
    if (arr && arr.length) return arr[0];
    return "";
  } catch (e) {
    return "";
  }
}

export default helpers;
