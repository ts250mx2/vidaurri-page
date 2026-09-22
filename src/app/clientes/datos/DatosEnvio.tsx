"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, MapPin, Send, Store } from "lucide-react";
import clsx from "clsx";
import { FormularioDomicilio } from "@/components/domicilio/FormularioDomicilio";
import { useArea } from "@/components/kiosco/AreaContext";
import {
  CLASE_BOTON_AMBAR_KIOSCO,
  CLASE_BOTON_NEUTRO_KIOSCO,
  CLASE_ERROR_KIOSCO,
  CLASE_ETIQUETA_KIOSCO,
} from "@/components/kiosco/estilos";
import { NEGOCIO } from "@/config/negocio";
import { DOMICILIO_VACIO, domicilioVacio, validarDomicilio, type Domicilio } from "@/lib/domicilio";
import { esOk, llamarArea, mensajeFallo, sesionPerdida } from "@/lib/kiosco/navegador";
import { sanearAcuse } from "@/lib/kiosco/tipos";
import { SUCURSALES_ENTREGA, type SucursalEntrega } from "@/lib/mostrador/tipos";

// Dónde lo recoge y, si quiere, una nota. El botón ámbar es LA acción de la
// pantalla: enviar el pedido. IA exige `permitir_pedido` del padrón (403 si
// no); aquí, sin esa bandera, el botón ni aparece y se explica qué hacer.
//
// El resumen llega ya pintado por el servidor (`resumen`): en el celular va
// entre la nota y el botón, para que el cliente vea qué manda justo antes de
// tocar Enviar; en pantalla grande es la columna de la derecha.
//
// Del acuse solo se lleva el folio, las piezas, el total y la sucursal por la
// URL: es lo único que la siguiente pantalla necesita enseñar y lo único que
// IA devuelve (más la sucursal que eligió aquí).

const OBSERVACIONES_MAX = 300;
const ERROR_ENVIAR = "No pude mandar tu pedido; inténtalo otra vez";

/** La dirección de `negocio.ts` por nombre de sucursal; la ciudad si no coincide. */
function direccionDe(nombre: string): string {
  return NEGOCIO.sucursales.find((s) => s.nombre === nombre)?.direccion ?? NEGOCIO.ciudad;
}

const CLASE_TEXTAREA =
  "min-h-24 w-full resize-y rounded-lg border-2 border-linea bg-hoja px-4 py-3 text-base text-tinta outline-none transition-colors duration-150 placeholder:text-tinta-suave focus:border-tinta disabled:opacity-60";

