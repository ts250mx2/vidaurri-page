import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Raíz del workspace fija para que la externalización de paquetes resuelva
  // node_modules correctamente aunque exista otro lockfile arriba en el árbol.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      // Fotos de artículos nuevos (catálogo de Aldo en S3, público).
      { protocol: "https", hostname: "s3-us-west-2.amazonaws.com", pathname: "/aldoautopartesproductos/**" },
      // Fotos reales de las piezas usadas (sistema de la Bodega Usado).
      { protocol: "https", hostname: "sistema.apvidaurri.com", pathname: "/imagenes_piezas/**" },
    ],
  },
};

export default nextConfig;
