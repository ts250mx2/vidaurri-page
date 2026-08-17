"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import clsx from "clsx";

// Foto de producto con respaldo: si el S3/galeria no tiene la imagen, se
// muestra un marcador neutro en lugar del icono de imagen rota del navegador.
// El fondo lo decide quien la usa (normalmente `trama-anaquel`): las fotos del
// catalogo vienen recortadas sobre blanco y necesitan una base que las sostenga.

export function FotoPieza({
  src,
  alt,
  className,
  imgClassName,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [fallo, setFallo] = useState(false);

  return (
    <span
      className={clsx(
        "flex items-center justify-center overflow-hidden",
        className
      )}
    >
      {fallo || !src ? (
        <span className="flex flex-col items-center gap-2 px-2 text-center">
          <ImageOff aria-hidden className="size-7 text-borde-fuerte" />
          <span className="rotulo text-tinta-suave">Foto por tomar</span>
        </span>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFallo(true)}
          className={clsx("h-full w-full object-contain", imgClassName)}
        />
      )}
    </span>
  );
}
