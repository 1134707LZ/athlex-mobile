/**
 * Modelos de domínio (apenas documentação JSDoc; o JavaScript não exige declaração de tipos).
 *
 * @typedef {"Camisas" | "Chuteiras" | "Bolas" | "Acessórios" | "Agasalhos"} Categoria
 * @typedef {"COMPRADOR" | "VENDEDOR" | "ADMINISTRADOR"} TipoUsuario
 * @typedef {"COMPRADOR" | "VENDEDOR"} PerfilCadastro
 *
 * @typedef {Object} Produto
 * @property {string} id
 * @property {string} nome
 * @property {string} descricao
 * @property {number} preco
 * @property {Categoria} categoria
 * @property {string[]} tamanhos
 * @property {string[]} cores  hex
 * @property {string} [imagem]  URL ou data URI base64
 * @property {boolean} personalizavel
 * @property {number} estoque
 * @property {string} [vendedorId]
 *
 * @typedef {Object} Usuario
 * @property {string} id
 * @property {string} nome
 * @property {string} email
 * @property {string} [telefone]
 * @property {TipoUsuario} tipo
 *
 * @typedef {Object} Personalizacao
 * @property {string} modelo
 * @property {string} cor
 * @property {string} [nome]
 * @property {string} [numero]
 * @property {number} acrescimo
 *
 * @typedef {Object} ItemCarrinho
 * @property {string} key
 * @property {Produto} produto
 * @property {number} quantidade
 * @property {string} tamanho
 * @property {string} cor
 * @property {Personalizacao} [personalizacao]
 *
 * @typedef {{ cep: string, rua: string, numero: string, cidade: string, uf: string }} Endereco
 *
 * @typedef {Object} Pedido
 * @property {string} id
 * @property {string} data
 * @property {number} total
 * @property {"AGUARDANDO_PAGAMENTO" | "EM_TRANSITO" | "ENTREGUE"} status
 * @property {{ nome: string, quantidade: number, preco: number }[]} itens
 *
 * @typedef {Object} Venda  venda do ponto de vista do vendedor (só os itens dele)
 * @property {string} pedidoId
 * @property {string} data
 * @property {Pedido["status"]} status
 * @property {number} subtotal
 * @property {Pedido["itens"]} itens
 *
 * @typedef {{ vendas: number, faturamento: number }} ResumoVendas
 */
export {};
