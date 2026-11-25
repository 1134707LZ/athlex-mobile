import { tipoDoToken } from "../domain/permissions";
import { decodeJwt, http } from "./http";
/** Implementação real: fala com o API Gateway (JWT validado lá; autorização nos microservices). */
export const httpApi = {
  register: (d) =>
    http("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name: d.nome, email: d.email, phone: d.telefone, password: d.senha, profile: d.perfil }),
    }),
  async login(email, senha) {
    const r = await http("/auth/signin", { method: "POST", body: JSON.stringify({ email, password: senha }) });
    const jwt = r.token ?? r.jwt;
    const c = decodeJwt(jwt);
    const u = r.user ?? r.usuario ?? {};
    return {
      token: jwt,
      usuario: {
        id: String(u.id ?? c.id),
        nome: u.name ?? u.nome ?? c.name ?? email,
        email: u.email ?? c.email ?? email,
        tipo: tipoDoToken(u.type ?? c.type),
      },
    };
  },
  listarProdutos(busca = "", categoria = "Todos") {
    const q = new URLSearchParams({ busca, ...(categoria !== "Todos" ? { categoria } : {}) });
    return http(`/products?${q}`);
  },
  obterProduto: (id) => http(`/products/${id}`),
  cadastrarProduto: (p) => http("/ws/products", { method: "POST", body: JSON.stringify(p) }),
  atualizarProduto: (id, p) => http(`/ws/products/${id}`, { method: "PUT", body: JSON.stringify(p) }),
  removerProduto: (id) => http(`/ws/products/${id}`, { method: "DELETE" }),
  meusProdutos: () => http("/ws/products/mine"),
  listarVendas: () => http("/ws/orders/sales"),
  resumoVendas: () => http("/ws/orders/sales/summary"),
  criarPedido: (d) =>
    http("/ws/orders", {
      method: "POST",
      body: JSON.stringify({
        endereco: d.endereco,
        pagamento: d.pagamento,
        itens: d.itens.map((i) => ({
          produtoId: i.produto.id,
          quantidade: i.quantidade,
          tamanho: i.tamanho,
          cor: i.cor,
          personalizacao: i.personalizacao,
        })),
      }),
    }),
  listarPedidos: () => http("/ws/orders"),
};
