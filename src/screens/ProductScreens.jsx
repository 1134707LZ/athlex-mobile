import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "../components/Icon";
import ProductImage from "../components/ProductImage";
import Screen from "../components/Screen";
import ShirtPreview from "../components/ShirtPreview";
import { Button, Card, Chip, Input, SectionTitle, Swatch } from "../components/ui";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";
import Stepper from "../components/Stepper";
import { acrescimoPersonalizacao, PRECO_NOME, PRECO_NUMERO } from "../domain/pricing";
import { brl, colors, font, radius } from "../theme";
function useProduto(id) {
  const [p, setP] = useState(null);
  useEffect(() => {
    api
      .obterProduto(id)
      .then(setP)
      .catch(() => Alert.alert("Erro", "Produto não encontrado."));
  }, [id]);
  return p;
}
export function DetalheScreen({ route }) {
  const nav = useNavigation();
  const { adicionar } = useCart();
  const p = useProduto(route.params.id);
  const [tamanho, setTamanho] = useState("");
  const [cor, setCor] = useState("");
  const [qtd, setQtd] = useState(1);
  useEffect(() => {
    if (p) {
      setTamanho(p.tamanhos[0]);
      setCor(p.cores[0]);
    }
  }, [p]);
  if (!p)
    return (
      <Screen back>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 64 }} />
      </Screen>
    );
  const add = () => {
    adicionar(p, { tamanho, cor, quantidade: qtd });
    Alert.alert("Adicionado", `${p.nome} foi para o carrinho.`, [
      { text: "Continuar" },
      { text: "Ver carrinho", onPress: () => nav.navigate("Tabs", { screen: "Carrinho" }) },
    ]);
  };
  return (
    <Screen
      back
      footer={
        <Button
          title={p.estoque > 0 ? `Adicionar · ${brl(p.preco * qtd)}` : "Sem estoque"}
          disabled={p.estoque <= 0 || qtd > p.estoque}
          onPress={add}
        />
      }
    >
      <View
        style={{
          height: 220,
          borderRadius: radius.lg,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <ProductImage
          uri={p.imagem}
          style={{ width: "100%", height: "100%" }}
          fallback={
            p.categoria === "Camisas" ? (
              <ShirtPreview cor={cor || p.cores[0]} modelo="Gola redonda" size={190} />
            ) : (
              <Icon name="tag" size={64} color={colors.primary} />
            )
          }
        />
      </View>
      <Text style={[font.h1, { marginTop: 16 }]}>{p.nome}</Text>
      <Text style={{ fontSize: 22, fontWeight: "700", color: colors.primary, marginVertical: 4 }}>{brl(p.preco)}</Text>
      <Text style={[font.small, { color: p.estoque > 0 ? colors.success : colors.danger, fontWeight: "600" }]}>
        {p.estoque > 0 ? `Em estoque: ${p.estoque}` : "Indisponível"}
      </Text>
      <Text style={[font.body, { color: colors.textMuted, lineHeight: 20, marginTop: 8 }]}>{p.descricao}</Text>

      <SectionTitle>Tamanho</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8 }}>
        {p.tamanhos.map((t) => (
          <Chip key={t} label={t} active={t === tamanho} onPress={() => setTamanho(t)} />
        ))}
      </View>

      <SectionTitle>Cor</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {p.cores.map((c) => (
          <Swatch key={c} color={c} active={c === cor} onPress={() => setCor(c)} />
        ))}
      </View>

      <SectionTitle>Quantidade</SectionTitle>
      <Stepper value={qtd} onChange={setQtd} />

      {p.personalizavel && (
        <Pressable onPress={() => nav.navigate("Personalizar", { id: p.id, tamanho, cor })} style={{ marginTop: 24 }}>
          <Card style={{ flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: colors.accent }}>
            <Icon name="tag" color={colors.accent} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontWeight: "700", color: colors.text }}>Personalizar este produto</Text>
              <Text style={font.small}>Modelo, cor, nome e número</Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Personalizar ›</Text>
          </Card>
        </Pressable>
      )}
    </Screen>
  );
}
const MODELOS = ["Gola redonda", "Gola V", "Polo"];
/** Tela de Personalização de Produto (RF03) */
export function PersonalizarScreen({ route }) {
  const nav = useNavigation();
  const { adicionar } = useCart();
  const p = useProduto(route.params.id);
  const [modelo, setModelo] = useState(MODELOS[0]);
  const [cor, setCor] = useState(route.params.cor);
  const [tamanho, setTamanho] = useState(route.params.tamanho);
  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState("");
  if (!p)
    return (
      <Screen back>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 64 }} />
      </Screen>
    );
  const acrescimo = acrescimoPersonalizacao(nome, numero);
  const add = () => {
    adicionar(p, {
      tamanho,
      cor,
      personalizacao: { modelo, cor, nome: nome || undefined, numero: numero || undefined, acrescimo },
    });
    nav.navigate("Tabs", { screen: "Carrinho" });
  };
  return (
    <Screen back footer={<Button title={`Adicionar ao carrinho · ${brl(p.preco + acrescimo)}`} onPress={add} />}>
      <View
        style={{ alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 12 }}
      >
        <ShirtPreview cor={cor} modelo={modelo} nome={nome} numero={numero} size={240} />
      </View>
      <Text style={[font.h1, { marginTop: 16 }]}>Personalizar {p.nome}</Text>

      <SectionTitle>Modelo</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8 }}>
        {MODELOS.map((m) => (
          <Chip key={m} label={m} active={m === modelo} onPress={() => setModelo(m)} />
        ))}
      </View>

      <SectionTitle>Cor</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {p.cores.map((c) => (
          <Swatch key={c} color={c} active={c === cor} onPress={() => setCor(c)} />
        ))}
      </View>

      <SectionTitle>Tamanho</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8, marginBottom: 8 }}>
        {p.tamanhos.map((t) => (
          <Chip key={t} label={t} active={t === tamanho} onPress={() => setTamanho(t)} />
        ))}
      </View>

      <SectionTitle>Elementos personalizados</SectionTitle>
      <Input
        label={`Nome (+${brl(PRECO_NOME)})`}
        value={nome}
        onChangeText={(v) => setNome(v.slice(0, 12))}
        placeholder="Ex.: SILVA"
        autoCapitalize="characters"
      />
      <Input
        label={`Número (+${brl(PRECO_NUMERO)})`}
        value={numero}
        onChangeText={(v) => setNumero(v.replace(/\D/g, "").slice(0, 2))}
        placeholder="10"
        keyboardType="number-pad"
      />
    </Screen>
  );
}
