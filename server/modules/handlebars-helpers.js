// Handlebars helpers
export const helpers = {
  // Helper для повторения элементов определенное количество раз
  times: function (n, options) {
    let accum = "";
    for (let i = 0; i < n; ++i) {
      accum += options.fn(i);
    }
    return accum;
  },

  // Helper для математических операций
  minus: function (a, b) {
    return a - b;
  },

  // Helper для увеличения числа на 1
  inc: function (value) {
    return parseInt(value) + 1;
  },

  // Helper для условного сравнения
  eq: function (a, b, options) {
    if (a === b) {
      return options.fn(this);
    }
    return options.inverse(this);
  },

  // Helper для проверки на больше
  gt: function (a, b, options) {
    if (a > b) {
      return options.fn(this);
    }
    return options.inverse(this);
  },

  // Helper для форматирования цены
  formatPrice: function (price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  },

  // Helper для проверки активного пути
  isActive: function (currentPath, targetPath, options) {
    if (currentPath === targetPath) {
      return options.fn(this);
    }
    return options.inverse(this);
  },
};
