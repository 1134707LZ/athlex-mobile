import React, { useState } from "react";
import { Image } from "react-native";

/** Imagem remota com fallback: se a URL falhar (offline/erro), exibe o conteúdo alternativo (placeholder). */
export default function ProductImage({ uri, style, fallback }) {
  const [falhou, setFalhou] = useState(false);
  if (!uri || falhou) return fallback;
  return <Image source={{ uri }} style={style} resizeMode="cover" onError={() => setFalhou(true)} />;
}
