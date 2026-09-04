"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { USUARIO_MAX, urlCola, urlSinFiltros, type FiltrosBase } from "@/lib/mostrador/filtros";
import { ETIQUETA_ESTATUS, ORDEN_ESTATUS, esCanalPedido, esEstatusPedido, esSucursal } from "@/lib/mostrador/reglas";
import { ETIQUETA_CANAL } from "@/lib/mostrador/etiquetas";
import { SUCURSALES_ENTREGA, type CanalPedido } from "@/lib/mostrador/tipos";

// Filtros finos de la cola de pedidos (patrón PanelFiltros del catálogo):
// selects nativos y campos que al aplicar navegan a /mostrador con la
// selección en el querystring, para que la página de servidor vuelva a pedir
// la cola a IA. Así la URL es compartible y el botón "atrás" funciona. Vive
// dentro del panel plegable (`PanelFiltros`), que pone la lámina; por eso el
// formulario no lleva fondo propio. La búsqueda por folio/cliente/teléfono NO
// está aquí: es la `BusquedaRapida` siempre visible arriba; este formulario la
// conserva tal cual (igual que el tamaño de página) al aplicar, para que
// afinar por estatus o fechas no borre lo que se estaba buscando. Las fechas
// llegan ya resueltas (las del mes en curso si la URL no traía): se ven y se
// pueden mover. 16px de tipo como mínimo: en iOS un campo más chico hace zoom.

const CLASE_CAMPO =
  "h-12 w-full rounded-md border border-linea bg-papel px-3 text-base text-tinta transition-colors duration-150 hover:border-linea-fuerte focus:border-tinta";

const CLASE_ETIQUETA =
  "mb-1.5 block font-display text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-tinta-suave";

const CANALES: ReadonlyArray<CanalPedido> = ["mostrador", "whatsapp", "web"];

export function FiltrosPedidos({ iniciales, hayFiltrosUrl }: { iniciales: FiltrosBase; hayFiltrosUrl: boolean }) {
  const router = useRouter();
  const [estatus, setEstatus] = useState(iniciales.estatus ?? "");
  const [sucursal, setSucursal] = useState(iniciales.sucursal ?? "");
  const [canal, setCanal] = useState(iniciales.canal ?? "");
  const [usuario, setUsuario] = useState(iniciales.usuario ?? "");
  const [desde, setDesde] = useState(iniciales.desde ?? "");
  const [hasta, setHasta] = useState(iniciales.hasta ?? "");
  // useTransition en vez de un booleano propio: `aplicando` se apaga solo
  // cuando la navegación termina, incluso si los filtros elegidos dan la
  // misma URL y la página no remonta la isla.
  const [aplicando, iniciarNavegacion] = useTransition();

  function aplicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    // Los selects solo pueden traer valores válidos, pero las guardas evitan
    // que un `""` viaje como filtro y mantienen el tipo estrecho sin casts.
    const filtros: FiltrosBase = {
      ...(esEstatusPedido(estatus) ? { estatus } : {}),
      ...(esSucursal(sucursal) ? { sucursal } : {}),
      ...(esCanalPedido(canal) ? { canal } : {}),
      ...(usuario.trim() ? { usuario: usuario.trim() } : {}),
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
      ...(iniciales.busqueda ? { busqueda: iniciales.busqueda } : {}),
      porPagina: iniciales.porPagina,
    };
    iniciarNavegacion(() => {
      router.push(urlCola(filtros));
    });
  }

  // Las fechas no cuentan: llegan rellenas con el mes en curso aunque la URL
  // venga limpia, y "Quitar filtros" no debe salir sin que haya nada que quitar.
  const hayAlgo = hayFiltrosUrl || Boolean(estatus || sucursal || canal || usuario.trim());

  return (
    <form
      aria-label="Filtros de la cola de pedidos"
      onSubmit={aplicar}
      className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
    >
      <label className="block">
        <span className={CLASE_ETIQUETA}>Estatus</span>
        <select value={estatus} onChange={(e) => setEstatus(e.target.value)} className={CLASE_CAMPO}>
          <option value="">Todos</option>
          {ORDEN_ESTATUS.map((e) => (
            <option key={e} value={e}>
              {ETIQUETA_ESTATUS[e]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={CLASE_ETIQUETA}>Sucursal</span>
        <select value={sucursal} onChange={(e) => setSucursal(e.target.value)} className={CLASE_CAMPO}>
          <option value="">Todas</option>
          {SUCURSALES_ENTREGA.map((s) => (
            <option key={s.clave} value={s.clave}>
              {s.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={CLASE_ETIQUETA}>Canal</span>
        <select value={canal} onChange={(e) => setCanal(e.target.value)} className={CLASE_CAMPO}>
          <option value="">Todos</option>
          {CANALES.map((c) => (
            <option key={c} value={c}>
              {ETIQUETA_CANAL[c]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={CLASE_ETIQUETA}>Vendedor</span>
        <input
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Usuario del POS"
          autoCapitalize="none"
          maxLength={USUARIO_MAX}
          className={CLASE_CAMPO}
        />
      </label>

      <label className="block">
        <span className={CLASE_ETIQUETA}>Desde</span>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={CLASE_CAMPO} />
      </label>

      <label className="block">
        <span className={CLASE_ETIQUETA}>Hasta</span>
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={CLASE_CAMPO} />
      </label>

      <div className="col-span-2 flex items-end gap-3 md:col-span-3 xl:col-span-6">
        <button
          type="submit"
          disabled={aplicando}
          className="rotulo-tecnico h-12 rounded-md border border-tinta bg-plano px-5 text-sm text-white transition-colors duration-150 hover:bg-plano-hondo disabled:opacity-60"
        >
          {aplicando ? "Aplicando…" : "Aplicar filtros"}
        </button>
        {hayAlgo && (
          <Link
            href={urlSinFiltros(iniciales)}
            className="inline-flex min-h-11 items-center text-[13px] font-semibold text-tinta-suave underline-offset-4 transition-colors duration-150 hover:text-tinta hover:underline"
          >
            Quitar filtros
          </Link>
        )}
      </div>
    </form>
  );
}
