import React, { createContext, useContext, useMemo, useState } from "react";
import { totalDoCarrinho } from "../domain/pricing";
const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);
export function CartProvider({ children }) {
  const [itens, setItens] = useState([]);
  const value = useMemo(
    () => ({
      itens,
      quantidade: itens.reduce((s, i) => s + i.quantidade, 0),
      total: totalDoCarrinho(itens),
      adicionar: (produto, { tamanho, cor, quantidade = 1, personalizacao }) =>
        setItens((cur) => {
          const key = [produto.id, tamanho, cor, JSON.stringify(personalizacao ?? null)].join("|");
          const ex = cur.find((i) => i.key === key);
          if (ex) return cur.map((i) => (i.key === key ? { ...i, quantidade: i.quantidade + quantidade } : i));
          return [...cur, { key, produto, quantidade, tamanho, cor, personalizacao }];
        }),
      alterarQuantidade: (key, delta) =>
        setItens((cur) =>
          cur.map((i) => (i.key === key ? { ...i, quantidade: Math.max(1, i.quantidade + delta) } : i)),
        ),
      remover: (key) => setItens((cur) => cur.filter((i) => i.key !== key)),
      limpar: () => setItens([]),
    }),
    [itens],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
