import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "./Icon";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { podeGerenciarProdutos } from "../domain/permissions";
import { colors } from "../theme";
/** Navbar superior: menu (drawer) à esquerda, logo ao centro, perfil à direita */
export default function Navbar({ back }) {
  const nav = useNavigation();
  const { usuario } = useAuth();
  const home = podeGerenciarProdutos(usuario?.tipo) ? "Dashboard" : "Home";
  return (
    <View style={s.bar}>
      <Pressable
        hitSlop={12}
        onPress={() => (back && nav.canGoBack() ? nav.goBack() : nav.navigate("Menu"))}
        accessibilityLabel={back ? "Voltar" : "Abrir menu"}
        style={s.side}
      >
        <Icon name={back ? "back" : "menu"} color={colors.text} />
      </Pressable>
      <Pressable onPress={() => nav.navigate("Tabs", { screen: home })} style={s.logo}>
        <Logo height={22} />
      </Pressable>
      <Pressable
        hitSlop={12}
        onPress={() => nav.navigate("Tabs", { screen: "Perfil" })}
        accessibilityLabel="Perfil"
        style={s.side}
      >
        <View style={s.avatar}>
          <Icon name="user" size={18} color={colors.primary} />
        </View>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  bar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  side: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  logo: { flex: 1, alignItems: "center" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