export function DatosEnvio({
  permitirPedido,
  resumen,
}: {
  permitirPedido: boolean;
  resumen: React.ReactNode;
}) {
  const area = useArea();
  const router = useRouter();
  const [sucursal, setSucursal] = useState<SucursalEntrega>(SUCURSALES_ENTREGA[0].clave);
  const [observaciones, setObservaciones] = useState("");
  const [domicilio, setDomicilio] = useState<Domicilio>(DOMICILIO_VACIO);
  const [conDomicilio, setConDomicilio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando || !permitirPedido) return;

    const validado = validarDomicilio(domicilio);
    if (!validado.ok) {
      setError(validado.error);
      return;
    }

    setEnviando(true);
    setError(null);
    const nota = observaciones.trim().slice(0, OBSERVACIONES_MAX);
    const respuesta = await llamarArea(area, "/borrador/enviar", {
      cuerpo: { sucursal, ...(nota ? { observaciones: nota } : {}), domicilio: validado.domicilio },
    });
    if (sesionPerdida(area, respuesta)) return;
    const acuse = esOk(respuesta.datos) ? sanearAcuse(respuesta.datos) : null;
    if (!acuse) {
      setEnviando(false);
      // El 403 de "pide en el mostrador que te activen los pedidos" llega con
      // el texto de IA, que es el que manda.
      setError(mensajeFallo(respuesta, ERROR_ENVIAR));
      return;
    }

    const destino = new URLSearchParams({
      folio: acuse.folio,
      piezas: String(acuse.piezas),
      total: String(acuse.total),
      sucursal,
    });
    // Sin apagar `enviando`: la pantalla se va, y dejar el botón vivo invita a
    // mandar el pedido dos veces.
    router.push(`${area.rutas.listo}?${destino}`);
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 sm:gap-6 lg:grid-cols-12 lg:items-start">
      <form
        onSubmit={enviar}
        aria-label="Sucursal y envío"
        className="lamina flex flex-col gap-5 p-4 sm:p-6 lg:col-span-7"
        noValidate
      >
        <div>
          <p className={CLASE_ETIQUETA_KIOSCO}>Sucursal</p>
          <h1 className="titulo-lamina mt-1 text-3xl">¿Dónde lo recoges?</h1>
          <p className="mt-2 text-base leading-relaxed text-tinta-suave">
            Tu pedido ya va a tu nombre y con tu precio de cliente. Elige la sucursal y mándalo; el
            mostrador lo confirma y te avisa por WhatsApp.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={`${CLASE_ETIQUETA_KIOSCO} mb-2`}>Elige la sucursal</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SUCURSALES_ENTREGA.map((s) => {
              const elegida = s.clave === sucursal;
              return (
                <label
                  key={s.clave}
                  className={clsx(
                    "flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3.5 transition-colors duration-150",
                    elegida ? "border-tinta bg-papel" : "border-linea bg-hoja hover:border-linea-fuerte"
                  )}
                >
                  <input
                    type="radio"
                    name="sucursal"
                    value={s.clave}
                    checked={elegida}
                    onChange={() => setSucursal(s.clave)}
                    disabled={enviando}
                    className="size-5 shrink-0 accent-tinta"
                  />
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-plano text-white">
                    {s.clave === "matriz" ? (
                      <Store aria-hidden className="size-5" />
                    ) : (
                      <MapPin aria-hidden className="size-5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="rotulo-tecnico block text-base text-tinta">{s.nombre}</span>
                    <span className="block text-sm leading-snug text-tinta-suave">{direccionDe(s.nombre)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-3">
          {conDomicilio || !domicilioVacio(domicilio) ? (
            <>
              <p className={CLASE_ETIQUETA_KIOSCO}>
                Tu domicilio <span className="normal-case tracking-normal">(opcional)</span>
              </p>
              <FormularioDomicilio valor={domicilio} onChange={setDomicilio} disabled={enviando} estilo="kiosco" />
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConDomicilio(true)}
              disabled={enviando}
              className={`${CLASE_BOTON_NEUTRO_KIOSCO} w-full`}
            >
              <Home aria-hidden className="size-5" />
              Agregar mi domicilio (opcional)
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="observaciones-pedido" className={CLASE_ETIQUETA_KIOSCO}>
            ¿Algo que debamos saber? <span className="normal-case tracking-normal">(opcional)</span>
          </label>
          <textarea
            id="observaciones-pedido"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: paso por él el sábado; es para un Versa 2016 color rojo"
            maxLength={OBSERVACIONES_MAX}
            disabled={enviando}
            className={CLASE_TEXTAREA}
          />
          <p className="num-tab text-right font-mono text-xs text-tinta-suave">
            {observaciones.length}/{OBSERVACIONES_MAX}
          </p>
        </div>

        <div className="lg:hidden">{resumen}</div>

        {error && (
          <p role="alert" className={CLASE_ERROR_KIOSCO}>
            {error}
          </p>
        )}

        {permitirPedido ? (
          <button type="submit" disabled={enviando} className={CLASE_BOTON_AMBAR_KIOSCO}>
            <Send aria-hidden className="size-5" />
            {enviando ? "Mandando tu pedido…" : "Enviar pedido"}
          </button>
        ) : (
          <div
            role="status"
            className="rounded-lg border-2 border-dashed border-linea-fuerte bg-papel px-4 py-4 text-base leading-relaxed text-tinta"
          >
            <p className="rotulo-tecnico text-sm text-tinta-suave">Pedidos desde tu cuenta</p>
            <p className="mt-1">
              Tu cuenta todavía no tiene activados los pedidos a distancia. Pide en el mostrador que te
              los activen y desde aquí lo mandas; mientras, tu pedido se queda guardado.
            </p>
          </div>
        )}

        <p className="text-center text-sm leading-relaxed text-tinta-suave">
          Al enviarlo aceptas nuestro{" "}
          <a
            href="/aviso-de-privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-tinta underline decoration-ambar decoration-2 underline-offset-2"
          >
            aviso de privacidad
          </a>
          . Usamos tus datos del padrón solo para atender este pedido.
        </p>

        <button
          type="button"
          onClick={() => router.push(area.rutas.armar)}
          disabled={enviando}
          className={`${CLASE_BOTON_NEUTRO_KIOSCO} w-full`}
        >
          <ArrowLeft aria-hidden className="size-5" />
          Volver a mi pedido
        </button>
      </form>

      <div className="hidden lg:col-span-5 lg:block">{resumen}</div>
    </div>
  );
}
