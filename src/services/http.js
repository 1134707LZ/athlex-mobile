import { ApiError } from "./apiClient";
/** Infra de rede: base URL, token JWT e tratamento padronizado de erros HTTP. */
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8080";
const TIMEOUT_MS = 15000;
let token = null;
export const setToken = (t) => {
  token = t;
};
export const getToken = () => token;
// chamado quando o gateway responde 401 com sessão ativa (JWT expirado/inválido)
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};
export async function http(path, init = {}) {
  // timeout: sem ele, um servidor inacessível deixa a tela "carregando" para sempre
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(BASE_URL + path, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      0,
      `Não foi possível conectar ao servidor (${BASE_URL}). Verifique o IP no .env, se o backend está no ar e o firewall do PC.`,
    );
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = (await res.json()).message ?? msg;
    } catch {}
    if (res.status === 401) {
      if (token && onUnauthorized) onUnauthorized();
      msg = token ? "Sessão expirada. Entre novamente." : msg || "Credenciais inválidas.";
    }
    if (res.status >= 500) msg = `Servidor com problema (${res.status}). Verifique se todos os serviços estão no ar.`;
    if (res.status === 403) msg = "Você não tem permissão para esta operação.";
    throw new ApiError(res.status, msg);
  }
  return res.status === 204 ? undefined : res.json();
}
export function decodeJwt(t) {
  try {
    const b = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(b))));
  } catch {
    return {};
  }
}
