// Tipos públicos del módulo de pedidos, copiados TAL CUAL de vidaurri-ia
// (`src/lib/pedidos.ts`, `src/lib/articulos-pedido.ts` y
// `src/lib/clientes-descuento.ts`). PAGE no tiene base de pedidos: estos tipos
// describen el JSON que devuelve `${VENDEDOR_IA_URL}/api/mostrador/*`. Si el
// contrato cambia, cambia primero IA y después se vuelve a copiar aquí; nunca
// se "mejoran" por separado, o la pantalla pinta algo que IA no manda.

export type EstatusPedido =
  | "borrador"
  | "enviado"
  | "confirmado"
  | "listo"
  | "entregado"
  | "cancelado";
/** `kiosco` = el propio cliente lo armó en la PC del piso de venta (contrato kiosco). */
export type CanalPedido = "mostrador" | "whatsapp" | "web" | "kiosco";
export type SucursalEntrega = "matriz" | "fierro";
export type OrigenPartida = "nueva" | "usada" | "sobre_pedido";
export type EstatusPartida = "pendiente" | "confirmada" | "sin_existencia" | "sobre_pedido";
export type PerfilPos = "Administrador" | "Operaciones" | "Ventas";

export const SUCURSALES_ENTREGA: ReadonlyArray<{ clave: SucursalEntrega; nombre: string }> = [
  // Las claves se quedan (matriz / fierro: así están en la base y en el POS);
  // los nombres son como el mostrador habla de ellas en los pedidos.
  { clave: "matriz", nombre: "Mostrador" },
  { clave: "fierro", nombre: "Ruta" },
];

export interface PartidaPedido {
  id: number;
  /** Renglón 1..n dentro del pedido. */
  partida: number;
  origen: OrigenPartida;
  /** articulos.codigo de bdav (nueva / sobre_pedido); null en usadas. */
  codigo: string | null;
  /** piezas.id_pieza de la Bodega Usado (usada); null en nuevas. */
  idPiezaUsada: number | null;
  descripcion: string;
  cantidad: number;
  /** IVA incluido, ya con el descuento del cliente. */
  precioUnitario: number;
  /** cantidad * precioUnitario. */
  importe: number;
  existenciaAlPedir: number | null;
  estatusPartida: EstatusPartida;
  /** Solo sobre_pedido: días que promete el mostrador. */
  diasEntrega: number | null;
  /**
   * Piezas que van a la back order de Aldo cuando el sistema marcó el renglón
   * por faltante (pidieron 3, había 1, van 2); null cuando va la cantidad
   * completa, que es lo que pasa si lo marcó el mostrador a mano. Opcional
   * porque el motor puede ser anterior a ese campo.
   */
  cantidadAldo?: number | null;
  nota: string | null;
  /**
   * Foto del renglón: en nuevas el archivo del S3 (para `urlFotoNueva`), en
   * usadas el `nombre_imagen` de la Bodega (para `urlFotoUsada`). null = sin
   * foto o la base no contestó. Opcional porque el motor puede ser anterior.
   */
  foto?: string | null;
}

export interface EventoPedido {
  id: number;
  evento: string;
  estatusAnterior: EstatusPedido | null;
  estatusNuevo: EstatusPedido | null;
  detalle: string | null;
  /** Usuario del POS o "cliente". */
  usuario: string | null;
  canal: CanalPedido;
  creadoEn: string;
}

