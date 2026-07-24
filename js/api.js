window.App = window.App || {};

(function () {
  "use strict";

  var BASE_URL = "https://fakestoreapi.com";

  function request(path, options) {
    return fetch(BASE_URL + path, options)
      .catch(function () {
        throw new Error("Não foi possível conectar à fakestoreapi. Verifique sua conexão.");
      })
      .then(function (res) {
        if (!res.ok) {
          throw new Error(
            res.status === 401
              ? "Usuário ou senha inválidos."
              : "A fakestoreapi respondeu com erro (" + res.status + ")."
          );
        }
        return res.json();
      });
  }

  function getProducts() {
    return request("/products");
  }

  function getCategories() {
    return request("/products/categories");
  }

  function getProductsByCategory(categoria) {
    return request("/products/category/" + encodeURIComponent(categoria));
  }

  function login(username, password) {
    return request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, password: password }),
    });
  }

  App.api = {
    getProducts: getProducts,
    getCategories: getCategories,
    getProductsByCategory: getProductsByCategory,
    login: login,
  };
})();
