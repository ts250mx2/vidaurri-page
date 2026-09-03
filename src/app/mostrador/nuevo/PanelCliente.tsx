"use client";

import { useEffect, useState, type FormEvent } from "react";
import clsx from "clsx";
import {
  CLASE_BOTON_PLANO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_CAMPO,
  CLASE_ERROR,
  CLASE_ETIQUETA,
} from "@/components/mostrador/estilos";
import {
  arregloDe,
  esOk,
  llamarProxy,
  mensajeFallo,
  sesionVencida,
  STATUS_ABORTADA,
} from "@/lib/mostrador/navegador";
import {
  SUCURSALES_ENTREGA,
  type ClienteDescuento,
  type PedidoDetalle,
  type SucursalEntrega,
} from "@/lib/mostrador/tipos";

// Columna "Cliente": a quién se le levanta el pedido y dónde lo recoge. El
// buscador pega al padrón con debounce; "Público general" y el alta rápida
// también terminan en `onElegir`, que es quien abre el borrador en IA con el
// descuento de ese cliente. Lo elegido se lee del borrador (única verdad),
// no de un estado propio: si IA rechazó el cambio, la pantalla no miente.

interface PropsPanelCliente {
  borrador: PedidoDetalle | null;
  ocupado: boolean;
  clientePublico: string;
  onElegir: (idCliente: number | null) => Promise<void>;
  onSucursal: (sucursal: SucursalEntrega) => Promise<void>;
}

interface Alta {
  cliente: string;
  telefono: string;
  rfc: string;
}

/** Como lo manda IA en el 409 del alta: el cliente que ya tiene ese celular. */
interface Existente {
  id: number;
  cliente: string;
}

const DEBOUNCE_MS = 300;
const MIN_BUSQUEDA = 2;
const BUSQUEDA_MAX = 80;
const NOMBRE_MAX = 150;
const RFC_MAX = 13;
const ALTA_VACIA: Alta = { cliente: "", telefono: "", rfc: "" };
const ERROR_BUSQUEDA = "No fue posible buscar en el padrón";
const ERROR_ALTA = "No fue posible dar de alta al cliente";

/** Lo que se manda a IA; los mensajes son para el vendedor. */
function validarAlta(alta: Alta): { ok: true; datos: Record<string, string> } | { ok: false; error: string } {
  const cliente = alta.cliente.trim().replace(/\s+/g, " ");
  if (!cliente) return { ok: false, error: "Captura el nombre del cliente" };
  const telefono = alta.telefono.replace(/\D/g, "");
  if (alta.telefono.trim() && telefono.length !== 10) {
    return { ok: false, error: "El celular debe tener 10 dígitos" };
  }
  const rfc = alta.rfc.trim().toUpperCase();
  if (rfc && (rfc.length < 12 || rfc.length > RFC_MAX)) {
    return { ok: false, error: "El RFC debe tener 12 o 13 caracteres" };
  }
  const datos: Record<string, string> = { cliente };
  if (telefono) datos.telefono = telefono;
  if (rfc) datos.rfc = rfc;
  return { ok: true, datos };
}

function existenteDe(datos: Record<string, unknown> | null): Existente | null {
  const crudo = datos?.existente;
  if (typeof crudo !== "object" || crudo === null) return null;
  const { id, cliente } = crudo as { id?: unknown; cliente?: unknown };
  if (typeof id !== "number" || typeof cliente !== "string") return null;
  return { id, cliente };
}

function celularBonito(telefono: string | null): string {
  if (!telefono || telefono.length !== 10) return telefono ?? "";
  return `${telefono.slice(0, 3)} ${telefono.slice(3, 6)} ${telefono.slice(6)}`;
}

