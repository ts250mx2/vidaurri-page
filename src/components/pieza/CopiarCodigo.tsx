"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

// El número de parte de la hoja, con copiado al portapapeles: los talleres
// pegan el código directo en WhatsApp o en su sistema. Va en mono porque es
// medida, no adorno. Aviso "Código copiado" durante 2 s con aria-live.

const DURACION_AVISO_MS = 2000;

export function CopiarCodigo({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  const temporizadorRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (temporizadorRef.current !== null) {
        window.clearTimeout(temporizadorRef.current);
      }
    };
  }, []);

  async function manejarCopiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      if (temporizadorRef.current !== null) {
        window.clearTimeout(temporizadorRef.current);
      }
      temporizadorRef.current = window.setTimeout(
        () => setCopiado(false),
        DURACION_AVISO_MS
      );
    } catch {
      // Portapapeles bloqueado (permisos o contexto no seguro): el código sigue
      // visible y seleccionable, la ficha no se rompe.
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex h-11 items-center rounded-md border border-linea bg-papel pl-3">
        <span className="num-tab font-mono text-[15px] font-semibold text-tinta">
          {codigo}
        </span>
        <button
          type="button"
          onClick={manejarCopiar}
          aria-label={`Copiar código ${codigo}`}
          className="ml-1 flex size-11 items-center justify-center rounded-md text-tinta-suave transition-colors duration-150 hover:bg-linea hover:text-tinta"
        >
          {copiado ? (
            <Check aria-hidden className="size-4 text-existencia" />
          ) : (
            <Copy aria-hidden className="size-4" />
          )}
        </button>
      </span>
      <span
        aria-live="polite"
        className="text-xs font-semibold text-existencia empty:hidden"
      >
        {copiado ? "Código copiado" : ""}
      </span>
    </span>
  );
}
