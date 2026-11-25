/**
 * @jest-environment node
 *
 * Teste de INTEGRAÇÃO: exercita o httpApi do app contra o backend real (gateway em EXPO_PUBLIC_API_URL).
 * Rodar com: EXPO_PUBLIC_API_URL=http://localhost:8080 npx jest __integration__ --rootDir .
 */
import http from "node:http";
import { setToken } from "../src/services/http";

// O ambiente do jest-expo substitui o fetch do RN; aqui usamos um fetch mínimo sobre node:http para falar com o gateway real.
global.fetch = (url, init = {}) =>
  new Promise((resolve, reject) => {
    const req = http.request(url, { method: init.method || "GET", headers: init.headers }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () =>
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: async () => JSON.parse(raw),
        })
      );
    });
    req.on("error", reject);
    if (init.body) req.write(init.body);
    req.end();
  });
import { httpApi } from "../src/services/httpApi";

const uid = Date.now();
const vend = { nome: "Loja Int", email: `vend${uid}@x.com`, telefone: "(51) 99999-0000", senha: "123456", perfil: "VENDEDOR" };
const comp = { nome: "Cliente Int", email: `comp${uid}@x.com`, telefone: "(51) 98888-0000", senha: "123456", perfil: "COMPRADOR" };
const dados = {
  nome: "Chuteira Int", descricao: "Produto do teste de integração", preco: 100, categoria: "Chuteiras",
  tamanhos: ["40", "41"], cores: ["#000000"], personalizavel: false, estoque: 4, imagem: "data:image/jpeg;base64,AAAA",
};
const status = async (p) => p.then(() => null, (e) => e.status);
let vendedor, comprador, produto;
const como = (u) => setToken(u.token);

beforeAll(async () => {
  await httpApi.register(vend);
  await httpApi.register(comp);
  vendedor = await httpApi.login(vend.email, vend.senha);
  comprador = await httpApi.login(comp.email, comp.senha);
});

test("login mapeia o perfil a partir do token/resposta", () => {
  expect(vendedor.usuario.tipo).toBe("VENDEDOR");
  expect(comprador.usuario.tipo).toBe("COMPRADOR");
  expect(typeof vendedor.usuario.id).toBe("string");
  expect(vendedor.token.split(".")).toHaveLength(3);
});

test("login inválido → 401", async () => {
  setToken(null);
  expect(await status(httpApi.login(vend.email, "errada"))).toBe(401);
});

test("vendedor: CRUD de produto com o contrato do app", async () => {
  como(vendedor);
  produto = await httpApi.cadastrarProduto(dados);
  expect(produto).toMatchObject({ nome: "Chuteira Int", preco: 100, categoria: "Chuteiras", estoque: 4, tamanhos: ["40", "41"], personalizavel: false });
  expect(produto.vendedorId).toBe(vendedor.usuario.id);
  expect(produto.imagem).toBe(dados.imagem);

  const meus = await httpApi.meusProdutos();
  expect(meus.map((p) => p.id)).toContain(produto.id);

  const att = await httpApi.atualizarProduto(produto.id, { ...dados, preco: 110 });
  expect(att.preco).toBe(110);
});

test("catálogo público: lista, busca, filtro e detalhe", async () => {
  setToken(null);
  expect((await httpApi.listarProdutos()).length).toBeGreaterThanOrEqual(8);
  expect((await httpApi.listarProdutos("chuteira int")).map((p) => p.id)).toContain(produto.id);
  expect((await httpApi.listarProdutos("", "Chuteiras")).every((p) => p.categoria === "Chuteiras")).toBe(true);
  expect((await httpApi.obterProduto(produto.id)).nome).toBe("Chuteira Int");
});

test("comprador não faz manutenção (403)", async () => {
  como(comprador);
  expect(await status(httpApi.cadastrarProduto(dados))).toBe(403);
  expect(await status(httpApi.atualizarProduto(produto.id, dados))).toBe(403);
  expect(await status(httpApi.removerProduto(produto.id))).toBe(403);
  expect(await status(httpApi.listarVendas())).toBe(403);
});

test("compra: item do carrinho → pedido, estoque e histórico", async () => {
  como(comprador);
  const item = { key: "k", produto: { ...produto, preco: 110 }, quantidade: 2, tamanho: "40", cor: "#000000" };
  const endereco = { cep: "90000000", rua: "Rua A", numero: "1", cidade: "POA", uf: "RS" };
  const ped = await httpApi.criarPedido({ itens: [item], endereco, pagamento: "CARTAO", total: 220 });
  expect(ped.total).toBe(220);
  expect(ped.status).toBe("EM_TRANSITO");
  expect(ped.itens[0]).toMatchObject({ nome: "Chuteira Int", quantidade: 2, preco: 110 });
  expect((await httpApi.obterProduto(produto.id)).estoque).toBe(2);
  expect((await httpApi.listarPedidos()).map((p) => p.id)).toContain(ped.id);
  expect(await status(httpApi.criarPedido({ itens: [{ ...item, quantidade: 50 }], endereco, pagamento: "PIX", total: 1 }))).toBe(400);
});

test("vendedor: histórico e resumo de vendas", async () => {
  como(vendedor);
  const vendas = await httpApi.listarVendas();
  expect(vendas).toHaveLength(1);
  expect(vendas[0]).toMatchObject({ subtotal: 220 });
  expect(vendas[0].itens[0].nome).toBe("Chuteira Int");
  expect(await httpApi.resumoVendas()).toEqual({ vendas: 1, faturamento: 220 });
});

test("vendedor remove o próprio produto; sem token → 401", async () => {
  como(vendedor);
  await httpApi.removerProduto(produto.id);
  expect(await status(httpApi.obterProduto(produto.id))).toBe(404);
  setToken(null);
  expect(await status(httpApi.meusProdutos())).toBe(401);
});
