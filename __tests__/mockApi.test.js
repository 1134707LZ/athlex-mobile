import { setToken } from "../src/services/http";
import { mockApi } from "../src/services/mockApi";
jest.useFakeTimers(); // o mock simula latência com setTimeout
/** Executa a chamada e avança os timers simulados. */
async function run(p) {
  const r = p.then(
    (v) => ({ v }),
    (e) => ({ e }),
  );
  await jest.runAllTimersAsync();
  const out = await r;
  if ("e" in out) throw out.e;
  return out.v;
}
const loginComo = async (email) => {
  setToken((await run(mockApi.login(email, "123456"))).token);
};
const falha = async (p) =>
  await run(p).then(
    () => null,
    (e) => e,
  );
const novoProduto = (over = {}) => ({
  nome: "Bola Nova",
  descricao: "Bola de teste",
  preco: 50,
  categoria: "Bolas",
  tamanhos: ["Único"],
  cores: ["#fff"],
  personalizavel: false,
  estoque: 3,
  ...over,
});
describe("autenticação (mock)", () => {
  it("login inválido → 401", async () => {
    expect((await falha(mockApi.login("demo@athlex.com", "errada")))?.status).toBe(401);
  });
  it("cadastro com perfil e e-mail duplicado → 409", async () => {
    await run(
      mockApi.register({
        nome: "Novo",
        email: "novo@x.com",
        telefone: "(51) 90000-0000",
        senha: "123456",
        perfil: "VENDEDOR",
      }),
    );
    expect((await run(mockApi.login("novo@x.com", "123456"))).usuario.tipo).toBe("VENDEDOR");
    expect(
      (
        await falha(
          mockApi.register({ nome: "Novo", email: "novo@x.com", telefone: "1", senha: "123456", perfil: "COMPRADOR" }),
        )
      )?.status,
    ).toBe(409);
  });
});
describe("autorização de produtos", () => {
  it("comprador não faz manutenção (403)", async () => {
    await loginComo("demo@athlex.com");
    expect((await falha(mockApi.cadastrarProduto(novoProduto())))?.status).toBe(403);
    expect((await falha(mockApi.removerProduto("1")))?.status).toBe(403);
  });
  it("vendedor faz CRUD dos próprios produtos", async () => {
    await loginComo("vendedor@athlex.com");
    const criado = await run(mockApi.cadastrarProduto(novoProduto()));
    expect(criado.vendedorId).toBe("u2");
    const atualizado = await run(mockApi.atualizarProduto(criado.id, novoProduto({ nome: "Bola Editada", preco: 60 })));
    expect(atualizado.nome).toBe("Bola Editada");
    await run(mockApi.removerProduto(criado.id));
    expect((await falha(mockApi.obterProduto(criado.id)))?.status).toBe(404);
  });
  it("vendedor não edita produto de outro vendedor (403)", async () => {
    await run(
      mockApi.register({ nome: "Outro", email: "outro@x.com", telefone: "1", senha: "123456", perfil: "VENDEDOR" }),
    );
    await loginComo("outro@x.com");
    expect((await falha(mockApi.atualizarProduto("1", novoProduto())))?.status).toBe(403);
    expect((await falha(mockApi.removerProduto("1")))?.status).toBe(403);
  });
  it("sem sessão → 401", async () => {
    setToken(null);
    expect((await falha(mockApi.listarPedidos()))?.status).toBe(401);
  });
});
describe("pedido, estoque e vendas", () => {
  const endereco = { cep: "90000000", rua: "R", numero: "1", cidade: "POA", uf: "RS" };
  it("compra baixa estoque e aparece no histórico de vendas do vendedor", async () => {
    await loginComo("vendedor@athlex.com");
    const antes = await run(mockApi.obterProduto("3"));
    const resumoAntes = await run(mockApi.resumoVendas());
    await loginComo("demo@athlex.com");
    const it = { key: "k", produto: antes, quantidade: 2, tamanho: "Único", cor: "#fff" };
    await run(mockApi.criarPedido({ itens: [it], endereco, pagamento: "PIX", total: antes.preco * 2 }));
    expect((await run(mockApi.obterProduto("3"))).estoque).toBe(antes.estoque - 2);
    expect((await run(mockApi.listarPedidos())).length).toBeGreaterThan(0);
    await loginComo("vendedor@athlex.com");
    const resumo = await run(mockApi.resumoVendas());
    expect(resumo.vendas).toBe(resumoAntes.vendas + 1);
    expect(resumo.faturamento).toBeCloseTo(resumoAntes.faturamento + antes.preco * 2);
    expect((await run(mockApi.listarVendas()))[0].itens[0].nome).toBe(antes.nome);
  });
  it("estoque insuficiente → 400 e nada é baixado", async () => {
    await loginComo("demo@athlex.com");
    const p = await run(mockApi.obterProduto("4"));
    const it = { key: "k", produto: p, quantidade: p.estoque + 1, tamanho: "M", cor: "#fff" };
    expect((await falha(mockApi.criarPedido({ itens: [it], endereco, pagamento: "PIX", total: 1 })))?.status).toBe(400);
    expect((await run(mockApi.obterProduto("4"))).estoque).toBe(p.estoque);
  });
  it("comprador não acessa vendas (403) e só vê os próprios pedidos", async () => {
    await loginComo("demo@athlex.com");
    expect((await falha(mockApi.listarVendas()))?.status).toBe(403);
    await run(mockApi.register({ nome: "Z", email: "z@x.com", telefone: "1", senha: "123456", perfil: "COMPRADOR" }));
    await loginComo("z@x.com");
    expect(await run(mockApi.listarPedidos())).toHaveLength(0);
  });
});
