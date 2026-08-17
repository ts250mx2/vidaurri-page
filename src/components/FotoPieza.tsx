"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageOff } from "lucide-react";
import clsx from "clsx";

// Foto de pieza. Las fotos de usado son de la pieza EXACTA que se entrega: son
// la ventaja de la casa, así que el hueco nunca se queda en blanco. Tres
// estados reales sobre la misma caja ya reservada por quien la usa:
//
//   cargando → placa de espera con el ojo de la cámara respirando
//   listo    → la foto
//   fallo    → la casilla vacía del plano ("foto por tomar")
//
// El navegador no reemite `load` ni `error` de lo que ocurrió antes de que
// React montara los manejadores (foto en caché, hidratación), así que al montar
// se interroga a la imagen. Y si el proxy se queda colgado, un reloj propio
// baja el respaldo: un recuadro vacío no dice nada, "foto por tomar" sí.

type Estado = "cargando" | "listo" | "fallo";

// El proxy corta a los 5s de espera a la primera cabecera; esto cubre además
// la descarga en datos móviles lentos. Al vencer NO se desmonta la imagen: si
// llega tarde, entra y sustituye al respaldo — decir "foto por tomar" de una
// pieza que sí está fotografiada sería mentirle al cliente.
const MS_ESPERA_FOTO = 8000;

export function FotoPieza({
  src,
  alt,
  className,
  imgClassName,
  prioritaria = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  /**
   * Sobre el pliegue: descarga inmediata en vez de diferida. Solo para las
   * primeras piezas de una parrilla; forzarla en todas satura el celular.
   */
  prioritaria?: boolean;
}) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [expiro, setExpiro] = useState(false);
  const refImagen = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) return;

    setEstado("cargando");
    setExpiro(false);

    const imagen = refImagen.current;
    if (imagen?.complete) {
      setEstado(imagen.naturalWidth > 0 ? "listo" : "fallo");
      return;
    }

    const reloj = setTimeout(() => setExpiro(true), MS_ESPERA_FOTO);
    return () => clearTimeout(reloj);
  }, [src]);

  const esperando = Boolean(src) && estado === "cargando";
  const muestraRespaldo = !src || estado === "fallo" || (esperando && expiro);
  const muestraEsqueleto = esperando && !expiro;

  return (
    <span
      className={clsx(
        // `relative`: la placa de espera y el respaldo cubren la caja sin
        // alterar el alto que ya fijó quien nos usa (aspect-ratio o flex).
        "relative flex items-center justify-center overflow-hidden",
        className
      )}
    >
      {src && estado !== "fallo" && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          ref={refImagen}
          src={src}
          // Mientras algo la tape, la imagen no aporta nada al lector de
          // pantalla: el texto del respaldo es el que habla.
          alt={estado === "listo" ? alt : ""}
          loading={prioritaria ? "eager" : "lazy"}
          fetchPriority={prioritaria ? "high" : undefined}
          decoding="async"
          onLoad={() => setEstado("listo")}
          onError={() => setEstado("fallo")}
          className={clsx("h-full w-full object-contain", imgClassName)}
        />
      )}

      {muestraEsqueleto && (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-papel-hondo"
        >
          <Camera className="size-6 animate-pulse text-linea-fuerte [animation-duration:1.6s]" />
        </span>
      )}

      {muestraRespaldo && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-papel-hondo px-2 text-center">
          <ImageOff aria-hidden className="size-7 text-linea-fuerte" />
          <span className="rotulo-tecnico text-[11px] leading-none text-tinta-suave">
            Foto por tomar
          </span>
        </span>
      )}
    </span>
  );
}
