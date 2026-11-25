import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { api, setToken, setUnauthorizedHandler } from "../services/api";
import { resetPara } from "../navigation/ref";
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
const KEY = "athlex.session";
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  // restaura sessão (JWT) salva no armazenamento seguro
  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(KEY);
        if (raw) {
          const s = JSON.parse(raw);
          setToken(s.token);
          setUsuario(s.usuario);
        }
      } catch {}
      setCarregando(false);
    })();
  }, []);
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUsuario(null);
      SecureStore.deleteItemAsync(KEY).catch(() => {});
      resetPara("Login"); // sessão expirada -> volta ao login
    });
    return () => setUnauthorizedHandler(null);
  }, []);
  const login = async (email, senha) => {
    const r = await api.login(email.trim().toLowerCase(), senha);
    setToken(r.token);
    setUsuario(r.usuario);
    await SecureStore.setItemAsync(KEY, JSON.stringify(r)).catch(() => {});
    resetPara("Tabs"); // entra no app (abas conforme o perfil)
  };
  const logout = async () => {
    setToken(null);
    setUsuario(null);
    await SecureStore.deleteItemAsync(KEY).catch(() => {});
    resetPara("Login");
  };
  return <Ctx.Provider value={{ usuario, carregando, login, logout }}>{children}</Ctx.Provider>;
}
