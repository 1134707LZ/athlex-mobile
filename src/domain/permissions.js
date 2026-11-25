/** Regras de acesso por perfil (espelham as do backend: 0=admin, 1=comprador, 2=vendedor). */
export const podeGerenciarProdutos = (tipo) => tipo === "VENDEDOR" || tipo === "ADMINISTRADOR";
export const podeComprar = (tipo) => tipo !== "VENDEDOR" && tipo !== "ADMINISTRADOR";
/** Converte o claim numérico "type" do JWT em perfil do app. */
export function tipoDoToken(type) {
  if (type === 0) return "ADMINISTRADOR";
  if (type === 2) return "VENDEDOR";
  return "COMPRADOR";
}
