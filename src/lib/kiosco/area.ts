import {
  RUTA_CLIENTES,
  RUTA_CLIENTES_DATOS,
  RUTA_CLIENTES_LISTO,
  RUTA_CLIENTES_MIS_PEDIDOS,
  RUTA_CLIENTES_PASSWORD,
  RUTA_CLIENTES_PEDIDO,
} from "@/lib/clientes/rutas";
import {
  RUTA_KIOSCO,
  RUTA_KIOSCO_ACTIVAR,
  RUTA_KIOSCO_ENTRAR,
  RUTA_KIOSCO_LISTO,
  RUTA_KIOSCO_MIS_PEDIDOS,
  RUTA_KIOSCO_PEDIDO,
} from "./rutas";

// Las pantallas de armar el pedido, ver los pedidos y entrar son las MISMAS en
// dos áreas: el kiosco (la PC del piso, con teclado, sesión del aparato) y el
// área de clientes (el celular del cliente, con su propia sesión). Lo que
// cambia entre una y otra cabe en este objeto: a qué proxy se le habla, a qué
// pantalla se avanza, a dónde se manda al perder la sesión y si vale la pena
// enseñar atajos de teclado. Los componentes lo leen del contexto
// (`components/kiosco/AreaContext.tsx`) y no saben en cuál de las dos están.
//
// Sin dependencias de Next ni de React: se importa tanto en el navegador como
// en el servidor.

export type Area = "kiosco" | "cliente";

export interface RutasArea {
  /** Armar el pedido: la pantalla de inicio del flujo. */
  armar: string;
  /** El paso 2: datos del cliente (kiosco) o sucursal (clientes). */
  datos: string;
  /** El acuse con el folio. */
  listo: string;
  misPedidos: string;
  /** Pantalla de entrar del área. */
  entrar: string;
  /** Cambio de contraseña; null donde no existe (el kiosco no cambia contraseñas). */
  password: string | null;
}

export interface ConfigArea {
  area: Area;
  /** Prefijo de los proxies de PAGE que atienden a esta área. */
  prefijoApi: string;
  rutas: RutasArea;
  /** Ruta de IA (relativa al prefijo) con la lista de pedidos del cliente. */
  rutaApiPedidos: string;
  /** Ruta de IA (relativa al prefijo) para entrar con celular y contraseña. */
  rutaApiEntrar: string;
  /** A dónde ir cuando el proxy responde 401 SIN `codigo: "cliente"` (se perdió la credencial base). */
  rutaSinSesion: string;
  /** A dónde ir cuando el 401 trae `codigo: "cliente"` (la sesión del cliente ya no vale). */
  rutaSinCliente: string;
  /** PC con teclado: se pintan las teclas (Enter, Esc, F2) y el foco salta solo. */
  conTeclado: boolean;
  /** Título del paso 2 en la tira de pasos. */
  nombrePasoDatos: string;
  /** Lo que dura la sesión del cliente, para decirlo en la pantalla de entrar. */
  duracionSesionTexto: string;
}

export const AREA_KIOSCO: ConfigArea = {
  area: "kiosco",
  prefijoApi: "/api/kiosco",
  rutas: {
    armar: RUTA_KIOSCO,
    datos: RUTA_KIOSCO_PEDIDO,
    listo: RUTA_KIOSCO_LISTO,
    misPedidos: RUTA_KIOSCO_MIS_PEDIDOS,
    entrar: RUTA_KIOSCO_ENTRAR,
    password: null,
  },
  rutaApiPedidos: "/cliente/pedidos",
  rutaApiEntrar: "/cliente/entrar",
  // Un 401 del aparato es "esta PC ya no es un kiosco": a activar. Con código
  // de cliente el aparato sigue vivo y se recarga el inicio como público general.
  rutaSinSesion: RUTA_KIOSCO_ACTIVAR,
  rutaSinCliente: RUTA_KIOSCO,
  conTeclado: true,
  nombrePasoDatos: "Tus datos",
  duracionSesionTexto: "30 minutos o al terminar tu pedido",
};

export const AREA_CLIENTE: ConfigArea = {
  area: "cliente",
  prefijoApi: "/api/clientes",
  rutas: {
    armar: RUTA_CLIENTES_PEDIDO,
    datos: RUTA_CLIENTES_DATOS,
    listo: RUTA_CLIENTES_LISTO,
    misPedidos: RUTA_CLIENTES_MIS_PEDIDOS,
    entrar: RUTA_CLIENTES,
    password: RUTA_CLIENTES_PASSWORD,
  },
  rutaApiPedidos: "/pedidos",
  rutaApiEntrar: "/entrar",
  // En el área de clientes solo hay una credencial, la suya: cualquier 401
  // significa volver a entrar.
  rutaSinSesion: RUTA_CLIENTES,
  rutaSinCliente: RUTA_CLIENTES,
  conTeclado: false,
  nombrePasoDatos: "Sucursal",
  duracionSesionTexto: "12 horas",
};

export function configDeArea(area: Area): ConfigArea {
  return area === "cliente" ? AREA_CLIENTE : AREA_KIOSCO;
}