export interface PedidoResumen {
  id: number;
  /** 'P-000131'; null mientras es borrador. */
  folio: string | null;
  estatus: EstatusPedido;
  canal: CanalPedido;
  /** clientes_descuento.id; null = público general. */
  idCliente: number | null;
  /** clientes.id en bdav (el ID que ve el POS) si el cliente del padrón está ligado; null si no. */
  idClienteBdav: number | null;
  /** Nombre del cliente al momento del pedido (snapshot). */
  cliente: string;
  telefono: string | null;
  descuentoPct: number;
  sucursal: SucursalEntrega;
  capturadoPor: string | null;
  atendidoPor: string | null;
  subtotal: number;
  iva: number;
  /** IVA incluido; suma de importes. */
  total: number;
  /** Conteo de renglones (en el detalle `partidas` es el arreglo). */
  numPartidas: number;
  creadoEn: string;
  enviadoEn: string | null;
  confirmadoEn: string | null;
  listoEn: string | null;
  entregadoEn: string | null;
  canceladoEn: string | null;
  actualizadoEn: string;
  /**
   * Cotización espejo en el POS (bdav.cotiza), la levanta IA al confirmar el
   * pedido (contrato B4/B5; antes era al marcarlo listo). Cada edición de un
   * pedido confirmado la reemite con otro número. Opcionales mientras IA
   * termina de mandarlas: si faltan, la pantalla no pinta la sección, no la
   * rompe.
   */
  numCotizaPos?: number | null;
  /** pendiente | simulada | insertada | omitida | error | cancelada */
  cotizaPosEstado?: string;
  /** Texto del último fallo (≤200) cuando `cotizaPosEstado` es "error". */
  cotizaPosError?: string | null;
  /**
   * Back order a Aldo Autopartes en el POS (bdav.back_order): la levanta IA
   * al confirmar el pedido con partidas sobre pedido (contrato backorder).
   * Opcionales por la misma razón que las de cotización.
   */
  numBkoPos?: number | null;
  /** pendiente | simulada | insertada | omitida | error | cancelada */
  bkoPosEstado?: string;
  /** En "error", el último fallo (≤200); en "simulada", el resumen de lo que se habría escrito. */
  bkoPosError?: string | null;
  /** 'MARTES' | 'VIERNES': el día en que Aldo entrega. */
  bkoPosCompromiso?: string | null;
  /**
   * Domicilio del cliente, si lo dio al enviar (calle y número, colonia, CP,
   * municipio, estado). Opcional mientras IA termina de mandarlo.
   */
  domicilio?: Domicilio | null;
}

/** Copia de `Domicilio` de IA; la versión con validación vive en `@/lib/domicilio`. */
export interface Domicilio {
  calle: string;
  colonia: string;
  cp: string;
  municipio: string;
  estado: string;
  /** Teléfono de contacto en ese domicilio (10 dígitos); null si no lo dieron. */
  telefono: string | null;
}

export interface PedidoDetalle extends PedidoResumen {
  observaciones: string | null;
  /** Folio de la venta en el POS al entregar (referencia, solo lectura). */
  folioVentaPos: string | null;
  motivoCancelacion: string | null;
  partidas: PartidaPedido[];
  eventos: EventoPedido[];
}

export interface FiltrosPedidos {
  estatus?: EstatusPedido;
  sucursal?: SucursalEntrega;
  canal?: CanalPedido;
  /** Usuario del POS que capturó o atendió. */
  usuario?: string;
  /** 'AAAA-MM-DD' (fecha de creación, horario de Monterrey). */
  desde?: string;
  hasta?: string;
  /** Folio, nombre del cliente o teléfono. */
  busqueda?: string;
  /**
   * `"si"` = solo pedidos con back order a Aldo (con número en el POS o con
   * intento registrado: insertada, simulada o error). Cualquier otro valor lo
   * ignora IA. Es lo que consulta la pantalla /mostrador/backorders.
   */
  backorder?: "si";
  pagina: number;
  porPagina: number;
}

export interface PaginaPedidos {
  pedidos: PedidoResumen[];
  total: number;
  porEstatus: Record<EstatusPedido, number>;
}

/** Renglón de la hoja de surtido (`GET /api/mostrador/pedidos/[id]/surtido`, contrato §6). */
export interface RenglonSurtido {
  partida: number;
  origen: OrigenPartida;
  codigo: string | null;
  idPiezaUsada: number | null;
  descripcion: string;
  cantidad: number;
  estatusPartida: EstatusPartida;
  /** Existencia releída de bdav/usadas al generar la hoja, no la de la captura; null si la base no respondió. */
  existenciaActual: number | null;
  /** `modulo / casillero` de la Bodega Usado; null en nuevas (bdav no tiene localización útil). */
  ubicacionUsada: string | null;
}

export interface HojaSurtido {
  pedido: PedidoDetalle;
  renglones: RenglonSurtido[];
  sucursal: { clave: SucursalEntrega; nombre: string };
  /** Hay que mover mercancía a la sucursal donde recoge el cliente. */
  trasladar: boolean;
  generadoEn: string;
}

/** Renglón de la hoja de back order (`GET /api/mostrador/pedidos/[id]/backorder`, contrato backorder). */
export interface RenglonBackorderHoja {
  partida: number;
  codigo: string;
  descripcion: string;
  /** Piezas que van a Aldo: el renglón completo, o solo el faltante de lo que no hay en tienda. */
  cantidad: number;
  /**
   * Piezas que pidió el cliente en ese renglón. Cuando es mayor que
   * `cantidad`, la hoja lo dice ("2 de 3"): el resto ya está en tienda.
   * Opcional mientras IA termina de mandarlo (contrato back order
   * automática); sin él la hoja pinta solo la cantidad que va a Aldo.
   */
  cantidadPedida?: number;
  /** Como lo guarda el POS en detalle_bko: sin IVA, ya con el descuento del cliente. */
  precioSinIva: number;
  importeSinIva: number;
  diasEntrega: number | null;
}

