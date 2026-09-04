"use client";

import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { BuscadorArticulos } from "@/components/mostrador/BuscadorArticulos";
import {
  CLASE_BOTON_PELIGRO,
  CLASE_BOTON_PLANO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
} from "@/components/mostrador/estilos";
import { Stepper } from "@/components/mostrador/Stepper";
import { pesos } from "@/lib/formato";
import { CLASE_SELLO_PARTIDA, ETIQUETA_ESTATUS_PARTIDA, ETIQUETA_ORIGEN } from "@/lib/mostrador/etiquetas";
import {
  esOk,
  llamarProxy,
  mensajeFallo,
  sesionVencida,
  type MetodoNavegador,
} from "@/lib/mostrador/navegador";
import { esSucursal, OBSERVACIONES_MAX } from "@/lib/mostrador/reglas";
import { SUCURSALES_ENTREGA, type PartidaPedido, type SucursalEntrega } from "@/lib/mostrador/tipos";
import { CLASE_TD_PARTIDA, CLASE_TH_PARTIDA, referenciaPartida } from "./TablaPartidas";

// Edición del pedido desde el detalle mientras el mostrador no lo ha surtido
// (`puedeEditarPedido`: borrador, enviado, confirmado). Tres islas, cada una
// con su propio guardado: las partidas (stepper de cantidad y "Quitar" por
// renglón, "Agregar pieza" debajo), la sucursal donde recoge y las
// observaciones. Cada acción pega al proxy `/pedidos/[id]/…` y, si IA la
// aceptó, vuelve a pedir la página al servidor: totales, sello de estatus de
// cada partida y bitácora los repinta él; aquí solo se guarda lo mínimo para
// que la pantalla no brinque mientras tanto. Un 401 a media edición no se
// pinta como error: `sesionVencida` cierra sesión y manda a login con vuelta
// a este pedido. Nada va en ámbar: el ámbar del detalle es de "Confirmar
// pedido" (AccionesPedido).

type Estado = { fase: "guardando" } | { fase: "guardado" } | { fase: "error"; texto: string };

/** Lo que dura el "Guardado ✓" antes de apagarse. */
const MOSTRAR_GUARDADO_MS = 2000;
const TEXTO_GUARDANDO = "Guardando…";
const TEXTO_GUARDADO = "Guardado ✓";
const TEXTO_PIEZA_UNICA = "Pieza única";
const ERROR_CANTIDAD = "No fue posible cambiar la cantidad";
const ERROR_QUITAR = "No fue posible quitar la pieza";
const ERROR_AGREGAR = "No fue posible agregar la pieza";
const ERROR_SUCURSAL = "No fue posible cambiar la sucursal";
const ERROR_OBSERVACIONES = "No fue posible guardar las observaciones";
const AVISO_CONFIRMADO =
  "Al cambiar o agregar piezas, esas partidas vuelven a quedar pendientes de confirmar.";
const AYUDA_BUSCADOR = "Por código o descripción; el precio sale con el descuento actual del cliente.";
/** Llave de estado de las islas que solo guardan una cosa (sucursal, observaciones). */
const CLAVE_UNICA = "unica";

function sinClave<T>(mapa: Record<string, T>, clave: string): Record<string, T> {
  return Object.fromEntries(Object.entries(mapa).filter(([k]) => k !== clave));
}

/**
 * Manda un cambio al proxy `/pedidos/[id]…` y, si IA lo aceptó, refresca la
 * página dentro de una transición: `refrescando` bloquea los controles hasta
 * que el servidor repinta. Devuelve el texto del error para el vendedor, o
 * null si se guardó (también null tras un 401: ya se está saliendo a login).
 */
function useGuardarPedido(idPedido: number) {
  const router = useRouter();
  const [refrescando, iniciarTransicion] = useTransition();

  async function guardar(
    ruta: string,
    metodo: MetodoNavegador,
    cuerpo: unknown,
    porDefecto: string
  ): Promise<string | null> {
    const respuesta = await llamarProxy(`/pedidos/${idPedido}${ruta}`, { metodo, cuerpo });
    if (sesionVencida(respuesta.status)) return null;
    if (!esOk(respuesta.datos)) return mensajeFallo(respuesta, porDefecto);
    iniciarTransicion(() => router.refresh());
    return null;
  }

  return { guardar, refrescando };
}

