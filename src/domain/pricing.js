/** Regras de preço do domínio (iguais às aplicadas no order-api do backend). */
export const PRECO_NOME = 10;
export const PRECO_NUMERO = 10;
export const acrescimoPersonalizacao = (nome, numero) =>
  (nome?.trim() ? PRECO_NOME : 0) + (numero?.trim() ? PRECO_NUMERO : 0);
export const precoComPersonalizacao = (base, p) => base + (p?.acrescimo ?? 0);
export const precoUnitario = (i) => precoComPersonalizacao(i.produto.preco, i.personalizacao);
export const totalDoCarrinho = (itens) => itens.reduce((s, i) => s + precoUnitario(i) * i.quantidade, 0);
