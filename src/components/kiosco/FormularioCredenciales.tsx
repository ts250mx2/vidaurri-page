"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LogIn, Smartphone } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { NEGOCIO } from "@/config/negocio";
import { validarCredencialesCliente } from "@/lib/clientes/credenciales";
import { telefonoTecleado } from "@/lib/kiosco/identidad";
import {
  esErrorDeCredenciales,
  esOk,
  llamarArea,
  mensajeFallo,
  sesionPerdida,
} from "@/lib/kiosco/navegador";
import { useArea } from "./AreaContext";
import {
  CLASE_BOTON_AMBAR_KIOSCO,
  CLASE_BOTON_NEUTRO_KIOSCO,
  CLASE_CAMPO_KIOSCO,
  CLASE_ERROR_KIOSCO,
  CLASE_ETIQUETA_KIOSCO,
} from "./estilos";
import { Tecla } from "./Tecla";

// Entrar con celular y contraseña, en el kiosco de la tienda y en el área de
// clientes (el área la dice el contexto). Dos campos: el celular es el
// usuario, y la contraseña la primera vez es el mismo celular (decisión del
// dueño, 15 sep 2026); después, la que el cliente se ponga. Los errores de IA
// se enseñan tal cual: "Celular o contraseña incorrectos" (401, el mismo
// texto esté o no en el padrón, para no revelar quién está) y el de muchos
// intentos (429).
//
// En el kiosco se opera con el teclado (Enter entra, Escape limpia y con los
// campos vacíos regresa a armar) y se ofrece "Seguir sin cuenta", que es lo
// que hacía el público general antes de que existiera esto. En el celular del
// cliente no hay "sin cuenta": el área entera es suya.

const TELEFONO_MAX_TECLEADO = 12; // "81 1234 5678"
const ERROR_ENTRAR = "No pude comprobar tus datos; inténtalo otra vez";
const ERROR_INTENTOS = "Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.";
const STATUS_INTENTOS = 429;

