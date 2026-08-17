// Muro de piezas: el fondo del hero armado con fotos REALES del catálogo, no
// con stock. Va totalmente decorativo (aria-hidden) y fundido en grafito por
// `.mosaico-pieza` — las fotos vienen sobre blanco y sin ese tratamiento se
// verían como recuadros brillantes detrás del texto.
//
// Es el único lugar del sitio donde `thumb=1` está justificado: son 12 fotos
// simultáneas, en gris, al 45% y detrás del velo del hero. A tamaño real
// costarían medio mega en la banda que decide el LCP.

/** Celdas de la retícula: 4x3 en móvil y 6x2 en desktop dan el mismo total. */
const CELDAS = 12;

/** Paso al repartir los códigos por las celdas. Primo con el número de
 *  muestras que manda la home (8), así ninguna foto cae junto a su repetición. */
const PASO = 5;

export function MuroPiezas({ codigos }: { codigos: string[] }) {
  if (codigos.length === 0) return null;

  const celdas = Array.from(
    { length: CELDAS },
    (_, i) => codigos[(i * PASO) % codigos.length]
  );

  return (
    <div aria-hidden className="absolute inset-0">
      <div className="grid h-full w-full grid-cols-4 grid-rows-3 md:grid-cols-6 md:grid-rows-2">
        {celdas.map((codigo, i) => (
          <span key={`${codigo}-${i}`} className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/foto?codigo=${encodeURIComponent(codigo)}&thumb=1`}
              alt=""
              decoding="async"
              fetchPriority="low"
              className="mosaico-pieza h-full w-full scale-110 object-cover"
            />
          </span>
        ))}
      </div>

      {/* El hero se acortó y ahora el buscador manda: en desktop el velo se abre
          del lado derecho y el muro pesaba más que la mercancía. Este velo plano
          (nunca un degradado decorativo) lo baja un paso sin tocar el filtro
          compartido de `.mosaico-pieza`. En móvil no hace falta: ahí el velo del
          hero ya cierra parejo al 86-94%. */}
      <span className="absolute inset-0 hidden bg-grafito-hondo/40 md:block" />
    </div>
  );
}
