import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import Icon from "../components/Icon";
import RequireSeller from "../components/NeedRole";
import Screen from "../components/Screen";
import { Button, Card, Chip, Empty, Input, SectionTitle } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { valido, validarItem } from "../domain/validators";
import { api } from "../services/api";
import { brl, colors, font, radius } from "../theme";
const STATUS = { AGUARDANDO_PAGAMENTO: "Aguardando", EM_TRANSITO: "Em transporte", ENTREGUE: "Concluído" };
const fmtData = (iso) => new Date(iso).toLocaleDateString("pt-BR");
/** Carrega dados da tela sempre que ela ganha foco (ex.: voltar do formulário). */
function useCarga(fn) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      fn()
        .then((d) => vivo && (setDados(d), setErro(null)))
        .catch((e) => vivo && setErro(e.message));
      return () => {
        vivo = false;
      };
    }, []),
  ); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    dados,
    erro,
    recarregar: () =>
      fn()
        .then(setDados)
        .catch((e) => setErro(e.message)),
  };
}
function Metric({ label, value, icon }) {
  return (
    <Card style={{ flex: 1, padding: 12 }}>
      <Icon name={icon} size={20} color={colors.primary} />
      <Text style={[font.small, { marginTop: 8 }]}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{value}</Text>
    </Card>
  );
}
function ProdutoLinha({ p, onEdit, onDelete }) {
  return (
    <Card style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, padding: 12 }}>
      <View style={s.thumb}>
        {p.imagem ? (
          <Image source={{ uri: p.imagem }} style={StyleSheet.absoluteFill} />
        ) : (
          <Icon name="tag" color={colors.primary} />
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text numberOfLines={1} style={{ fontWeight: "700", color: colors.text }}>
          {p.nome}
        </Text>
        <Text style={font.small}>{brl(p.preco)}</Text>
        <Text style={[font.small, { color: p.estoque > 0 ? colors.textMuted : colors.danger }]}>
          Estoque: {p.estoque}
        </Text>
      </View>
      {onEdit && (
        <Pressable hitSlop={10} onPress={onEdit} accessibilityLabel="Editar" style={{ padding: 8 }}>
          <Icon name="tag" size={20} color={colors.primary} />
        </Pressable>
      )}
      {onDelete && (
        <Pressable hitSlop={10} onPress={onDelete} accessibilityLabel="Excluir" style={{ padding: 8 }}>
          <Icon name="trash" size={20} color={colors.danger} />
        </Pressable>
      )}
    </Card>
  );
}
function VendaLinha({ v }) {
  return (
    <Card style={{ marginBottom: 10, padding: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontWeight: "700" }}>Pedido {v.pedidoId.replace("PED-", "#")}</Text>
        <Text style={{ color: colors.success, fontWeight: "600" }}>{STATUS[v.status]}</Text>
      </View>
      <Text style={font.small}>{fmtData(v.data)}</Text>
      {v.itens.map((i, k) => (
        <Text key={k} style={font.small}>
          {i.quantidade}× {i.nome}
        </Text>
      ))}
      <Text style={{ fontWeight: "700", color: colors.primary, marginTop: 4 }}>{brl(v.subtotal)}</Text>
    </Card>
  );
}
/** Painel do Vendedor: indicadores + produtos + últimas vendas */
export function DashboardScreen() {
  const nav = useNavigation();
  const { usuario } = useAuth();
  const prods = useCarga(() => api.meusProdutos(usuario.id));
  const resumo = useCarga(() => api.resumoVendas());
  const vendas = useCarga(() => api.listarVendas());
  return (
    <RequireSeller>
      <Screen>
        <Text style={font.h1}>Painel do Vendedor</Text>
        <Text style={[font.small, { marginBottom: 16 }]}>Bem-vindo(a), {usuario?.nome}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Metric icon="box" label="Produtos" value={String(prods.dados?.length ?? "–")} />
          <Metric icon="truck" label="Vendas" value={String(resumo.dados?.vendas ?? "–")} />
          <Metric icon="tag" label="Faturamento" value={resumo.dados ? brl(resumo.dados.faturamento) : "–"} />
        </View>
        <SectionTitle>Produtos</SectionTitle>
        {prods.dados === null ? (
          <ActivityIndicator color={colors.primary} />
        ) : prods.dados.length === 0 ? (
          <Empty text="Cadastre seu primeiro produto." />
        ) : (
          prods.dados.slice(0, 3).map((p) => <ProdutoLinha key={p.id} p={p} />)
        )}
        <Button title="Ver todos os produtos" variant="outline" onPress={() => nav.navigate("Produtos")} />
        <SectionTitle>Histórico de vendas</SectionTitle>
        {vendas.dados === null ? (
          <ActivityIndicator color={colors.primary} />
        ) : vendas.dados.length === 0 ? (
          <Empty text="Nenhuma venda ainda." />
        ) : (
          vendas.dados.slice(0, 3).map((v) => <VendaLinha key={v.pedidoId} v={v} />)
        )}
      </Screen>
    </RequireSeller>
  );
}
/** Manutenção de produtos (CRUD): listar, editar, excluir e criar */
export function ProdutosScreen() {
  const nav = useNavigation();
  const { usuario } = useAuth();
  const { dados, erro, recarregar } = useCarga(() => api.meusProdutos(usuario.id));
  const excluir = (p) =>
    Alert.alert("Excluir produto", `Remover "${p.nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await api.removerProduto(p.id);
            recarregar();
          } catch (e) {
            Alert.alert("Erro", e.message);
          }
        },
      },
    ]);
  return (
    <RequireSeller>
      <Screen footer={<Button title="Novo produto" onPress={() => nav.navigate("ProdutoForm")} />}>
        <Text style={[font.h1, { marginBottom: 12 }]}>Meus produtos</Text>
        {erro ? <Text style={{ color: colors.danger }}>{erro}</Text> : null}
        {dados === null ? (
          <ActivityIndicator color={colors.primary} />
        ) : dados.length === 0 ? (
          <Empty text="Nenhum produto cadastrado." />
        ) : (
          dados.map((p) => (
            <ProdutoLinha
              key={p.id}
              p={p}
              onEdit={() => nav.navigate("ProdutoForm", { id: p.id })}
              onDelete={() => excluir(p)}
            />
          ))
        )}
      </Screen>
    </RequireSeller>
  );
}
export function VendasScreen() {
  const { dados, erro } = useCarga(() => api.listarVendas());
  return (
    <RequireSeller>
      <Screen>
        <Text style={[font.h1, { marginBottom: 12 }]}>Histórico de vendas</Text>
        {erro ? <Text style={{ color: colors.danger }}>{erro}</Text> : null}
        {dados === null ? (
          <ActivityIndicator color={colors.primary} />
        ) : dados.length === 0 ? (
          <Empty text="Nenhuma venda ainda." />
        ) : (
          dados.map((v) => <VendaLinha key={v.pedidoId} v={v} />)
        )}
      </Screen>
    </RequireSeller>
  );
}
const CATEGORIAS = ["Camisas", "Chuteiras", "Bolas", "Acessórios", "Agasalhos"];
/** Criar/editar produto (com upload de imagem da galeria) */
export function ProdutoFormScreen({ route }) {
  const nav = useNavigation();
  const id = route?.params?.id;
  const [carregado, setCarregado] = useState(!id);
  const [imagem, setImagem] = useState();
  const [f, setF] = useState({ nome: "", descricao: "", preco: "", tamanhos: "Único", estoque: "1" });
  const [categoria, setCategoria] = useState("Camisas");
  const [personalizavel, setPersonalizavel] = useState(false);
  const [cores, setCores] = useState(["#0F172A", "#2563EB", "#FFFFFF"]);
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  React.useEffect(() => {
    if (!id) return;
    api
      .obterProduto(id)
      .then((p) => {
        setF({
          nome: p.nome,
          descricao: p.descricao,
          preco: String(p.preco).replace(".", ","),
          tamanhos: p.tamanhos.join(", "),
          estoque: String(p.estoque),
        });
        setCategoria(p.categoria);
        setPersonalizavel(p.personalizavel);
        setImagem(p.imagem);
        setCores(p.cores);
        setCarregado(true);
      })
      .catch((e) => Alert.alert("Erro", e.message));
  }, [id]);
  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permissão", "Autorize o acesso às fotos para escolher uma imagem.");
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.4,
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
    });
    if (!r.canceled) {
      const a = r.assets[0];
      setImagem(a.base64 ? `data:${a.mimeType ?? "image/jpeg"};base64,${a.base64}` : a.uri); // backend guarda data URI
    }
  };
  const submit = async () => {
    const e = validarItem(f);
    setErr(e);
    if (!valido(e)) return;
    const dados = {
      nome: f.nome.trim(),
      descricao: f.descricao.trim(),
      preco: parseFloat(f.preco.replace(",", ".")),
      categoria,
      imagem,
      personalizavel,
      estoque: parseInt(f.estoque, 10),
      cores,
      tamanhos: f.tamanhos
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    setLoading(true);
    try {
      if (id) await api.atualizarProduto(id, dados);
      else await api.cadastrarProduto(dados);
      nav.goBack();
    } catch (x) {
      Alert.alert("Erro", x.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <RequireSeller>
      <Screen back>
        <Text style={font.h1}>{id ? "Editar produto" : "Novo produto"}</Text>
        {!carregado ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : (
          <>
            <Pressable onPress={pick} style={s.upload}>
              {imagem ? (
                <Image source={{ uri: imagem }} style={{ width: "100%", height: "100%" }} />
              ) : (
                <>
                  <Icon name="image" size={36} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: "600", marginTop: 8 }}>Adicionar imagem</Text>
                </>
              )}
            </Pressable>
            <Input
              label="Título"
              value={f.nome}
              onChangeText={(v) => setF({ ...f, nome: v })}
              error={err.nome}
              placeholder="Ex.: Chuteira Society Pro"
            />
            <Input
              label="Descrição"
              value={f.descricao}
              onChangeText={(v) => setF({ ...f, descricao: v })}
              error={err.descricao}
              multiline
              style={{ minHeight: 80 }}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Input
                label="Preço (R$)"
                value={f.preco}
                onChangeText={(v) => setF({ ...f, preco: v })}
                error={err.preco}
                keyboardType="decimal-pad"
                style={{ flex: 1 }}
              />
              <Input
                label="Estoque"
                value={f.estoque}
                onChangeText={(v) => setF({ ...f, estoque: v })}
                error={err.estoque}
                keyboardType="number-pad"
                style={{ flex: 1 }}
              />
            </View>
            <Input
              label="Tamanhos (separados por vírgula)"
              value={f.tamanhos}
              onChangeText={(v) => setF({ ...f, tamanhos: v })}
              placeholder="P, M, G"
            />
            <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 6 }}>Categoria</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8, marginBottom: 16 }}>
              {CATEGORIAS.map((c) => (
                <Chip key={c} label={c} active={c === categoria} onPress={() => setCategoria(c)} />
              ))}
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}
            >
              <Text style={{ fontWeight: "600" }}>Permitir personalização</Text>
              <Switch value={personalizavel} onValueChange={setPersonalizavel} trackColor={{ true: colors.primary }} />
            </View>
            <Button title={id ? "Salvar alterações" : "Publicar produto"} onPress={submit} loading={loading} />
          </>
        )}
      </Screen>
    </RequireSeller>
  );
}
const s = StyleSheet.create({
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  upload: {
    height: 160,
    marginVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
