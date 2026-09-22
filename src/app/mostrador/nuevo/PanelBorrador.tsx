"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { FormularioDomicilio } from "@/components/domicilio/FormularioDomicilio";
import { FotoAmpliable, VisorPieza } from "@/components/VisorPieza";
import {
  CLASE_BOTON_AMBAR,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/mostrador/estilos";
import { Stepper } from "@/components/mostrador/Stepper";
import { DOMICILIO_VACIO, domicilioVacio, resumenDomicilio, validarDomicilio, type Domicilio } from "@/lib/domicilio";
import { pesos } from "@/lib/formato";
import { urlFotoNueva, urlFotoUsada } from "@/lib/fotos";
import { OBSERVACIONES_MAX } from "@/lib/mostrador/reglas";
import { SUCURSALES_ENTREGA, type PartidaPedido, type PedidoDetalle } from "@/lib/mostrador/tipos";
import type { ResultadoAccion } from "./NuevoPedido";

// Columna "Pedido en captura": la tarjeta del borrador tal como lo tiene IA
// (partidas con su stepper de cantidad, totales con IVA incluido), las
// observaciones, y las dos salidas: enviar (ámbar, la única acción principal
// del panel) o cancelar. Debajo, el buscador manual para agregar piezas sin
// pasar por Vico. La cantidad que pinta cada renglón es la del servidor: el
// stepper pide el cambio y el padre sustituye el borrador con el que IA
// devuelve; las usadas van fijas en 1 (son una unidad física).

interface PropsPanelBorrador {
  borrador: PedidoDetalle | null;
  ocupado: boolean;
  clientePublico: string;
  onCantidad: (idPartida: number, cantidad: number) => ResultadoAccion;
  onQuitar: (idPartida: number) => ResultadoAccion;
  /** `domicilio` ya validado: null si el vendedor no capturó ninguno. */
  onEnviar: (observaciones: string, domicilio: Domicilio | null) => ResultadoAccion;
  onCancelar: () => ResultadoAccion;
}

const CONFIRMAR_CANCELAR = "¿Cancelar el borrador? Se pierden las partidas capturadas.";

/** Renglones que nacen a la vista: su foto va con descarga inmediata (Chromium no dispara la carga diferida sin scroll). */
const A_LA_VISTA = 6;

/** La foto del renglón según de dónde salió la pieza; null si IA no la mandó (la casilla dice "foto por tomar"). */
function urlFotoPartida(p: PartidaPedido): string | null {
  if (!p.foto) return null;
  return p.origen === "usada" ? urlFotoUsada(p.foto) : urlFotoNueva(p.foto);
}

function nombreSucursal(clave: string): string {
  return SUCURSALES_ENTREGA.find((s) => s.clave === clave)?.nombre ?? clave;
}

/** Código de bdav o, en usadas, el ID de la pieza en la Bodega. */
function referenciaDe(p: PartidaPedido): string {
  if (p.codigo) return p.codigo;
  return p.idPiezaUsada !== null ? `Usada #${p.idPiezaUsada}` : "";
}

export function PanelBorrador({
  borrador,
  ocupado,
  clientePublico,
  onCantidad,
  onQuitar,
  onEnviar,
  onCancelar,
}: PropsPanelBorrador) {
  /** El renglón abierto en grande (`VisorPieza`); null = cerrado. */
  const [ampliada, setAmpliada] = useState<PartidaPedido | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [domicilio, setDomicilio] = useState<Domicilio>(DOMICILIO_VACIO);
  /** El bloque del domicilio abierto; se abre solo si ya se tecleó algo. */
  const [conDomicilio, setConDomicilio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [quitando, setQuitando] = useState<number | null>(null);

  const partidas = borrador?.partidas ?? [];
  const hayPartidas = partidas.length > 0;
  const bloqueado = ocupado || trabajando;

  async function correr(accion: () => ResultadoAccion) {
    if (trabajando) return;
    setTrabajando(true);
    setError(null);
    const fallo = await accion();
    setTrabajando(false);
    if (fallo) setError(fallo);
  }

  async function quitar(idPartida: number) {
    setQuitando(idPartida);
    await correr(() => onQuitar(idPartida));
    setQuitando(null);
  }

  function cambiarCantidad(idPartida: number, cantidad: number) {
    void correr(() => onCantidad(idPartida, cantidad));
  }

  function cancelar() {
    if (!window.confirm(CONFIRMAR_CANCELAR)) return;
    void correr(async () => {
      const fallo = await onCancelar();
      if (!fallo) setObservaciones("");
      return fallo;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {ampliada && (
        <VisorPieza
          pieza={{
            foto: urlFotoPartida(ampliada),
            codigo: referenciaDe(ampliada),
            descripcion: ampliada.descripcion,
            precioConIva: ampliada.precioUnitario,
            existencia: ampliada.origen === "usada" ? "Pieza única" : `${ampliada.cantidad} en el pedido`,
          }}
          onCerrar={() => setAmpliada(null)}
        />
      )}
      <div className="lamina flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={CLASE_ETIQUETA}>Pedido en captura</p>
            <p className="mt-1 truncate text-base font-semibold leading-tight text-tinta">
              {borrador?.cliente ?? clientePublico}
            </p>
            <p className="mt-0.5 text-xs text-tinta-suave">
              Recoge en {nombreSucursal(borrador?.sucursal ?? "matriz")}
              {borrador && borrador.descuentoPct > 0 ? ` · ${borrador.descuentoPct}% de descuento` : ""}
            </p>
          </div>
          <span className="sello shrink-0 text-tinta-suave">Borrador</span>
        </div>

        {hayPartidas ? (
          <ul className="flex flex-col divide-y divide-linea border-y border-linea">
            {partidas.map((p, i) => {
              const referencia = referenciaDe(p);
              const esUsada = p.origen === "usada";
              return (
                <li key={p.id} className="flex flex-col gap-2 py-2.5">
                  <div className="flex items-start gap-2">
                    <span className="globo-partida mt-0.5">{p.partida}</span>
                    <FotoAmpliable
                      src={urlFotoPartida(p)}
                      alt={p.descripcion}
                      className="trama-anaquel size-14 rounded-sm border border-linea"
                      imgClassName="p-0.5"
                      prioritaria={i < A_LA_VISTA}
                      onAmpliar={() => setAmpliada(p)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-tinta">{p.descripcion}</p>
                      <p className="num-tab mt-0.5 font-mono text-xs text-tinta-suave">
                        {referencia}
                        {referencia && " · "}
                        {pesos(p.precioUnitario)} c/u IVA incluido
                      </p>
                    </div>
                    <p className="num-tab shrink-0 font-mono text-sm font-semibold text-tinta">{pesos(p.importe)}</p>
                    <button
                      type="button"
                      onClick={() => void quitar(p.id)}
                      disabled={bloqueado}
                      aria-label={`Quitar ${p.descripcion} del pedido`}
                      title="Quitar del pedido"
                      className="flex size-9 shrink-0 items-center justify-center rounded-md text-tinta-suave transition-colors duration-150 hover:bg-papel hover:text-anotacion disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Trash2 aria-hidden className={quitando === p.id ? "size-4 animate-pulse" : "size-4"} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pl-9">
                    {esUsada ? (
                      <span className="sello sello-unica">Pieza única</span>
                    ) : (
                      <Stepper
                        etiqueta={`Cantidad de ${referencia || p.descripcion}`}
                        cantidad={p.cantidad}
                        bloqueado={bloqueado}
                        onCambiar={(cantidad) => cambiarCantidad(p.id, cantidad)}
                      />
                    )}
                    <span className="num-tab font-mono text-xs text-tinta-suave">
                      {p.cantidad} × {pesos(p.precioUnitario)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-md border border-dashed border-linea-fuerte px-3 py-4 text-center text-sm text-tinta-suave">
            Todavía no hay piezas. Búscalas en la columna de al lado o pídeselas a Vico.
          </p>
        )}

        {borrador && (
          <dl className="num-tab grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-sm">
            <dt className="text-tinta-suave">Subtotal</dt>
            <dd className="text-right text-tinta">{pesos(borrador.subtotal)}</dd>
            <dt className="text-tinta-suave">IVA</dt>
            <dd className="text-right text-tinta">{pesos(borrador.iva)}</dd>
            <dt className="rotulo-tecnico self-center text-xs text-tinta">Total IVA incluido</dt>
            <dd className="titulo-lamina text-right text-xl text-tinta">{pesos(borrador.total)}</dd>
          </dl>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className={CLASE_ETIQUETA}>Domicilio del cliente (opcional)</p>
            <button
              type="button"
              onClick={() => setConDomicilio((v) => !v)}
              disabled={bloqueado}
              aria-expanded={conDomicilio}
              className="text-xs font-semibold text-tinta underline underline-offset-4"
            >
              {conDomicilio ? "Ocultar" : domicilioVacio(domicilio) ? "Capturar domicilio" : "Editar"}
            </button>
          </div>
          {/* Colapsado con algo tecleado: se enseña lo que hay, para que no se
              mande un domicilio a medias sin verlo. */}
          {!conDomicilio && !domicilioVacio(domicilio) && (
            <p className="text-xs leading-relaxed text-tinta">{resumenDomicilio(domicilio)}</p>
          )}
          {conDomicilio && (
            <FormularioDomicilio valor={domicilio} onChange={setDomicilio} disabled={bloqueado} estilo="mostrador" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="observaciones-pedido" className={CLASE_ETIQUETA}>
            Observaciones
          </label>
          <textarea
            id="observaciones-pedido"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value.slice(0, OBSERVACIONES_MAX))}
            maxLength={OBSERVACIONES_MAX}
            rows={2}
            placeholder="Ej: lo pasa a recoger el chofer mañana"
            className={`${CLASE_CAMPO} h-auto resize-y py-2 leading-relaxed`}
          />
        </div>

        {error && (
          <p role="alert" className={CLASE_ERROR}>
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              const validado = validarDomicilio(domicilio);
              if (!validado.ok) {
                setError(validado.error);
                return;
              }
              void correr(() => onEnviar(observaciones, validado.domicilio));
            }}
            disabled={bloqueado || !hayPartidas}
            className={CLASE_BOTON_AMBAR}
          >
            {trabajando ? "Un momento…" : "Enviar pedido"}
          </button>
          <p className="text-center text-[11px] text-tinta-suave">
            El mostrador confirma la existencia antes de avisarle al cliente.
          </p>
          <button
            type="button"
            onClick={cancelar}
            disabled={bloqueado || !borrador}
            className={`${CLASE_BOTON_SECUNDARIO} text-anotacion`}
          >
            Cancelar borrador
          </button>
        </div>
      </div>
    </div>
  );
}