/** Estado por llave: "Guardando…", "Guardado ✓" (se apaga solo a los 2 s) o el error. */
function useEstados() {
  const [estados, setEstados] = useState<Record<string, Estado>>({});
  const temporizadores = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  function poner(clave: string, estado: Estado | null) {
    setEstados((previos) =>
      estado ? { ...sinClave(previos, clave), [clave]: estado } : sinClave(previos, clave)
    );
  }

  function marcarGuardado(clave: string) {
    poner(clave, { fase: "guardado" });
    const temporizador = setTimeout(() => {
      temporizadores.current.delete(temporizador);
      // Solo apaga el "Guardado ✓": si mientras tanto hubo otra acción, se respeta.
      setEstados((previos) => (previos[clave]?.fase === "guardado" ? sinClave(previos, clave) : previos));
    }, MOSTRAR_GUARDADO_MS);
    temporizadores.current.add(temporizador);
  }

  const hayGuardando = Object.values(estados).some((e) => e.fase === "guardando");
  return { estados, poner, marcarGuardado, hayGuardando };
}

function TextoEstado({ estado, className }: { estado: Estado | undefined; className?: string }) {
  if (!estado) return null;
  if (estado.fase === "error") {
    return (
      <p role="alert" className={clsx(CLASE_ERROR, "text-xs", className)}>
        {estado.texto}
      </p>
    );
  }
  const guardado = estado.fase === "guardado";
  return (
    <p
      role="status"
      className={clsx("text-xs font-medium", guardado ? "text-existencia" : "text-tinta-suave", className)}
    >
      {guardado ? TEXTO_GUARDADO : TEXTO_GUARDANDO}
    </p>
  );
}

interface PropsEdicionPartidas {
  idPedido: number;
  idCliente: number | null;
  /** En confirmado, tocar o agregar una partida la deja pendiente: se avisa arriba. */
  confirmado: boolean;
  partidas: PartidaPedido[];
}

