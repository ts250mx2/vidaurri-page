"use client";

import { useEffect } from "react";

// La hoja se abrió desde "Imprimir orden" del detalle (`?imprimir=1`): se
// lanza el diálogo de impresión una sola vez, cuando las fuentes ya cargaron
// para que el rótulo del folio no salga en la tipografía de respaldo. La
// bandera `cancelado` evita el doble print() del montaje duplicado de
// desarrollo (StrictMode) y de un desmontaje a medio camino.

export function ImpresionAutomatica() {
  useEffect(() => {
    let cancelado = false;
    document.fonts.ready.then(() => {
      if (!cancelado) window.print();
    });
    return () => {
      cancelado = true;
    };
  }, []);
  return null;
}
