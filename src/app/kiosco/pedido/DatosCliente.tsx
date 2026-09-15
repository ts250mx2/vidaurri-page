"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import {
  CLASE_BOTON_AMBAR_KIOSCO,
  CLASE_BOTON_NEUTRO_KIOSCO,
  CLASE_CAMPO_KIOSCO,
  CLASE_ERROR_KIOSCO,
  CLASE_ETIQUETA_KIOSCO,
} from "@/components/kiosco/estilos";
import {
  NOMBRE_CLIENTE_MAX,
  telefonoTecleado,
  validarDatosCliente,
} from "@/lib/kiosco/identidad";
import {
  esOk,
  kioscoDesactivado,
  llamarKiosco,
  mensajeFallo,
} from "@/lib/kiosco/navegador";
import { RUTA_KIOSCO, RUTA_KIOSCO_LISTO } from "@/lib/kiosco/rutas";
import { sanearAcuse } from "@/lib/kiosco/tipos";

// Los dos datos con los que el mostrador va a hablarle al cliente: su nombre y
// su celular. Nada más: ni correo, ni dirección, ni RFC. Se validan aquí para
// que el error salga al instante (IA los vuelve a validar con la misma regla),
// y el botón ámbar es LA acción de la pantalla: enviar el pedido.
//
// Del acuse solo se lleva el folio, las piezas y el total, por la URL: es lo
// único que la siguiente pantalla necesita enseñar y lo único que IA devuelve.

const TELEFONO_MAX_TECLEADO = 12; // "81 1234 5678"
const ERROR_ENVIAR = "No pude mandar tu pedido; inténtalo otra vez";

export function DatosCliente() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const nombreRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;

    const validacion = validarDatosCliente(nombre, telefono);
    if (!validacion.ok) {
      setError(validacion.error);
      const campo = validacion.campo === "nombre" ? nombreRef : telefonoRef;
      campo.current?.focus();
      return;
    }

    setEnviando(true);
    setError(null);
    const respuesta = await llamarKiosco("/borrador/enviar", { cuerpo: validacion.datos });
    if (kioscoDesactivado(respuesta.status)) return;
    const acuse = esOk(respuesta.datos) ? sanearAcuse(respuesta.datos) : null;
    if (!acuse) {
      setEnviando(false);
      setError(mensajeFallo(respuesta, ERROR_ENVIAR));
      return;
    }

    const destino = new URLSearchParams({
      folio: acuse.folio,
      piezas: String(acuse.piezas),
      total: String(acuse.total),
    });
    // Sin apagar `enviando`: la pantalla se va, y dejar el botón vivo invita a
    // mandar el pedido dos veces.
    router.push(`${RUTA_KIOSCO_LISTO}?${destino}`);
  }

  return (
    <form onSubmit={enviar} className="lamina flex flex-col gap-5 p-6" noValidate>
      <div>
        <p className={CLASE_ETIQUETA_KIOSCO}>Tus datos</p>
        <h2 className="titulo-lamina mt-1 text-3xl">¿A nombre de quién?</h2>
        <p className="mt-2 text-base leading-relaxed text-tinta-suave">
          Con esto te buscamos en el mostrador y te avisamos cuando tu pedido esté listo.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="nombre-kiosco" className={CLASE_ETIQUETA_KIOSCO}>
          Tu nombre
        </label>
        <input
          id="nombre-kiosco"
          ref={nombreRef}
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Juan Pérez"
          maxLength={NOMBRE_CLIENTE_MAX}
          autoComplete="off"
          autoCapitalize="words"
          autoFocus
          required
          className={CLASE_CAMPO_KIOSCO}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="telefono-kiosco" className={CLASE_ETIQUETA_KIOSCO}>
          Tu celular
        </label>
        <input
          id="telefono-kiosco"
          ref={telefonoRef}
          type="tel"
          inputMode="numeric"
          value={telefono}
          onChange={(e) => setTelefono(telefonoTecleado(e.target.value))}
          placeholder="81 1234 5678"
          maxLength={TELEFONO_MAX_TECLEADO}
          autoComplete="off"
          required
          className={`${CLASE_CAMPO_KIOSCO} num-tab font-mono`}
        />
        <p className="text-sm text-tinta-suave">
          10 dígitos con la clave de tu ciudad. Es el número al que te hablamos o te mandamos
          WhatsApp.
        </p>
      </div>

      {error && (
        <p role="alert" className={CLASE_ERROR_KIOSCO}>
          {error}
        </p>
      )}

      <button type="submit" disabled={enviando} className={CLASE_BOTON_AMBAR_KIOSCO}>
        <Send aria-hidden className="size-5" />
        {enviando ? "Mandando tu pedido…" : "Enviar pedido"}
      </button>

      <p className="text-center text-sm leading-relaxed text-tinta-suave">
        Al enviarlo aceptas nuestro{" "}
        {/* Se abre en otra ventana a propósito: el kiosco no navega fuera de sí
            mismo, y el cliente no debe perder el pedido por leer el aviso. */}
        <a
          href="/aviso-de-privacidad"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-tinta underline decoration-ambar decoration-2 underline-offset-2"
        >
          aviso de privacidad
        </a>
        . Usamos tu nombre y tu celular solo para atender este pedido.
      </p>

      <button
        type="button"
        onClick={() => router.push(RUTA_KIOSCO)}
        disabled={enviando}
        className={`${CLASE_BOTON_NEUTRO_KIOSCO} w-full`}
      >
        <ArrowLeft aria-hidden className="size-5" />
        Volver a mi pedido
      </button>
    </form>
  );
}