export function EdicionPartidas({ idPedido, idCliente, confirmado, partidas }: PropsEdicionPartidas) {
  const { guardar, refrescando } = useGuardarPedido(idPedido);
  const { estados, poner, marcarGuardado, hayGuardando } = useEstados();
  // Cantidad recién guardada por partida, para que el renglón no brinque al
  // valor viejo mientras el servidor repinta. Tras el refresco coincide con la
  // del servidor (nadie más cambia cantidades desde esta pantalla) y solo se
  // revierte cuando IA rechazó el cambio.
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [porQuitar, setPorQuitar] = useState<number | null>(null);
  const bloqueado = hayGuardando || refrescando;

  async function cambiarCantidad(partida: PartidaPedido, cantidad: number) {
    const clave = String(partida.id);
    setCantidades((previas) => ({ ...previas, [clave]: cantidad }));
    poner(clave, { fase: "guardando" });
    const fallo = await guardar(`/partidas/${partida.id}`, "PATCH", { cantidad }, ERROR_CANTIDAD);
    if (fallo) {
      setCantidades((previas) => sinClave(previas, clave));
      poner(clave, { fase: "error", texto: fallo });
      return;
    }
    marcarGuardado(clave);
  }

  async function quitar(partida: PartidaPedido) {
    const clave = String(partida.id);
    setPorQuitar(null);
    poner(clave, { fase: "guardando" });
    const fallo = await guardar(`/partidas/${partida.id}`, "DELETE", undefined, ERROR_QUITAR);
    if (fallo) {
      poner(clave, { fase: "error", texto: fallo });
      return;
    }
    // El renglón desaparece cuando el servidor repinta; no queda nada que marcar.
    poner(clave, null);
  }

  async function agregar(codigo: string, cantidad: number): Promise<string | null> {
    // Llave propia para que el "guardando" bloquee los steppers mientras tanto.
    poner("agregar", { fase: "guardando" });
    const fallo = await guardar(
      "/partidas",
      "POST",
      { origen: "nueva", codigo, idPiezaUsada: null, cantidad },
      ERROR_AGREGAR
    );
    poner("agregar", null);
    // El buscador pinta su propio "Agregado ✓" o el error.
    return fallo;
  }

  return (
    <div className="flex flex-col gap-4">
      {confirmado && (
        <p role="note" className="rounded-md border border-linea bg-papel px-4 py-3 text-sm text-tinta">
          {AVISO_CONFIRMADO}
        </p>
      )}

      {partidas.length === 0 ? (
        <div className="lamina px-5 py-8 text-center text-sm text-tinta-suave">
          Este pedido no tiene partidas; agrega una aquí abajo.
        </div>
      ) : (
        <div className="lamina overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse">
            <thead className="bg-papel">
              <tr>
                <th scope="col" className={CLASE_TH_PARTIDA}>#</th>
                <th scope="col" className={CLASE_TH_PARTIDA}>Origen</th>
                <th scope="col" className={CLASE_TH_PARTIDA}>Código</th>
                <th scope="col" className={CLASE_TH_PARTIDA}>Descripción</th>
                <th scope="col" className={CLASE_TH_PARTIDA}>Cant.</th>
                <th scope="col" className={clsx(CLASE_TH_PARTIDA, "text-right")}>Precio (IVA incluido)</th>
                <th scope="col" className={clsx(CLASE_TH_PARTIDA, "text-right")}>Importe (IVA incluido)</th>
                <th scope="col" className={CLASE_TH_PARTIDA}>Existencia</th>
                <th scope="col" className={CLASE_TH_PARTIDA}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {partidas.map((partida) => {
                const clave = String(partida.id);
                const referencia = referenciaPartida(partida);
                const esUsada = partida.origen === "usada";
                const preguntando = porQuitar === partida.id;
                return (
                  <tr key={partida.id} className="border-t border-linea">
                    <td className={clsx(CLASE_TD_PARTIDA, "num-tab font-mono text-sm text-tinta-suave")}>
                      {partida.partida}
                    </td>
                    <td className={clsx(CLASE_TD_PARTIDA, "whitespace-nowrap text-sm")}>
                      {ETIQUETA_ORIGEN[partida.origen]}
                    </td>
                    <td className={clsx(CLASE_TD_PARTIDA, "num-tab whitespace-nowrap font-mono text-sm font-semibold")}>
                      {referencia}
                    </td>
                    <td className={clsx(CLASE_TD_PARTIDA, "min-w-56 text-sm")}>
                      {partida.descripcion}
                      {partida.nota && <p className="mt-1 text-xs text-tinta-suave">Nota: {partida.nota}</p>}
                    </td>
                    <td className={CLASE_TD_PARTIDA}>
                      {esUsada ? (
                        <span className="sello sello-unica">{TEXTO_PIEZA_UNICA}</span>
                      ) : (
                        <Stepper
                          etiqueta={`Cantidad de ${referencia}`}
                          cantidad={cantidades[clave] ?? partida.cantidad}
                          bloqueado={bloqueado}
                          onCambiar={(cantidad) => void cambiarCantidad(partida, cantidad)}
                        />
                      )}
                    </td>
                    <td className={clsx(CLASE_TD_PARTIDA, "num-tab whitespace-nowrap text-right font-mono text-sm")}>
                      {pesos(partida.precioUnitario)}
                    </td>
                    <td
                      className={clsx(
                        CLASE_TD_PARTIDA,
                        "num-tab whitespace-nowrap text-right font-mono text-sm font-semibold"
                      )}
                    >
                      {pesos(partida.importe)}
                    </td>
                    <td className={clsx(CLASE_TD_PARTIDA, "whitespace-nowrap")}>
                      <span className={CLASE_SELLO_PARTIDA[partida.estatusPartida]}>
                        {ETIQUETA_ESTATUS_PARTIDA[partida.estatusPartida]}
                        {partida.estatusPartida === "sobre_pedido" &&
                          partida.diasEntrega !== null &&
                          ` · ${partida.diasEntrega} d`}
                      </span>
                    </td>
                    <td className={clsx(CLASE_TD_PARTIDA, "min-w-64")}>
                      {preguntando ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-tinta">¿Quitar esta pieza?</span>
                          <button
                            type="button"
                            onClick={() => void quitar(partida)}
                            disabled={bloqueado}
                            className={CLASE_BOTON_PELIGRO}
                          >
                            Sí, quitar
                          </button>
                          <button type="button" onClick={() => setPorQuitar(null)} className={CLASE_BOTON_SECUNDARIO}>
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPorQuitar(partida.id)}
                          disabled={bloqueado}
                          className={CLASE_BOTON_SECUNDARIO}
                        >
                          Quitar
                        </button>
                      )}
                      <TextoEstado estado={estados[clave]} className="mt-1" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <BuscadorArticulos
        titulo="Agregar pieza"
        ayuda={AYUDA_BUSCADOR}
        idCliente={idCliente}
        ocupado={bloqueado}
        onAgregar={agregar}
      />
    </div>
  );
}

/** Select de sucursal en la cabecera; guarda en cuanto cambia. */
export function EdicionSucursal({ idPedido, sucursal }: { idPedido: number; sucursal: SucursalEntrega }) {
  const { guardar, refrescando } = useGuardarPedido(idPedido);
  const { estados, poner, marcarGuardado, hayGuardando } = useEstados();
  // La recién elegida, para que el select no brinque mientras el servidor
  // repinta; tras el refresco coincide con la prop y solo se revierte si IA
  // rechazó el cambio.
  const [elegida, setElegida] = useState<SucursalEntrega | null>(null);
  const idCampo = useId();
  const bloqueado = hayGuardando || refrescando;

  async function cambiar(valor: string) {
    if (!esSucursal(valor) || valor === sucursal) return;
    setElegida(valor);
    poner(CLAVE_UNICA, { fase: "guardando" });
    const fallo = await guardar("/sucursal", "POST", { sucursal: valor }, ERROR_SUCURSAL);
    if (fallo) {
      setElegida(null);
      poner(CLAVE_UNICA, { fase: "error", texto: fallo });
      return;
    }
    marcarGuardado(CLAVE_UNICA);
  }

  return (
    <div>
      <label htmlFor={idCampo} className="sr-only">
        Sucursal donde recoge
      </label>
      <select
        id={idCampo}
        value={elegida ?? sucursal}
        onChange={(e) => void cambiar(e.target.value)}
        disabled={bloqueado}
        className={CLASE_CAMPO}
      >
        {SUCURSALES_ENTREGA.map((s) => (
          <option key={s.clave} value={s.clave}>
            {s.nombre}
          </option>
        ))}
      </select>
      <TextoEstado estado={estados[CLAVE_UNICA]} className="mt-1" />
    </div>
  );
}

/** Textarea de observaciones con su botón; vacío borra las que hubiera. */
export function EdicionObservaciones({
  idPedido,
  observaciones,
}: {
  idPedido: number;
  observaciones: string | null;
}) {
  const { guardar, refrescando } = useGuardarPedido(idPedido);
  const { estados, poner, marcarGuardado, hayGuardando } = useEstados();
  const [texto, setTexto] = useState(observaciones ?? "");
  const idCampo = useId();
  const bloqueado = hayGuardando || refrescando;
  const sinCambios = texto.trim() === (observaciones ?? "");
  const estado = estados[CLAVE_UNICA];

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (bloqueado || sinCambios) return;
    poner(CLAVE_UNICA, { fase: "guardando" });
    const fallo = await guardar(
      "/observaciones",
      "POST",
      { observaciones: texto.trim() || null },
      ERROR_OBSERVACIONES
    );
    if (fallo) {
      poner(CLAVE_UNICA, { fase: "error", texto: fallo });
      return;
    }
    marcarGuardado(CLAVE_UNICA);
  }

  return (
    <form onSubmit={enviar} className="lamina flex flex-col gap-3 p-4" aria-label="Editar observaciones">
      <label htmlFor={idCampo} className="sr-only">
        Observaciones del pedido
      </label>
      <textarea
        id={idCampo}
        value={texto}
        onChange={(e) => setTexto(e.target.value.slice(0, OBSERVACIONES_MAX))}
        maxLength={OBSERVACIONES_MAX}
        rows={3}
        placeholder="Ej: lo pasa a recoger el chofer mañana"
        disabled={bloqueado}
        className={`${CLASE_CAMPO} h-auto resize-y py-2 leading-relaxed`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={bloqueado || sinCambios} className={CLASE_BOTON_PLANO}>
          {estado?.fase === "guardando" ? TEXTO_GUARDANDO : "Guardar observaciones"}
        </button>
        {estado?.fase !== "guardando" && <TextoEstado estado={estado} />}
        <span className="num-tab ml-auto font-mono text-xs text-tinta-suave">
          {texto.length}/{OBSERVACIONES_MAX}
        </span>
      </div>
    </form>
  );
}
