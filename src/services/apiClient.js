/**
 * Contrato da camada de dados (documentado com JSDoc).
 * Telas e contextos dependem APENAS deste contrato (Dependency Inversion): quem fala com a rede
 * (httpApi) ou com dados locais (mockApi) é decidido em um único lugar (services/api.js).
 *
 * @typedef {import("../types").Usuario} Usuario
 * @typedef {import("../types").Produto} Produto
 * @typedef {import("../types").Pedido} Pedido
 * @typedef {import("../types").Venda} Venda
 * @typedef {import("../types").ResumoVendas} ResumoVendas
 *
 * @typedef {{ token: string, usuario: Usuario }} AuthResult
 * @typedef {{ nome: string, email: string, telefone: string, senha: string, perfil: "COMPRADOR" | "VENDEDOR" }} NovoCadastro
 * @typedef {{ itens: import("../types").ItemCarrinho[], endereco: import("../types").Endereco, pagamento: "CARTAO" | "PIX" | "BOLETO", total: number }} NovoPedido
 *
 * @typedef {Object} ApiClient
 * @property {(d: NovoCadastro) => Promise<void>} register
 * @property {(email: string, senha: string) => Promise<AuthResult>} login
 * @property {(busca?: string, categoria?: string) => Promise<Produto[]>} listarProdutos
 * @property {(id: string) => Promise<Produto>} obterProduto
 * @property {(p: Omit<Produto, "id">) => Promise<Produto>} cadastrarProduto
 * @property {(id: string, p: Omit<Produto, "id">) => Promise<Produto>} atualizarProduto
 * @property {(id: string) => Promise<void>} removerProduto
 * @property {(usuarioId: string) => Promise<Produto[]>} meusProdutos
 * @property {() => Promise<Venda[]>} listarVendas
 * @property {() => Promise<ResumoVendas>} resumoVendas
 * @property {(d: NovoPedido) => Promise<Pedido>} criarPedido
 * @property {() => Promise<Pedido[]>} listarPedidos
 */

/** Erro de API com o status HTTP (401, 403, 404, 409...). */
export class ApiError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   */
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
