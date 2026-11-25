# Athlex Mobile (React Native + Expo, JavaScript)

E-commerce mobile com **dois perfis de acesso**:

| Perfil | Abas | Pode |
|---|---|---|
| **Vendedor** | Dashboard · Produtos · Vendas · Perfil | CRUD de produtos (com upload de imagem e estoque), ver histórico de vendas e indicadores |
| **Comprador** (e visitante) | Início · Categorias · Carrinho · Pedidos · Perfil | buscar/filtrar por categoria, personalizar, carrinho, checkout, histórico de compras. **Não** faz manutenção de produtos |

## Rodar
```bash
npm install
npx expo start         # Expo Go (Android/iOS)
npm test               # Jest (21 testes)
```
Contas demo (mock, senha `123456`): `demo@athlex.com` (comprador) · `vendedor@athlex.com` (vendedor).

## Backend real
`cp .env.example .env` → `EXPO_PUBLIC_USE_MOCK=false` e `EXPO_PUBLIC_API_URL=http://<ip>:8080` (API Gateway Java; repositório **athlex-backend**).
Arquitetura e padrões: `docs/ARQUITETURA.md`.