export function FormularioCredenciales({ hayPiezas = false }: { hayPiezas?: boolean }) {
  const area = useArea();
  const router = useRouter();
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const celularRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const esKiosco = area.area === "kiosco";

  // En la PC el cliente llega y teclea su número: el foco es del campo desde
  // el inicio. En el celular se deja leer la explicación primero.
  useEffect(() => {
    if (area.conTeclado) celularRef.current?.focus();
  }, [area.conTeclado]);

  function alTeclear(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== "Escape" || !esKiosco) return;
    evento.preventDefault();
    if (!telefono && !password) {
      router.push(area.rutas.armar);
      return;
    }
    setTelefono("");
    setPassword("");
    setError(null);
    celularRef.current?.focus();
  }

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (entrando) return;

    const validacion = validarCredencialesCliente({ usuario: telefono, password });
    if (!validacion.ok) {
      setError(validacion.error);
      (validacion.campo === "usuario" ? celularRef : passwordRef).current?.focus();
      return;
    }

    setEntrando(true);
    setError(null);
    const respuesta = await llamarArea(area, area.rutaApiEntrar, { cuerpo: validacion.datos });
    // Credenciales mal tecleadas son un error del formulario; cualquier otro
    // 401 es que la credencial base (el aparato) se perdió.
    if (!esErrorDeCredenciales(respuesta) && sesionPerdida(area, respuesta)) return;
    if (!esOk(respuesta.datos)) {
      setEntrando(false);
      // El texto de IA manda; el de intentos es el respaldo por si no viene.
      setError(mensajeFallo(respuesta, respuesta.status === STATUS_INTENTOS ? ERROR_INTENTOS : ERROR_ENTRAR));
      setPassword("");
      passwordRef.current?.focus();
      return;
    }
    // Navegación completa: el layout relee la cookie recién puesta y Vico
    // saluda por su nombre. `entrando` se queda encendido a propósito.
    window.location.assign(area.rutas.armar);
  }

  return (
    <div className="mx-auto w-full max-w-2xl py-2 sm:py-4">
      <form onSubmit={entrar} className="lamina flex flex-col gap-5 p-5 sm:gap-6 sm:p-8" noValidate>
        <div>
          <p className={CLASE_ETIQUETA_KIOSCO}>Cliente registrado</p>
          <h1 className="titulo-lamina mt-1 text-3xl sm:text-4xl">Entra con tu celular</h1>
          <p className="mt-3 text-base leading-relaxed text-tinta-suave sm:text-lg">
            {esKiosco
              ? "Con el celular con el que te registramos en el mostrador, tu pedido queda a tu nombre y con tu precio de cliente."
              : "Arma tu pedido con tu precio de cliente y revisa cómo van los que ya mandaste."}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="celular-entrar" className={CLASE_ETIQUETA_KIOSCO}>
            Tu celular
          </label>
          <div className="relative">
            <Smartphone
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-tinta-suave sm:left-5 sm:size-7"
            />
            <input
              id="celular-entrar"
              ref={celularRef}
              type="tel"
              inputMode="numeric"
              value={telefono}
              onChange={(e) => setTelefono(telefonoTecleado(e.target.value))}
              onKeyDown={alTeclear}
              placeholder="81 1234 5678"
              maxLength={TELEFONO_MAX_TECLEADO}
              autoComplete="username"
              disabled={entrando}
              className={twMerge(
                CLASE_CAMPO_KIOSCO,
                "num-tab h-16 pl-14 font-mono text-2xl tracking-wider sm:h-20 sm:pl-16 sm:text-3xl"
              )}
            />
          </div>
          <p className="text-sm text-tinta-suave">10 dígitos con la clave de tu ciudad.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password-entrar" className={CLASE_ETIQUETA_KIOSCO}>
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password-entrar"
              ref={passwordRef}
              type={verPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={alTeclear}
              autoComplete="current-password"
              maxLength={64}
              disabled={entrando}
              className={twMerge(CLASE_CAMPO_KIOSCO, "pr-14")}
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              aria-label={verPassword ? "Ocultar la contraseña" : "Mostrar la contraseña"}
              aria-pressed={verPassword}
              className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-tinta-suave transition-colors duration-150 hover:bg-papel hover:text-tinta"
            >
              {verPassword ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
            </button>
          </div>
          <p className="text-sm text-tinta-suave">
            <span className="font-semibold text-tinta">La primera vez tu contraseña es tu celular</span>
            {esKiosco ? "." : "; al entrar puedes cambiarla."}
          </p>
        </div>

        {esKiosco && (
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tinta-suave">
            <span>
              <Tecla>Enter</Tecla> entra
            </span>
            <span>
              <Tecla>Esc</Tecla> limpia; con los campos vacíos, regresa
            </span>
          </p>
        )}

        {hayPiezas && (
          <p
            role="status"
            className="rounded-lg border border-dashed border-linea-fuerte px-4 py-3 text-base leading-relaxed text-tinta-suave"
          >
            Ya llevas piezas en tu pedido. Al entrar se vacía y lo vuelves a armar con tu precio de
            cliente; si prefieres conservarlo, sigue sin cuenta.
          </p>
        )}

        {error && (
          <p role="alert" className={CLASE_ERROR_KIOSCO}>
            {error}
          </p>
        )}

        <button type="submit" disabled={entrando} className={CLASE_BOTON_AMBAR_KIOSCO}>
          <LogIn aria-hidden className="size-5" />
          {entrando ? "Comprobando…" : "Entrar"}
        </button>

        {esKiosco && (
          <button
            type="button"
            onClick={() => router.push(area.rutas.armar)}
            disabled={entrando}
            className={`${CLASE_BOTON_NEUTRO_KIOSCO} w-full`}
          >
            <ArrowLeft aria-hidden className="size-5" />
            Seguir sin cuenta
          </button>
        )}

        <p className="text-center text-sm leading-relaxed text-tinta-suave">
          {esKiosco
            ? `Usamos tu celular solo para encontrarte en nuestro padrón y poner el pedido a tu nombre. Tu sesión se cierra sola a los ${area.duracionSesionTexto}.`
            : `Tu sesión dura ${area.duracionSesionTexto} en este dispositivo. ¿No tienes cuenta? Pide en el mostrador que te registren, o cotiza por WhatsApp al ${NEGOCIO.whatsappBonito}.`}
        </p>
      </form>
    </div>
  );
}
