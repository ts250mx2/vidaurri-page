"use client";

import Link from "next/link";

// Render del texto que devuelve el Vendedor IA, compartido por el chat público
// (ChatVico) y el chat del mostrador. Vive aparte para que ambos pinten las
// negritas, los enlaces a la ficha y los códigos exactamente igual: si el
// formato del webservice cambia, se corrige en un solo lugar.

export type FotoChat = { codigo: string; url: string };

/** ¿Lo que va entre paréntesis es un código de pieza? Con el prefijo "código"
 *  se acepta casi cualquier token; sin prefijo se exige letra Y dígito, para
 *  no convertir en enlace paréntesis normales como "(DER)" o "(18-23)". */
export function comoCodigo(crudo: string): string | null {
  const limpio = crudo.trim();
  const sinPrefijo = limpio.replace(/^c[oó]d(?:igo)?\.?:?\s+/i, "");
  if (!/^[A-Za-z0-9._/-]{3,30}$/.test(sinPrefijo)) return null;
  const tuvoPrefijo = sinPrefijo !== limpio;
  if (!tuvoPrefijo && !(/[A-Za-z]/.test(sinPrefijo) && /\d/.test(sinPrefijo))) {
    return null;
  }
  return sinPrefijo;
}

/** A dónde manda un código: a la ficha de nuevas, salvo que la foto del mismo
 *  código venga de la Bodega Usado (las usadas no tienen ficha por código,
 *  se buscan). */
export function destinoPieza(codigo: string, fotos?: FotoChat[]): string {
  const foto = fotos?.find(
    (f) => f.codigo.toUpperCase() === codigo.toUpperCase()
  );
  if (foto && /\/usadas\//i.test(foto.url)) {
    return `/usadas?texto=${encodeURIComponent(codigo)}`;
  }
  return `/pieza/${encodeURIComponent(codigo)}`;
}

/** ¿Esta negrita parece el NOMBRE de una pieza? Descarta precios y las
 *  palabras de entrega que el vendedor también pone en negritas. */
export function esNombreDePieza(negrita: string): boolean {
  const limpio = negrita.trim();
  if (limpio.length < 4 || limpio.startsWith("$")) return false;
  if (!/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(limpio)) return false;
  return !/^(entrega\s+inmediata|sobre\s+pedido|usadas?|nuevas?|pieza\s+única)$/i.test(
    limpio
  );
}

const RE_PAREN_TRAS_NEGRITA = /^(\s*)\(([^()\n]{3,40})\)/;

/** Render del formato estilo WhatsApp que devuelve el webservice: *negritas*
 *  con un solo asterisco y saltos de línea. Además ENLAZA cada producto a su
 *  página: si junto al nombre viene el código —"*Cofre Aveo 18-23* (CCAE18)"—
 *  ese es el enlace; si el texto no trae códigos, se usan los de las fotos del
 *  mensaje (son los códigos exactos de lo que Vico sugirió), emparejados en
 *  orden solo cuando la cuenta coincide, para no enlazar a la pieza equivocada. */
export function TextoVico({
  texto,
  fotos,
  alNavegar,
}: {
  texto: string;
  fotos?: FotoChat[];
  alNavegar: (href: string) => void;
}) {
  // Pasada 1: cada línea partida en [texto, negrita, texto, ...], y por cada
  // negrita se busca el código en el paréntesis que la sigue.
  const lineas = texto.split("\n").map((linea) => {
    const partes = linea.split(/\*([^*\n]+)\*/g);
    const codigos: Array<string | null> = [];
    const recortes: number[] = [];
    for (let j = 1; j < partes.length; j += 2) {
      const m = RE_PAREN_TRAS_NEGRITA.exec(partes[j + 1] ?? "");
      const codigo = m ? comoCodigo(m[2]) : null;
      codigos.push(codigo);
      recortes.push(codigo && m ? m[0].length : 0);
    }
    return { partes, codigos, recortes };
  });

  // Respaldo: sin códigos en el texto pero con fotos, se emparejan nombres y
  // fotos en orden. Solo si la cuenta cuadra (o hay UNA foto y UN nombre):
  // adivinar de más enlazaría a la pieza equivocada.
  const hayEnlaceEnTexto = lineas.some((l) => l.codigos.some(Boolean));
  if (!hayEnlaceEnTexto && fotos && fotos.length > 0) {
    const nombres: Array<{ linea: number; slot: number }> = [];
    lineas.forEach((l, i) => {
      l.codigos.forEach((_, slot) => {
        if (esNombreDePieza(l.partes[slot * 2 + 1] ?? "")) {
          nombres.push({ linea: i, slot });
        }
      });
    });
    if (nombres.length === fotos.length || (fotos.length === 1 && nombres.length === 1)) {
      nombres.forEach(({ linea, slot }, k) => {
        lineas[linea].codigos[slot] = fotos[k].codigo;
      });
    }
  }

  return (
    <>
      {lineas.map(({ partes, codigos, recortes }, i) => (
        <p key={i} className="min-h-[1em] whitespace-pre-wrap break-words">
          {partes.map((parte, j) => {
            if (j % 2 === 1) {
              const slot = (j - 1) / 2;
              const codigo = codigos[slot];
              if (!codigo) return <strong key={j}>{parte}</strong>;
              const paren = recortes[slot]
                ? (partes[j + 1] ?? "").slice(0, recortes[slot])
                : "";
              const destino = destinoPieza(codigo, fotos);
              return (
                <Link
                  key={j}
                  href={destino}
                  // Navegación manual: cerrar el chat en el mismo clic desmonta
                  // el <a> a media propagación y Next pierde el brinco. Se
                  // previene el default y navega el router, que no depende del
                  // elemento.
                  onClick={(e) => {
                    e.preventDefault();
                    alNavegar(destino);
                  }}
                  title={`Ver la pieza ${codigo} en la página`}
                  className="font-bold underline decoration-ambar decoration-2 underline-offset-2 transition-colors duration-150 hover:text-ambar-press"
                >
                  {parte}
                  {paren}
                </Link>
              );
            }
            // Texto plano: si su arranque ya se pintó dentro del enlace de la
            // negrita anterior, se recorta para no duplicar el paréntesis.
            const slotPrevio = j / 2 - 1;
            const recorte = j >= 2 ? (recortes[slotPrevio] ?? 0) : 0;
            const visible =
              recorte && codigos[slotPrevio] ? parte.slice(recorte) : parte;
            return visible;
          })}
        </p>
      ))}
    </>
  );
}
