// Clases compartidas por las pantallas del mostrador, para que campos y
// botones se vean igual en el chat, el selector de cliente y el borrador sin
// copiar la misma tira de utilidades en cada archivo. Ámbar SOLO en la acción
// principal del panel (Enviar pedido); todo lo demás, incluidos los "Agregar"
// del buscador manual, va en tinta y plano.

/** Campo de texto/select: ≥16px (text-base) para que el móvil no haga zoom. */
export const CLASE_CAMPO =
  "h-11 w-full rounded-md border border-linea bg-hoja px-3 text-base text-tinta outline-none transition-colors duration-150 placeholder:text-tinta-suave focus:border-tinta disabled:opacity-60";

export const CLASE_ETIQUETA = "rotulo-tecnico text-xs text-tinta-suave";

/** La acción que convierte: solo una por panel. */
export const CLASE_BOTON_AMBAR =
  "rotulo-tecnico inline-flex h-11 items-center justify-center rounded-md bg-ambar px-4 text-sm text-plano-hondo transition-colors duration-150 hover:bg-ambar-press active:bg-ambar-press disabled:cursor-not-allowed disabled:opacity-60";

/** Acción de peso pero no principal (elegir, seguir, enviar mensaje). */
export const CLASE_BOTON_PLANO =
  "rotulo-tecnico inline-flex h-10 items-center justify-center rounded-md bg-plano px-3 text-xs text-white transition-colors duration-150 hover:bg-plano-claro disabled:cursor-not-allowed disabled:opacity-60";

/** Acción neutra de contorno (cancelar, cerrar, alternar). */
export const CLASE_BOTON_SECUNDARIO =
  "rotulo-tecnico inline-flex h-10 items-center justify-center rounded-md border border-linea-fuerte bg-hoja px-3 text-xs text-tinta transition-colors duration-150 hover:border-tinta disabled:cursor-not-allowed disabled:opacity-60";

/** Acción que deshace (quitar una pieza): contorno rojo de anotación que se llena al pasar. */
export const CLASE_BOTON_PELIGRO =
  "rotulo-tecnico inline-flex h-10 items-center justify-center rounded-md border border-anotacion bg-hoja px-3 text-xs text-anotacion transition-colors duration-150 hover:bg-anotacion hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

export const CLASE_ERROR = "text-sm font-medium text-anotacion";
