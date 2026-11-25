import { somenteDigitos } from "./masks";
export const valido = (e) => Object.keys(e).length === 0;
/** Ignora espaços nas pontas (teclados móveis costumam acrescentar um espaço ao autocompletar). */
export const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v ?? "").trim());
export function validarLogin(f) {
  const e = {};
  if (!emailValido(f.email)) e.email = "E-mail inválido";
  if (f.senha.length < 6) e.senha = "Mínimo de 6 caracteres";
  return e;
}
export function validarCadastro(f) {
  const e = {};
  if (f.nome.trim().length < 3) e.nome = "Informe seu nome";
  if (!emailValido(f.email)) e.email = "E-mail inválido";
  if (somenteDigitos(f.telefone).length < 10) e.telefone = "Telefone inválido";
  if (f.senha.length < 6) e.senha = "Mínimo de 6 caracteres";
  return e;
}
export function validarEndereco(end) {
  const e = {};
  if (somenteDigitos(end.cep).length !== 8) e.cep = "CEP inválido";
  if (!end.rua.trim()) e.rua = "Obrigatório";
  if (!end.numero.trim()) e.numero = "Obrigatório";
  if (!end.cidade.trim()) e.cidade = "Obrigatório";
  if (end.uf.trim().length !== 2) e.uf = "UF";
  return e;
}
export function validarCartao(c) {
  const e = {};
  if (somenteDigitos(c.numero).length < 13) e.cnum = "Número inválido";
  if (!/^\d{2}\/\d{2}$/.test(c.validade)) e.cval = "MM/AA";
  if (c.cvv.length < 3) e.ccvv = "CVV";
  return e;
}
export function validarItem(f) {
  const e = {};
  if (f.nome.trim().length < 3) e.nome = "Informe o título";
  if (f.descricao.trim().length < 10) e.descricao = "Descreva o item (mín. 10 caracteres)";
  if (!(parseFloat(f.preco.replace(",", ".")) > 0)) e.preco = "Preço inválido";
  if (f.estoque !== undefined && !/^\d+$/.test(f.estoque.trim())) e.estoque = "Estoque inválido";
  return e;
}
