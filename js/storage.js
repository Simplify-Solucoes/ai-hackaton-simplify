const PREFIX = "minicrm.";

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (err) {
    console.warn(`Falha ao ler "${key}" do localStorage`, err);
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Falha ao salvar "${key}" no localStorage`, err);
  }
}

export function loadSession(key, fallback) {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

export function saveSession(key, value) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Falha ao salvar "${key}" na sessionStorage`, err);
  }
}

export function clearSession(key) {
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    // ambiente sem sessionStorage disponível
  }
}
