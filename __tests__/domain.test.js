import { mascaraTelefone, mascaraValidade } from "../src/domain/masks";
import { podeComprar, podeGerenciarProdutos, tipoDoToken } from "../src/domain/permissions";
import { acrescimoPersonalizacao, precoUnitario, totalDoCarrinho } from "../src/domain/pricing";
import {
  emailValido,
  validarCadastro,
  validarCartao,
  validarEndereco,
  validarItem,
  validarLogin,
  valido,
} from "../src/domain/validators";
const produto = {
  id: "1",
  nome: "Camisa",
  descricao: "d",
  preco: 100,
  categoria: "Camisas",
  tamanhos: ["M"],
  cores: ["#fff"],
  personalizavel: true,
  estoque: 5,
};
const item = (qtd, acrescimo = 0) => ({
  key: "k" + qtd + acrescimo,
  produto,
  quantidade: qtd,
  tamanho: "M",
  cor: "#fff",
  personalizacao: acrescimo ? { modelo: "Polo", cor: "#fff", acrescimo } : undefined,
});
describe("validators", () => {
  it("login: e-mail e senha", () => {
    expect(valido(validarLogin({ email: "a@b.com", senha: "123456" }))).toBe(true);
    expect(validarLogin({ email: "x", senha: "1" })).toEqual({
      email: "E-mail inválido",
      senha: "Mínimo de 6 caracteres",
    });
  });
  it("e-mail com espaço nas pontas é aceito (teclado móvel)", () => {
    expect(emailValido("ana@x.com ")).toBe(true);
    expect(emailValido(" ana@x.com")).toBe(true);
    expect(emailValido("ana @x.com")).toBe(false);
  });
  it("cadastro exige nome, e-mail, telefone e senha", () => {
    expect(
      valido(validarCadastro({ nome: "Ana Souza", email: "a@b.com", telefone: "(51) 99999-0000", senha: "123456" })),
    ).toBe(true);
    expect(Object.keys(validarCadastro({ nome: "", email: "", telefone: "", senha: "" }))).toHaveLength(4);
  });
  it("endereço: CEP com 8 dígitos e UF com 2 letras", () => {
    const ok = { cep: "90000000", rua: "R", numero: "1", cidade: "POA", uf: "RS" };
    expect(valido(validarEndereco(ok))).toBe(true);
    expect(validarEndereco({ ...ok, cep: "123", uf: "R" })).toEqual({ cep: "CEP inválido", uf: "UF" });
  });
  it("cartão", () => {
    expect(valido(validarCartao({ numero: "4111111111111111", validade: "12/30", cvv: "123" }))).toBe(true);
    expect(Object.keys(validarCartao({ numero: "1", validade: "1230", cvv: "1" }))).toHaveLength(3);
  });
  it("produto: preço > 0 e estoque inteiro", () => {
    const base = { nome: "Chuteira", descricao: "Descrição longa", preco: "199,90", estoque: "10" };
    expect(valido(validarItem(base))).toBe(true);
    expect(validarItem({ ...base, preco: "0" }).preco).toBeDefined();
    expect(validarItem({ ...base, estoque: "-1" }).estoque).toBeDefined();
    expect(validarItem({ ...base, estoque: "1.5" }).estoque).toBeDefined();
  });
});
describe("masks", () => {
  it("telefone", () => {
    expect(mascaraTelefone("51999990000")).toBe("(51) 99999-0000");
    expect(mascaraTelefone("519")).toBe("(51) 9");
  });
  it("validade", () => expect(mascaraValidade("1230")).toBe("12/30"));
});
describe("pricing", () => {
  it("acréscimo de nome e número", () => {
    expect(acrescimoPersonalizacao("SILVA", "10")).toBe(20);
    expect(acrescimoPersonalizacao("SILVA", "")).toBe(10);
    expect(acrescimoPersonalizacao(" ", undefined)).toBe(0);
  });
  it("preço unitário e total do carrinho", () => {
    expect(precoUnitario(item(1, 20))).toBe(120);
    expect(totalDoCarrinho([item(2), item(1, 20)])).toBe(320);
    expect(totalDoCarrinho([])).toBe(0);
  });
});
describe("permissions", () => {
  it("apenas vendedor/admin gerenciam produtos", () => {
    expect(podeGerenciarProdutos("VENDEDOR")).toBe(true);
    expect(podeGerenciarProdutos("ADMINISTRADOR")).toBe(true);
    expect(podeGerenciarProdutos("COMPRADOR")).toBe(false);
    expect(podeGerenciarProdutos(null)).toBe(false);
  });
  it("podeComprar", () => expect(podeComprar("COMPRADOR")).toBe(true));
  it("claim type do JWT → perfil", () => {
    expect(tipoDoToken(0)).toBe("ADMINISTRADOR");
    expect(tipoDoToken(2)).toBe("VENDEDOR");
    expect(tipoDoToken(1)).toBe("COMPRADOR");
    expect(tipoDoToken(undefined)).toBe("COMPRADOR");
  });
});