export function PanelCliente({ borrador, ocupado, clientePublico, onElegir, onSucursal }: PropsPanelCliente) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ClienteDescuento[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [altaAbierta, setAltaAbierta] = useState(false);
  const [alta, setAlta] = useState<Alta>(ALTA_VACIA);
  const [errorAlta, setErrorAlta] = useState<string | null>(null);
  const [existente, setExistente] = useState<Existente | null>(null);
  const [dandoDeAlta, setDandoDeAlta] = useState(false);

  const textoBusqueda = busqueda.trim().slice(0, BUSQUEDA_MAX);
  const busquedaActiva = textoBusqueda.length >= MIN_BUSQUEDA;
  const sucursalActual = borrador?.sucursal ?? "matriz";

  // Debounce de 300 ms y aborto de la búsqueda anterior: al teclear rápido
  // solo llega al padrón la última, y una respuesta tardía nunca pisa a una
  // más nueva. El estado se toca dentro del temporizador, no en el efecto.
  useEffect(() => {
    if (!busquedaActiva) return;
    const control = new AbortController();
    const temporizador = setTimeout(async () => {
      setBuscando(true);
      const respuesta = await llamarProxy(
        `/clientes?busqueda=${encodeURIComponent(textoBusqueda)}`,
        { signal: control.signal }
      );
      if (respuesta.status === STATUS_ABORTADA || control.signal.aborted) return;
      setBuscando(false);
      if (sesionVencida(respuesta.status)) return;
      if (!esOk(respuesta.datos)) {
        setErrorBusqueda(mensajeFallo(respuesta, ERROR_BUSQUEDA));
        return;
      }
      setErrorBusqueda(null);
      setResultados(arregloDe<ClienteDescuento>(respuesta.datos, "clientes"));
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(temporizador);
      control.abort();
    };
  }, [busquedaActiva, textoBusqueda]);

  async function darDeAlta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (dandoDeAlta) return;
    const validacion = validarAlta(alta);
    if (!validacion.ok) {
      setErrorAlta(validacion.error);
      return;
    }
    setDandoDeAlta(true);
    setErrorAlta(null);
    setExistente(null);
    const respuesta = await llamarProxy("/clientes", { cuerpo: validacion.datos });
    setDandoDeAlta(false);
    if (sesionVencida(respuesta.status)) return;
    const cliente = respuesta.datos?.cliente as { id?: unknown } | undefined;
    if (!esOk(respuesta.datos) || typeof cliente?.id !== "number") {
      setErrorAlta(mensajeFallo(respuesta, ERROR_ALTA));
      if (respuesta.status === 409) setExistente(existenteDe(respuesta.datos));
      return;
    }
    setAlta(ALTA_VACIA);
    setAltaAbierta(false);
    await onElegir(cliente.id);
  }

  async function elegirExistente() {
    if (!existente) return;
    setExistente(null);
    setErrorAlta(null);
    setAltaAbierta(false);
    await onElegir(existente.id);
  }

  return (
    <div className="lamina flex flex-col gap-5 p-4">
      <div>
        <p className={CLASE_ETIQUETA}>Cliente</p>
        {borrador ? (
          <div className="mt-1">
            <p className="text-base font-semibold leading-tight text-tinta">{borrador.cliente}</p>
            <p className="num-tab mt-0.5 font-mono text-xs text-tinta-suave">
              {borrador.telefono ? `${celularBonito(borrador.telefono)} · ` : ""}
              {borrador.idCliente === null ? "precio de mostrador" : `${borrador.descuentoPct}% de descuento`}
            </p>
          </div>
        ) : (
          <p className="mt-1 text-sm text-tinta-suave">
            Sin elegir: el pedido se levanta a {clientePublico.toLowerCase()}.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="busqueda-cliente" className={CLASE_ETIQUETA}>
          Buscar en el padrón
        </label>
        <input
          id="busqueda-cliente"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Nombre o celular"
          maxLength={BUSQUEDA_MAX}
          autoComplete="off"
          className={CLASE_CAMPO}
        />
        {busquedaActiva && (
          <ul className="flex flex-col divide-y divide-linea rounded-md border border-linea">
            {buscando && resultados.length === 0 && (
              <li className="px-3 py-2 text-sm text-tinta-suave">Buscando…</li>
            )}
            {!buscando && !errorBusqueda && resultados.length === 0 && (
              <li className="px-3 py-2 text-sm text-tinta-suave">
                Nadie con ese dato; dalo de alta abajo.
              </li>
            )}
            {errorBusqueda && (
              <li className={`px-3 py-2 ${CLASE_ERROR}`}>{errorBusqueda}</li>
            )}
            {resultados.map((c) => {
              const elegido = borrador?.idCliente === c.id;
              return (
                <li key={c.id} className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-tinta">{c.cliente}</p>
                    <p className="num-tab font-mono text-xs text-tinta-suave">
                      {c.telefono ? `${celularBonito(c.telefono)} · ` : ""}
                      {c.descuento}% desc.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onElegir(c.id)}
                    disabled={ocupado || elegido}
                    className={clsx(CLASE_BOTON_PLANO, "shrink-0")}
                  >
                    {elegido ? "Elegido" : "Elegir"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onElegir(null)}
          disabled={ocupado || (borrador !== null && borrador.idCliente === null)}
          className={CLASE_BOTON_SECUNDARIO}
        >
          {clientePublico}
        </button>
        <button
          type="button"
          onClick={() => setAltaAbierta((v) => !v)}
          aria-expanded={altaAbierta}
          className={CLASE_BOTON_SECUNDARIO}
        >
          {altaAbierta ? "Cerrar alta" : "Dar de alta"}
        </button>
      </div>

      {altaAbierta && (
        <form onSubmit={darDeAlta} noValidate className="flex flex-col gap-3 rounded-md border border-linea bg-papel p-3">
          <p className={CLASE_ETIQUETA}>Alta rápida</p>
          <input
            type="text"
            value={alta.cliente}
            onChange={(e) => setAlta({ ...alta, cliente: e.target.value })}
            placeholder="Nombre o razón social"
            maxLength={NOMBRE_MAX}
            aria-label="Nombre del cliente"
            required
            className={CLASE_CAMPO}
          />
          <input
            type="tel"
            inputMode="numeric"
            value={alta.telefono}
            onChange={(e) => setAlta({ ...alta, telefono: e.target.value })}
            placeholder="Celular a 10 dígitos"
            maxLength={16}
            aria-label="Celular del cliente"
            className={CLASE_CAMPO}
          />
          <input
            type="text"
            value={alta.rfc}
            onChange={(e) => setAlta({ ...alta, rfc: e.target.value })}
            placeholder="RFC (opcional)"
            maxLength={RFC_MAX}
            autoCapitalize="characters"
            aria-label="RFC del cliente"
            className={`${CLASE_CAMPO} font-mono uppercase`}
          />
          {errorAlta && (
            <p role="alert" className={CLASE_ERROR}>
              {errorAlta}
            </p>
          )}
          {existente && (
            <button type="button" onClick={() => void elegirExistente()} disabled={ocupado} className={CLASE_BOTON_PLANO}>
              Elegir a {existente.cliente}
            </button>
          )}
          <button
            type="submit"
            disabled={dandoDeAlta || ocupado || !alta.cliente.trim()}
            className={CLASE_BOTON_PLANO}
          >
            {dandoDeAlta ? "Guardando…" : "Guardar y elegir"}
          </button>
          <p className="text-[11px] leading-relaxed text-tinta-suave">
            Entra al padrón con el descuento por defecto; el panel decide después si puede pedir por su cuenta.
          </p>
        </form>
      )}

      <div className="flex flex-col gap-2">
        <p className={CLASE_ETIQUETA}>Recoge en</p>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Sucursal donde recoge">
          {SUCURSALES_ENTREGA.map((s) => {
            const activa = s.clave === sucursalActual;
            return (
              <button
                key={s.clave}
                type="button"
                onClick={() => void onSucursal(s.clave)}
                disabled={ocupado || activa}
                aria-pressed={activa}
                className={clsx(
                  "rotulo-tecnico inline-flex h-11 items-center justify-center rounded-md border px-2 text-xs transition-colors duration-150 disabled:cursor-default",
                  activa
                    ? "border-plano bg-plano text-white"
                    : "border-linea-fuerte bg-hoja text-tinta hover:border-tinta disabled:opacity-60"
                )}
              >
                {s.nombre}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
