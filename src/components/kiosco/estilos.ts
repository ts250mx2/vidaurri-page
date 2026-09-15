// Clases compartidas por las pantallas del kiosco y del área de clientes.
// Todo es MÁS GRANDE que en el mostrador a propósito: quien teclea aquí es un
// cliente que nunca ha visto esta pantalla, de pie frente a la PC del
// mostrador o con el celular en la mano. Móvil primero: en un teléfono de 390
// px los campos miden 56 px y el tipo 18 px; en pantalla grande (el kiosco a
// 1366×768, o el cliente en su PC) suben a 64 y 20. El ámbar se reserva —como
// en todo el sitio— a la única acción que convierte: agregar y enviar.

/** Campo de captura: alto, con tipo grande de verdad (≥16 px siempre). */
export const CLASE_CAMPO_KIOSCO =
  "h-14 w-full rounded-lg border-2 border-linea bg-hoja px-4 text-lg text-tinta outline-none transition-colors duration-150 placeholder:text-tinta-suave focus:border-tinta disabled:opacity-60 sm:h-16 sm:text-xl";

/** La acción que convierte: una sola por pantalla. */
export const CLASE_BOTON_AMBAR_KIOSCO =
  "rotulo-tecnico inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-ambar px-5 text-base text-plano-hondo transition-colors duration-150 hover:bg-ambar-press active:bg-ambar-press disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:px-6 sm:text-lg";

/** Acción de peso pero no principal (agregar una pieza, preguntarle a Vico). */
export const CLASE_BOTON_PLANO_KIOSCO =
  "rotulo-tecnico inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-plano px-4 text-sm text-white transition-colors duration-150 hover:bg-plano-claro disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:px-5 sm:text-base";

/** Acción neutra de contorno (volver, cerrar, vaciar). */
export const CLASE_BOTON_NEUTRO_KIOSCO =
  "rotulo-tecnico inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-linea-fuerte bg-hoja px-4 text-sm text-tinta transition-colors duration-150 hover:border-tinta disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:px-5 sm:text-base";

export const CLASE_ETIQUETA_KIOSCO = "rotulo-tecnico text-sm text-tinta-suave";

export const CLASE_ERROR_KIOSCO =
  "rounded-lg border-2 border-anotacion bg-hoja px-4 py-3 text-base font-semibold text-anotacion";

/** Tecla dibujada: el kiosco enseña sus atajos, no los esconde. */
export const CLASE_TECLA =
  "inline-flex min-w-7 items-center justify-center rounded border border-linea-fuerte bg-papel px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-4 text-tinta-suave";
