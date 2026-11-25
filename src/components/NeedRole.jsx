import React from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "./Icon";
import Screen from "./Screen";
import { Button } from "./ui";
import NeedLogin from "./NeedLogin";
import { useAuth } from "../context/AuthContext";
import { podeGerenciarProdutos } from "../domain/permissions";
import { colors, font } from "../theme";
/** Guarda de perfil: exige login e perfil de vendedor (espelha o 403 do backend). */
export default function RequireSeller({ children }) {
  const nav = useNavigation();
  const { usuario } = useAuth();
  if (!usuario) return <NeedLogin msg="Entre com uma conta de vendedor para gerenciar produtos." />;
  if (!podeGerenciarProdutos(usuario.tipo))
    return (
      <Screen>
        <View style={{ alignItems: "center", marginTop: 64 }}>
          <Icon name="close" size={48} color={colors.danger} />
          <Text style={[font.h2, { marginTop: 16 }]}>Acesso restrito a vendedores</Text>
          <Text style={[font.small, { textAlign: "center", marginVertical: 8 }]}>
            Compradores não podem fazer manutenção de produtos.
          </Text>
          <Button
            title="Voltar ao início"
            onPress={() => nav.navigate("Tabs", { screen: "Home" })}
            style={{ alignSelf: "stretch", marginTop: 16 }}
          />
        </View>
      </Screen>
    );
  return <>{children}</>;
}
