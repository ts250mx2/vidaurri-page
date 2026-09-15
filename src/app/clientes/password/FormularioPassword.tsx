"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, KeyRound, PackagePlus } from "lucide-react";
import { useArea } from "@/components/kiosco/AreaContext";
import {
  CLASE_BOTON_AMBAR_KIOSCO,
  CLASE_BOTON_NEUTRO_KIOSCO,
  CLASE_CAMPO_KIOSCO,
  CLASE_ERROR_KIOSCO,
  CLASE_ETIQUETA_KIOSCO,
} from "@/components/kiosco/estilos";
import {
  PASSWORD_MAX,
  REGLAS_PASSWORD,
  validarCambioPassword,
  type CampoCambio,
} from "@/lib/clientes/credenciales";
import {
  esErrorDeCredenciales,
  esOk,
  llamarArea,
  mensajeFallo,
  sesionPerdida,
} from "@/lib/kiosco/navegador";

// Tres campos y las reglas a la vista. La validación de aquí es la misma que
// aplica IA (largo, espacios, distinta del celular, confirmación): sirve para
// que el error salga al instante; la que manda es la de IA, cuyo 400 se
// enseña tal cual. "La contraseña actual no es correcta" (401) es un error
// del campo, no una sesión perdida. Al terminar, `router.refresh()` hace que
// el layout relea la cookie refirmada y el aviso de "cámbiala" se apague.

const ERROR_CAMBIO = "No pude cambiar tu contraseña; inténtalo otra vez";

export function FormularioPassword({ porDefecto }: { porDefecto: boolean }) {
  const area = useArea();
  const router = useRouter();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  // Tres refs sueltas (nunca hooks dentro de un objeto literal: el compilador
  // de React los cuenta distinto entre renders) y el mapa se arma después.
  const actualRef = useRef<HTMLInputElement>(null);
  const nuevaRef = useRef<HTMLInputElement>(null);
  const confirmacionRef = useRef<HTMLInputElement>(null);
  const refs: Record<CampoCambio, React.RefObject<HTMLInputElement | null>> = {
    actual: actualRef,
    nueva: nuevaRef,
    confirmacion: confirmacionRef,
  };

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardando) return;

    const validacion = validarCambioPassword(actual, nueva, confirmacion);
    if (!validacion.ok) {
      setError(validacion.error);
      refs[validacion.campo].current?.focus();
      return;
    }

    setGuardando(true);
    setError(null);
    const respuesta = await llamarArea(area, "/password", {
      cuerpo: { actual: validacion.datos.actual, nueva: validacion.datos.nueva, confirmacion },
    });
    if (!esErrorDeCredenciales(respuesta) && sesionPerdida(area, respuesta)) return;
    if (!esOk(respuesta.datos)) {
      setGuardando(false);
      setError(mensajeFallo(respuesta, ERROR_CAMBIO));
      (esErrorDeCredenciales(respuesta) ? refs.actual : refs.nueva).current?.focus();
      return;
    }
    setGuardando(false);
    setListo(true);
    setActual("");
    setNueva("");
    setConfirmacion("");
    // La cookie ya viene refirmada: el layout relee y apaga el aviso.
    router.refresh();
  }

  if (listo) {
    return (
      <div className="mx-auto w-full max-w-2xl py-2 text-center sm:py-4">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-existencia text-white sm:size-16">
          <Check aria-hidden className="size-8 sm:size-9" />
        </span>
        <h1 className="titulo-lamina mt-4 text-3xl sm:text-4xl">Listo, tu contraseña cambió</h1>
        <p className="mt-3 text-base leading-relaxed text-tinta-suave sm:text-lg">
          La próxima vez entra con tu celular y tu contraseña nueva. Tu sesión de hoy sigue abierta.
        </p>
        <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-3">
          <Link href={area.rutas.armar} prefetch={false} className={`${CLASE_BOTON_AMBAR_KIOSCO} w-full`}>
            <PackagePlus aria-hidden className="size-5" />
            Armar pedido
          </Link>
          <button type="button" onClick={() => setListo(false)} className={`${CLASE_BOTON_NEUTRO_KIOSCO} w-full`}>
            <KeyRound aria-hidden className="size-5" />
            Cambiarla otra vez
          </button>
        </div>
      </div>
    );
  }

  const campos: Array<{ id: CampoCambio; etiqueta: string; valor: string; poner: (v: string) => void; autoComplete: string }> = [
    { id: "actual", etiqueta: "Contraseña actual", valor: actual, poner: setActual, autoComplete: "current-password" },
    { id: "nueva", etiqueta: "Contraseña nueva", valor: nueva, poner: setNueva, autoComplete: "new-password" },
    { id: "confirmacion", etiqueta: "Repite la contraseña nueva", valor: confirmacion, poner: setConfirmacion, autoComplete: "new-password" },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl py-2 sm:py-4">
      <form onSubmit={guardar} className="lamina flex flex-col gap-5 p-5 sm:gap-6 sm:p-8" noValidate>
        <div>
          <p className={CLASE_ETIQUETA_KIOSCO}>Tu cuenta</p>
          <h1 className="titulo-lamina mt-1 text-3xl sm:text-4xl">Cambia tu contraseña</h1>
          <p className="mt-3 text-base leading-relaxed text-tinta-suave sm:text-lg">
            {porDefecto
              ? "Tu contraseña sigue siendo tu celular: escríbelo en “actual” y ponte una que solo tú sepas."
              : "Escribe la de hoy y la nueva dos veces."}
          </p>
        </div>

        {campos.map((campo) => (
          <div key={campo.id} className="flex flex-col gap-2">
            <label htmlFor={`password-${campo.id}`} className={CLASE_ETIQUETA_KIOSCO}>
              {campo.etiqueta}
            </label>
            <input
              id={`password-${campo.id}`}
              ref={refs[campo.id]}
              type={ver ? "text" : "password"}
              value={campo.valor}
              onChange={(e) => campo.poner(e.target.value)}
              autoComplete={campo.autoComplete}
              maxLength={PASSWORD_MAX}
              disabled={guardando}
              className={CLASE_CAMPO_KIOSCO}
            />
          </div>
        ))}

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-tinta">
          <input
            type="checkbox"
            checked={ver}
            onChange={(e) => setVer(e.target.checked)}
            className="size-5 accent-tinta"
          />
          Mostrar lo que escribo
        </label>

        <ul className="rounded-lg border border-dashed border-linea-fuerte px-4 py-3 text-sm leading-relaxed text-tinta-suave">
          <li className="rotulo-tecnico mb-1 text-xs text-tinta">La contraseña nueva</li>
          {REGLAS_PASSWORD.map((regla) => (
            <li key={regla} className="flex items-center gap-2">
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-tinta-suave" />
              {regla}
            </li>
          ))}
        </ul>

        {error && (
          <p role="alert" className={CLASE_ERROR_KIOSCO}>
            {error}
          </p>
        )}

        <button type="submit" disabled={guardando} className={CLASE_BOTON_AMBAR_KIOSCO}>
          <KeyRound aria-hidden className="size-5" />
          {guardando ? "Guardando…" : "Guardar contraseña"}
        </button>

        <p className="text-center text-sm leading-relaxed text-tinta-suave">
          Se guarda cifrada: ni el mostrador puede verla. Si la olvidas, pide en el mostrador que te la
          regresen a tu celular.
        </p>
      </form>
    </div>
  );
}
