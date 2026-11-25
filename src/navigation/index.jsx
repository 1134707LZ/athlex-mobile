import React from "react";
import { View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { LoginScreen, RegisterScreen } from "../screens/AuthScreens";
import { HomeScreen, ResultadoScreen } from "../screens/HomeScreens";
import { DetalheScreen, PersonalizarScreen } from "../screens/ProductScreens";
import { DashboardScreen, ProdutoFormScreen, ProdutosScreen, VendasScreen } from "../screens/SellerScreens";
import { podeGerenciarProdutos } from "../domain/permissions";
import { CarrinhoScreen, CheckoutScreen, PedidosScreen } from "../screens/OrderScreens";
import { MenuScreen, PerfilScreen } from "../screens/MenuScreens";
import { colors } from "../theme";
import { navigationRef } from "./ref";
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const tabOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
  tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6, borderTopColor: colors.border },
};
const tab = (icon, label) => ({
  title: label,
  tabBarIcon: ({ color }) => <Icon name={icon} color={color} />,
});
/** Perfil 1 — Vendedor: Dashboard · Produtos · Vendas · Perfil */
function SellerTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={tab("home", "Dashboard")} />
      <Tab.Screen name="Produtos" component={ProdutosScreen} options={tab("box", "Produtos")} />
      <Tab.Screen name="Vendas" component={VendasScreen} options={tab("truck", "Vendas")} />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={tab("user", "Perfil")} />
    </Tab.Navigator>
  );
}
/** Perfil 2 — Comprador (e visitante): Início · Categorias · Carrinho · Pedidos · Perfil */
function BuyerTabs() {
  const { quantidade } = useCart();
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Home" component={HomeScreen} options={tab("home", "Início")} />
      <Tab.Screen name="Buscar" component={ResultadoScreen} options={tab("search", "Categorias")} />
      <Tab.Screen
        name="Carrinho"
        component={CarrinhoScreen}
        options={{
          ...tab("cart", "Carrinho"),
          tabBarBadge: quantidade || undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent },
        }}
      />
      <Tab.Screen name="PedidosTab" component={PedidosScreen} options={tab("truck", "Pedidos")} />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={tab("user", "Perfil")} />
    </Tab.Navigator>
  );
}
function Tabs() {
  const { usuario } = useAuth();
  return podeGerenciarProdutos(usuario?.tipo) ? <SellerTabs /> : <BuyerTabs />;
}
export default function Navigation() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <View style={{ flex: 1, backgroundColor: colors.surface }} />;
  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary } }}
    >
      <Stack.Navigator initialRouteName={usuario ? "Tabs" : "Login"} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={RegisterScreen} />
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Detalhe" component={DetalheScreen} />
        <Stack.Screen name="Personalizar" component={PersonalizarScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Pedidos" component={PedidosScreen} />
        <Stack.Screen name="ProdutoForm" component={ProdutoFormScreen} />
        <Stack.Screen
          name="Menu"
          component={MenuScreen}
          options={{ presentation: "transparentModal", animation: "fade" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
