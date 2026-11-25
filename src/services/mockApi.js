import { PRODUTOS } from "../data/mock";
import { podeGerenciarProdutos } from "../domain/permissions";
import { precoComPersonalizacao } from "../domain/pricing";
import { getToken } from "./http";
import { ApiError } from "./apiClient";
/**
 * Implementação em memória (desenvolvimento/demonstração sem backend).
 * Reproduz as regras do backend: perfis, 403 para comprador em manutenção,
 * dono do produto, baixa de estoque e histórico de vendas.
 */
const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms));
const users = [
  {
    id: "u1",
    nome: "Cliente Demo",
    email: "demo@athlex.com",
    telefone: "(51) 99999-0000",
    senha: "123456",
    tipo: "COMPRADOR",
  },
  {
    id: "u2",
    nome: "Loja Athlex",
    email: "vendedor@athlex.com",
    telefone: "(51) 98888-0000",
    senha: "123456",
    tipo: "VENDEDOR",
  },
];
// produtos do catálogo pertencem à Loja Athlex (u2)
const produtos = PRODUTOS.map((p) => ({ ...p, vendedorId: "u2" }));
const pedidos = [];
/** O "banco" nunca expõe suas referências internas (evita mutação acidental pelos consumidores). */
const copia = (p) => ({ ...p });
/** Usuário "autenticado" a partir do token mock (mock-jwt.<id>). */
function atual() {
  const t = getToken();
  const u = t && users.find((x) => "mock-jwt." + x.id === t);
  if (!u) throw new ApiError(401, "Sessão expirada. Entre novamente.");
  return u;
}
function exigirVendedor() {
  const u = atual();
  if (!podeGerenciarProdutos(u.tipo)) throw new ApiError(403, "Você não tem permissão para esta operação.");
  return u;
}
function exigirDono(p, u) {
  if (u.tipo !== "ADMINISTRADOR" && p.vendedorId !== u.id)
    throw new ApiError(403, "Você não tem permissão para esta operação.");
}
export const mockApi = {
  async register(d) {
    await wait();
    if (users.some((u) => u.email === d.email)) throw new ApiError(409, "E-mail já cadastrado.");
    const { perfil, ...resto } = d;
    users.push({ id: "u" + (users.length + 1), tipo: perfil, ...resto });
  },
  async login(email, senha) {
    await wait();
    const u = users.find((x) => x.email === email && x.senha === senha);
    if (!u) throw new ApiError(401, "E-mail ou senha inválidos.");
    const { senha: _s, ...usuario } = u;
    return { token: "mock-jwt." + u.id, usuario };
  },
  async listarProdutos(busca = "", categoria = "Todos") {
    await wait(200);
    const b = busca.trim().toLowerCase();
    return produtos
      .filter(
        (p) =>
          (categoria === "Todos" || p.categoria === categoria) &&
          (!b || p.nome.toLowerCase().includes(b) || p.descricao.toLowerCase().includes(b)),
      )
      .map(copia);
  },
  async obterProduto(id) {
    await wait(150);
    const p = produtos.find((x) => x.id === id);
    if (!p) throw new ApiError(404, "Produto não encontrado.");
    return copia(p);
  },
  async cadastrarProduto(p) {
    await wait();
    const u = exigirVendedor();
    const novo = { ...p, id: String(Date.now()), vendedorId: u.id };
    produtos.unshift(novo);
    return copia(novo);
  },
  async atualizarProduto(id, dados) {
    await wait();
    const u = exigirVendedor();
    const i = produtos.findIndex((x) => x.id === id);
    if (i < 0) throw new ApiError(404, "Produto não encontrado.");
    exigirDono(produtos[i], u);
    produtos[i] = { ...dados, id, vendedorId: produtos[i].vendedorId };
    return copia(produtos[i]);
  },
  async removerProduto(id) {
    await wait();
    const u = exigirVendedor();
    const i = produtos.findIndex((x) => x.id === id);
    if (i < 0) throw new ApiError(404, "Produto não encontrado.");
    exigirDono(produtos[i], u);
    produtos.splice(i, 1);
  },
  async meusProdutos(usuarioId) {
    await wait(200);
    return produtos.filter((p) => p.vendedorId === usuarioId).map(copia);
  },
  async criarPedido(d) {
    await wait(700);
    const u = atual();
    // valida estoque de tudo antes de baixar (como o backend)
    for (const i of d.itens) {
      const p = produtos.find((x) => x.id === i.produto.id);
      if (!p) throw new ApiError(400, `Produto ${i.produto.id} não existe`);
      if (p.estoque < i.quantidade) throw new ApiError(400, `Estoque insuficiente: ${p.nome}`);
    }
    d.itens.forEach((i) => {
      produtos.find((x) => x.id === i.produto.id).estoque -= i.quantidade;
    });
    const itens = d.itens.map((i) => ({
      vendedorId: i.produto.vendedorId,
      nome: i.produto.nome,
      quantidade: i.quantidade,
      preco: precoComPersonalizacao(i.produto.preco, i.personalizacao),
    }));
    const ped = {
      id: "PED-" + String(pedidos.length + 1001),
      data: new Date().toISOString(),
      total: d.total,
      status: d.pagamento === "CARTAO" ? "EM_TRANSITO" : "AGUARDANDO_PAGAMENTO",
      itens: itens.map(({ nome, quantidade, preco }) => ({ nome, quantidade, preco })),
    };
    pedidos.unshift({ pedido: ped, compradorId: u.id, itens });
    return ped;
  },
  async listarPedidos() {
    await wait(200);
    const u = atual();
    return pedidos.filter((r) => u.tipo === "ADMINISTRADOR" || r.compradorId === u.id).map((r) => r.pedido);
  },
  async listarVendas() {
    await wait(200);
    const u = exigirVendedor();
    const out = [];
    for (const r of pedidos) {
      const meus = r.itens.filter((i) => u.tipo === "ADMINISTRADOR" || i.vendedorId === u.id);
      if (!meus.length) continue;
      out.push({
        pedidoId: r.pedido.id,
        data: r.pedido.data,
        status: r.pedido.status,
        subtotal: meus.reduce((s, i) => s + i.preco * i.quantidade, 0),
        itens: meus.map(({ nome, quantidade, preco }) => ({ nome, quantidade, preco })),
      });
    }
    return out;
  },
  async resumoVendas() {
    const v = await mockApi.listarVendas();
    return { vendas: v.length, faturamento: v.reduce((s, x) => s + x.subtotal, 0) };
  },
};
