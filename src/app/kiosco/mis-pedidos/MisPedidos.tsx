"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, PackagePlus } from "lucide-react";
import clsx from "clsx";
import { useArea } from "@/components/kiosco/AreaContext";
import {
  CLASE_BOTON_AMBAR_KIOSCO,
  CLASE_ERROR_KIOSCO,
  CLASE_ETIQUETA_KIOSCO,
} from "@/components/kiosco/estilos";
import { Tecla } from "@/components/kiosco/Tecla";
import { pesos } from "@/lib/formato";
import {
  CLASE_SELLO_ESTATUS_CLIENTE,
  ETIQUETA_ESTATUS_CLIENTE,
  ETIQUETA_ESTATUS_CLIENTE_CORTA,
} from "@/lib/kiosco/estatus";
import { nombreSucursal } from "@/lib/kiosco/identidad";
import { esOk, llamarArea, mensajeFallo, sesionPerdida, STATUS_ABORTADA } from "@/lib/kiosco/navegador";
import { sanearDetalleDeCliente, type DetallePedidoDeCliente, type PedidoDeCliente } from "@/lib/kiosco/tipos";
import { fechaHoraCorta } from "@/lib/mostrador/etiquetas";
import { DetallePedido } from "./DetallePedido";

// Los pedidos del cliente, la misma pantalla en el kiosco y en el área de
// clientes. En pantalla grande: la lista a la izquierda, el detalle a la
// derecha, y donde hay teclado manda el teclado: ↓ ↑ recorren los pedidos (el
// foco real va al botón de cada renglón), el que tiene el foco se abre solo,
// y Escape regresa a armar el pedido. El primero se abre al llegar para que la
// pantalla no arranque con la mitad vacía.
//
// En el celular no caben las dos columnas: se ve la lista, tocar un pedido
// enseña su detalle en el mismo sitio y "Todos mis pedidos" regresa. Los
// estatus se dicen como le importan al cliente ("Listo para recoger"), no
// como los maneja el mostrador; la única acción ámbar es "Armar pedido".

const ERROR_DETALLE = "No pude leer ese pedido; elige otro o inténtalo de nuevo";

