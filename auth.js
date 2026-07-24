(function () {
  const SESSION_KEY = "simplify-crm-session-v1";
  const LOGIN_URL = "https://fakestoreapi.com/auth/login";
  const PROTECTED_PAGES = new Set(["clientes.html", "catalogo.html"]);

  function readSession() {
    try {
      const value = localStorage.getItem(SESSION_KEY);
      if (!value) return null;
      const session = JSON.parse(value);
      if (!session?.token || !session?.username) throw new Error("Sessão inválida");
      return session;
    } catch (error) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function isAuthenticated() {
    return Boolean(readSession());
  }

  function currentPage() {
    return location.pathname.split("/").pop() || "clientes.html";
  }

  function safeDestination(value) {
    return PROTECTED_PAGES.has(value) ? value : "clientes.html";
  }

  function requireAuth() {
    const session = readSession();
    if (session) return session;

    document.documentElement.style.display = "none";
    const destination = encodeURIComponent(safeDestination(currentPage()));
    location.replace(`login.html?next=${destination}`);
    return null;
  }

  async function login(username, password) {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok || !data.token) {
      throw new Error("Usuário ou senha inválidos.");
    }

    const session = {
      username,
      token: data.token,
      authenticatedAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    location.href = "login.html";
  }

  function destinationFromQuery() {
    const value = new URLSearchParams(location.search).get("next");
    return safeDestination(value);
  }

  window.CrmAuth = {
    destinationFromQuery,
    isAuthenticated,
    login,
    logout,
    readSession,
    requireAuth,
  };
})();
