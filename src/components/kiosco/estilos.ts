// Clases compartidas por las pantallas del kiosco. Todo es MÁS GRANDE que en
// el mostrador a propósito: quien teclea aquí es un cliente que nunca ha visto
// esta pantalla, de pie, con la PC a la altura del mostrador y a un metro de
// distancia. Campos de 64 px y tipo de 18-20 px, botones que se aciertan sin
// mirar, y el ámbar reservado —como en todo el sitio— a la única acción que
// convierte: agregar al pedido y enviarlo.

/** Campo de captura del kiosco: alto, con tipo grande de verdad. */
export const CLASE_CAMPO_KIOSCO =
  "h-16 w-full rounded-lg border-2 border-linea bg-hoja px-4 text-xl text-tinta outline-none transition-colors duration-150 placeholder:text-tinta-suave focus:border-tinta disabled:opacity-60";

/** La acción que convierte: una sola por pantalla. */
export const CLASE_BOTON_AMBAR_KIOSCO =
  "rotulo-tecnico inline-flex h-16 items-center justify-center gap-2 rounded-lg bg-ambar px-6 text-lg text-plano-hondo transition-colors duration-150 hover:bg-ambar-press active:bg-ambar-press disabled:cursor-not-allowed disabled:opacity-50";

/** Acción de peso pero no principal (agregar una pieza, preguntarle a Vico). */
export const CLASE_BOTON_PLANO_KIOSCO =
  "rotulo-tecnico inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-plano px-5 text-base text-white transition-colors duration-150 hover:bg-plano-claro disabled:cursor-not-allowed disabled:opacity-50";

/** Acción neutra de contorno (volver, cerrar, vaciar). */
export const CLASE_BOTON_NEUTRO_KIOSCO =
  "rotulo-tecnico inline-flex h-14 items-center justify-center gap-2 rounded-lg border-2 border-linea-fuerte bg-hoja px-5 text-base text-tinta transition-colors duration-150 hover:border-tinta disabled:cursor-not-allowed disabled:opacity-50";

export const CLASE_ETIQUETA_KIOSCO = "rotulo-tecnico text-sm text-tinta-suave";

export const CLASE_ERROR_KIOSCO =
  "rounded-lg border-2 border-anotacion bg-hoja px-4 py-3 text-base font-semibold text-anotacion";

/** Tecla dibujada: el kiosco enseña sus atajos, no los esconde. */
export const CLASE_TECLA =
  "inline-flex min-w-7 items-center justify-center rounded border border-linea-fuerte bg-papel px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-4 text-tinta-suave";
