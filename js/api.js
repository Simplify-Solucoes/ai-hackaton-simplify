const BASE_URL = "https://fakestoreapi.com";

async function request(path, options) {
  let res;
  try {
    res = await fetch(BASE_URL + path, options);
  } catch (err) {
    throw new Error(`Falha de rede ao acessar ${path}`);
  }
  if (!res.ok) {
    throw new Error(`Erro ${res.status} ao acessar ${path}`);
  }
  return res.json();
}

export function fetchProdutos() {
  return request("/products");
}

export function fetchCategorias() {
  return request("/products/categories");
}

export function login(username, password) {
  return request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}
