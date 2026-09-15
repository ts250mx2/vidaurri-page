import { reenviarAIa, type RespuestaKiosco } from "@/lib/kiosco/api";
import type { MetodoHttp } from "@/lib/mostrador/api";

// Puente de vidaurri-page hacia `${VENDEDOR_IA_URL}/api/clientes/*`: el
// cliente registrado en su propio dispositivo. La identidad viaja en
// `X-Cliente: <idCliente>` (sacado de la cookie `cliente_sesion`, que IA no
// ve y por eso revalida el id en el padrón en cada llamada). Sin aparato, sin
// sucursal fija y sin Bearer de vendedor: IA cotiza siempre con el descuento
// del cliente y el borrador es el mismo que usa por WhatsApp (`c:<telefono>`).

const PREFIJO_CLIENTES = "/api/clientes";
/** Cabecera del guardia `exigirCliente` de IA. */
export const HEADER_CLIENTE = "X-Cliente";
/** IP del navegador del cliente para el tope de intentos de entrar; solo con proxy de confianza. */
export const HEADER_CLIENTE_IP = "x-cliente-ip";

export const AREA_LOG_CLIENTES = "clientes";

export interface OpcionesReenvioClientes {
  metodo?: MetodoHttp;
  /** Se serializa como JSON; omítelo en GET/DELETE sin cuerpo. */
  cuerpo?: unknown;
  /** id del cliente de la cookie; null solo en `entrar`, que es donde se consigue. */
  cliente: number | null;
  /** IP para el tope de intentos de `entrar`; null si no hay proxy de confianza. */
  ip?: string | null;
  /** Tope de espera; por defecto 60 s. Solo Vico (que piensa y consulta) necesita más. */
  tiempoMaximoMs?: number;
}

/** Reenvía al API de clientes de IA con la cabecera `X-Cliente` (y la IP en entrar). */
export async function reenviarAClientes(
  ruta: string,
  init: OpcionesReenvioClientes
): Promise<RespuestaKiosco> {
  const cabeceras: Record<string, string> = {};
  if (init.cliente) cabeceras[HEADER_CLIENTE] = String(init.cliente);
  if (init.ip) cabeceras[HEADER_CLIENTE_IP] = init.ip;
  return reenviarAIa(PREFIJO_CLIENTES, ruta, {
    metodo: init.metodo,
    cuerpo: init.cuerpo,
    cabeceras,
    tiempoMaximoMs: init.tiempoMaximoMs,
    area: AREA_LOG_CLIENTES,
  });
}
