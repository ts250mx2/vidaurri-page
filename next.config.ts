import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Raíz del workspace fija para que la externalización de paquetes resuelva
  // node_modules correctamente aunque exista otro lockfile arriba en el árbol.
  outputFileTracingRoot: path.join(__dirname),
  // SIN `images.remotePatterns` a propósito. Permitir el S3 de Aldo o el
  // servidor de la Bodega Usado como origen dejaría cargar una foto de pieza
  // directamente desde la fuente, y esa saldría SIN el sello de la casa. Toda
  // foto tiene que entrar por /api/foto o /api/usadas/foto, que sellan. Si
  // algún día hace falta un origen remoto de verdad, que sea uno que no sirva
  // fotos de producto.
};

export default nextConfig;