export function MisPedidos({
  nombre,
  pedidos,
  errorInicial,
}: {
  nombre: string;
  pedidos: PedidoDeCliente[];
  errorInicial: string | null;
}) {
  const area = useArea();
  const router = useRouter();
  const [folioActivo, setFolioActivo] = useState<string | null>(pedidos[0]?.folio ?? null);
  /** Sube al volver a elegir el mismo folio tras un fallo: reintenta sin cambiar de pedido. */
  const [intento, setIntento] = useState(0);
  const [detalle, setDetalle] = useState<DetallePedidoDeCliente | null>(null);
  const [fallo, setFallo] = useState<{ folio: string; texto: string } | null>(null);
  /** Móvil: `true` mientras se ve el detalle en lugar de la lista. */
  const [enDetalle, setEnDetalle] = useState(false);
  const botonesRef = useRef<Array<HTMLButtonElement | null>>([]);

  // "Cargando" y "error" no son estado: se derivan de qué folio está activo y
  // de cuál trae el detalle (o el fallo) guardado. Así el efecto no toca
  // estado antes de la respuesta y un detalle viejo nunca se pinta bajo un
  // folio nuevo.
  const errorDetalle = fallo?.folio === folioActivo ? fallo.texto : null;
  const cargando = folioActivo !== null && detalle?.folio !== folioActivo && errorDetalle === null;

  // Con teclado, el foco arranca en el primer pedido: desde ahí, las flechas.
  // En el celular no: enfocar un botón que "elige" abriría el detalle solo.
  useEffect(() => {
    if (area.conTeclado) botonesRef.current[0]?.focus();
  }, [area.conTeclado]);

  // Cada pedido elegido se pide al proxy; abortar el anterior evita que una
  // respuesta tardía pise a la del pedido que el cliente está viendo ahora.
  useEffect(() => {
    if (!folioActivo) return;
    const control = new AbortController();
    void (async () => {
      const respuesta = await llamarArea(area, `${area.rutaApiPedidos}/${encodeURIComponent(folioActivo)}`, {
        signal: control.signal,
      });
      if (respuesta.status === STATUS_ABORTADA || control.signal.aborted) return;
      if (sesionPerdida(area, respuesta)) return;
      const leido = esOk(respuesta.datos) ? sanearDetalleDeCliente(respuesta.datos.pedido) : null;
      if (!leido) {
        setFallo({ folio: folioActivo, texto: mensajeFallo(respuesta, ERROR_DETALLE) });
        return;
      }
      setFallo(null);
      setDetalle(leido);
    })();
    return () => control.abort();
  }, [area, folioActivo, intento]);

  function elegir(folio: string) {
    if (folio === folioActivo) {
      // Mismo folio otra vez: solo tiene sentido si falló; se reintenta.
      if (errorDetalle) setIntento((n) => n + 1);
      return;
    }
    setFolioActivo(folio);
  }

  /** Tocar (no enfocar) un pedido: lo elige y, en el celular, pasa al detalle. */
  function abrir(folio: string) {
    elegir(folio);
    setEnDetalle(true);
  }

  function enfocar(indice: number) {
    const boton = botonesRef.current[indice];
    if (!boton) return;
    boton.focus();
    boton.scrollIntoView({ block: "nearest" });
  }

  function alTeclearEnLista(evento: KeyboardEvent<HTMLUListElement>) {
    const indice = botonesRef.current.indexOf(document.activeElement as HTMLButtonElement);
    if (evento.key === "Escape") {
      evento.preventDefault();
      router.push(area.rutas.armar);
      return;
    }
    if (indice < 0) return;
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      enfocar(Math.min(indice + 1, pedidos.length - 1));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      enfocar(Math.max(indice - 1, 0));
    }
  }

  const armarPedido = (
    <button
      type="button"
      onClick={() => router.push(area.rutas.armar)}
      className={`${CLASE_BOTON_AMBAR_KIOSCO} w-full sm:w-auto`}
    >
      <PackagePlus aria-hidden className="size-5" />
      Armar pedido
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className={CLASE_ETIQUETA_KIOSCO}>Mis pedidos</p>
          <h1 className="titulo-lamina mt-1 text-3xl sm:text-4xl">Tus pedidos, {nombre}</h1>
          <p className="mt-2 text-base text-tinta-suave">
            Los últimos que armaste con nosotros. Los precios llevan IVA incluido.
          </p>
        </div>
        {armarPedido}
      </div>

      {errorInicial && (
        <p role="alert" className={CLASE_ERROR_KIOSCO}>
          {errorInicial}
        </p>
      )}

      {pedidos.length === 0 && !errorInicial ? (
        <div className="lamina px-6 py-12 text-center sm:px-8 sm:py-14">
          <p className="titulo-lamina text-2xl text-tinta sm:text-3xl">Todavía no tienes pedidos a tu nombre</p>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-tinta-suave sm:text-lg">
            Los pedidos que armes desde aquí quedan a tu nombre y van apareciendo en esta lista. El
            primero lo puedes armar ahora mismo.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
          <section
            aria-label="Lista de tus pedidos"
            className={clsx("lamina overflow-hidden lg:col-span-5", enDetalle && "hidden lg:block")}
          >
            {area.conTeclado && (
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-linea bg-hoja px-5 py-3 text-xs text-tinta-suave">
                <span>
                  <Tecla>↓</Tecla> <Tecla>↑</Tecla> recorren tus pedidos
                </span>
                <span>
                  <Tecla>Esc</Tecla> vuelve a armar el pedido
                </span>
              </p>
            )}
            <ul
              onKeyDown={alTeclearEnLista}
              className="divide-y divide-linea lg:max-h-[calc(100vh-17rem)] lg:overflow-y-auto"
            >
              {pedidos.map((pedido, i) => {
                const activo = pedido.folio === folioActivo;
                return (
                  <li key={pedido.folio}>
                    <button
                      type="button"
                      ref={(boton) => {
                        botonesRef.current[i] = boton;
                      }}
                      onClick={() => abrir(pedido.folio)}
                      onFocus={() => elegir(pedido.folio)}
                      aria-current={activo ? "true" : undefined}
                      className={clsx(
                        "flex w-full items-center gap-3 border-l-4 px-4 py-3.5 text-left transition-colors duration-150 sm:gap-4",
                        activo ? "border-l-plano bg-papel" : "border-l-transparent hover:bg-papel"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="num-tab font-mono text-lg font-bold text-tinta">{pedido.folio}</p>
                        <p className="mt-0.5 text-sm text-tinta-suave">
                          {fechaHoraCorta(pedido.enviadoEn ?? pedido.creadoEn) || "Sin fecha"}
                          {pedido.sucursal && ` · ${nombreSucursal(pedido.sucursal)}`}
                          {` · ${pedido.piezas} ${pedido.piezas === 1 ? "pieza" : "piezas"}`}
                        </p>
                        <span
                          className={clsx(CLASE_SELLO_ESTATUS_CLIENTE[pedido.estatus], "mt-2")}
                          title={ETIQUETA_ESTATUS_CLIENTE[pedido.estatus]}
                        >
                          {ETIQUETA_ESTATUS_CLIENTE_CORTA[pedido.estatus]}
                        </span>
                      </div>
                      <p className="num-tab shrink-0 font-mono text-lg font-semibold text-tinta">
                        {pesos(pedido.total)}
                      </p>
                      <ChevronRight aria-hidden className="size-5 shrink-0 text-tinta-suave lg:hidden" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            aria-label="Detalle del pedido"
            aria-live="polite"
            className={clsx("lg:col-span-7", !enDetalle && "hidden lg:block")}
          >
            <DetallePedido
              folio={folioActivo}
              detalle={detalle}
              cargando={cargando}
              error={errorDetalle}
              onVolver={() => setEnDetalle(false)}
            />
          </section>
        </div>
      )}
    </div>
  );
}
