import { loadJSON, saveJSON } from "./storage.js";

const LOG_KEY = "log.v1";
const MAX_ENTRADAS = 50;

export function registrarLog(texto, alerta = false) {
  const entradas = loadJSON(LOG_KEY, []);
  entradas.unshift({ texto, alerta, hora: new Date().toLocaleTimeString("pt-BR") });
  saveJSON(LOG_KEY, entradas.slice(0, MAX_ENTRADAS));
}

export function obterLog() {
  return loadJSON(LOG_KEY, []);
}
