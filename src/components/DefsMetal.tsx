// Definición del metal de la casa, una sola vez en el documento. Los iconos con
// la clase `.icono-metal` toman este degradado en su trazo, así que un glifo de
// lucide sale troquelado en latón —canto iluminado arriba, base en sombra— en
// lugar de pintado de un amarillo plano.
//
// Va en el layout, no en cada sección: un `<defs>` por tarjeta multiplicaría el
// mismo nodo decenas de veces en la página.

export function DefsMetal() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute" focusable="false">
      <defs>
        <linearGradient id="metal-vidaurri" x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor="#fdf3c8" />
          <stop offset="0.3" stopColor="#f0d97d" />
          <stop offset="0.62" stopColor="#d4af37" />
          <stop offset="1" stopColor="#8a6d1c" />
        </linearGradient>
      </defs>
    </svg>
  );
}