export interface HojaBackorder {
  pedido: PedidoDetalle;
  backorder: {
    numBko: number | null;
    /** pendiente | simulada | insertada | omitida | error | cancelada */
    estado: string;
    /** En "error", el fallo; en "simulada", el resumen de lo que se habría escrito. */
    error: string | null;
    /** 'AAAA-MM-DD'; null mientras no se ha levantado en el POS. */
    fechaBko: string | null;
    /** 'MARTES' | 'VIERNES'. */
    fechaCompromiso: string | null;
    /** Nombre del vendedor del POS (POLENDO / ECHAVARRI / JR) que pidió o pediría; null si bdav no respondió. */
    vendedor: string | null;
    idVendedor: number | null;
  };
  /** bdav.proveedores id 1 (Aldo, solo lectura); null si bdav no respondió. */
  proveedor: { nombre: string; direccion: string; ciudad: string; telefono: string } | null;
  /** Partidas sobre pedido del pedido, aunque todavía no haya back order en el POS. */
  renglones: RenglonBackorderHoja[];
  /** Subtotal sin IVA; el IVA aparte; el total lo incluye. */
  totales: { subtotal: number; iva: number; total: number };
  generadoEn: string;
}

/** Artículo de bdav como lo cotiza el mostrador (precio ya con el descuento del cliente). */
export interface ArticuloParaPedido {
  codigo: string;
  descripcion: string;
  existencia: number;
  precioConIva: number;
  precioSinIva: number;
  marca: string;
  tipoParte: string;
  /**
   * Nombre de archivo de la foto en el S3 (`imagen` capturada o el código),
   * para `urlFotoNueva`. Opcional mientras IA termina de mandarlo: sin él el
   * buscador pinta la casilla "foto por tomar", no se rompe.
   */
  foto?: string;
}

/** Cliente del padrón de descuentos, solo los campos que el mostrador necesita. */
export interface ClienteDescuento {
  id: number;
  cliente: string;
  /** Celular principal: el primero de `telefonos`, o null si no tiene ninguno. */
  telefono: string | null;
  /** Celulares con los que el Vendedor IA reconoce al cliente (solo dígitos). */
  telefonos: string[];
  /** Porcentaje 0-100. */
  descuento: number;
  rfc: string | null;
  email: string | null;
  /** El cliente puede levantar pedidos por su cuenta (WhatsApp / web). */
  permitirPedido: boolean;
}

/**
 * Pieza que las herramientas de Vico consultaron EN ESE TURNO
 * (`POST /api/mostrador/vico` → `productos`, máximo 8), con el precio que
 * Vico vio: ya con el descuento del cliente del turno. Es lo que la pantalla
 * convierte en el botón "Agregar al pedido" sin volver a buscar. Primero van
 * las que Vico mencionó en su texto, después el resto de las consultadas.
 */
export interface ProductoMencionado {
  origen: "nueva" | "usada";
  /** articulos.codigo (nueva) o piezas.codigo (usada). */
  codigo: string;
  /** piezas.id_pieza de la Bodega Usado; null en nuevas. */
  idPiezaUsada: number | null;
  descripcion: string;
  /** IVA incluido, ya con el descuento del cliente. */
  precioConIva: number;
  /** Nueva: piezas en tienda (entregaInmediata). Usada: existencia de la Bodega. */
  existencia: number;
  /** URL de la foto sellada (la misma del arreglo `fotos` del turno); null si no hay. */
  foto: string | null;
  /**
   * Solo nuevas y solo si IA lo manda: `true` cuando la herramienta la marcó
   * disponible sobre pedido, `false` cuando la consultó y no había. Ausente o
   * null = sin dato: la pantalla deja agregar y el mostrador confirma después.
   */
  sobrePedido?: boolean | null;
}

/** Lo que el navegador manda a `POST /api/mostrador/borrador/partidas`; el precio lo cotiza IA. */
export interface CapturaPartida {
  origen: OrigenPartida;
  codigo: string | null;
  idPiezaUsada: number | null;
  cantidad: number;
}
