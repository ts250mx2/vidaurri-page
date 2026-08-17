"use client";

import { useState } from "react";
import clsx from "clsx";
import { slugificar } from "@/lib/slug";

// Logo del fabricante para la vitrina de marcas. Los archivos viven en
// public/marcas/<slug>.png (descargados una vez con scripts/descargar-logos.mjs,
// nunca enlazados en caliente a un tercero). Si una marca no tiene archivo, cae
// al nombre en Barlow: la rejilla no se rompe ni deja huecos.

export function LogoMarca({
  marca,
  className,
}: {
  marca: string;
  className?: string;
}) {
  const [fallo, setFallo] = useState(false);
  const slug = slugificar(marca);

  if (fallo) {
    return (
      <span
        className={clsx(
          "font-display text-[13px] font-bold uppercase leading-tight tracking-[0.06em] text-tinta",
          className
        )}
      >
        {marca}
      </span>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`/marcas/${slug}.png`}
      alt={marca}
      loading="lazy"
      decoding="async"
      onError={() => setFallo(true)}
      className={clsx("h-full w-full object-contain", className)}
    />
  );
}
