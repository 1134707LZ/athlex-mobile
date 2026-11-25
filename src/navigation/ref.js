import { createNavigationContainerRef } from "@react-navigation/native";

/** Referência global do container: permite navegar fora de componentes (ex.: ao expirar a sessão). */
export const navigationRef = createNavigationContainerRef();

/** Zera a pilha e vai para a rota informada (usado após login, cadastro e logout). */
export function resetPara(nome) {
  if (navigationRef.isReady()) navigationRef.reset({ index: 0, routes: [{ name: nome }] });
}
