"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

// SKU de la ficha con copiado al portapapeles: los talleres pegan el codigo
// directo en WhatsApp o en su sistema. Aviso "Código copiado" 2 s con aria-live.

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
      // Portapapeles bloqueado (permisos o contexto no seguro): el SKU sigue
      // visible y seleccionable, la ficha no se rompe.
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-borde bg-fondo py-1 pl-2.5 pr-1">
      <span className="num-tab font-mono text-sm text-tinta">{codigo}</span>
      <button
        type="button"
        onClick={manejarCopiar}
        aria-label={`Copiar código ${codigo}`}
        className="rounded p-1 text-tinta-suave transition-colors duration-150 hover:bg-borde hover:text-tinta"
      >
        {copiado ? (
          <Check aria-hidden className="size-3.5 text-exito" />
        ) : (
          <Copy aria-hidden className="size-3.5" />
        )}
      </button>
      <span aria-live="polite" className="text-xs font-semibold text-exito">
        {copiado ? "Código copiado" : ""}
      </span>
    </span>
  );
}
