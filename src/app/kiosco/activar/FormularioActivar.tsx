"use client";

import { useState, type FormEvent } from "react";
import {
  CLASE_BOTON_AMBAR_KIOSCO,
  CLASE_ERROR_KIOSCO,
  CLASE_ETIQUETA_KIOSCO,
} from "@/components/kiosco/estilos";
import { NOMBRE_KIOSCO_MAX } from "@/lib/kiosco/identidad";
import { RUTA_KIOSCO } from "@/lib/kiosco/rutas";
import { SUCURSALES_ENTREGA, type SucursalEntrega } from "@/lib/mostrador/tipos";

// Alta del aparato. Lo llena el PERSONAL, no el cliente: usuario y clave del
// POS (solo Administración u Operaciones), cómo se va a llamar esta máquina y
// en qué sucursal está parada. El servidor comprueba las credenciales contra
// IA y deja la cookie del dispositivo; el token del vendedor no se guarda.
//
// Al terminar se navega con recarga completa para que el guardia de borde y el
// layout lean la cookie recién puesta.

const ERROR_GENERICO = "No fue posible activar el kiosco";
const ERROR_RED = "Sin conexión con el servidor; intenta de nuevo";

/** Campo de esta pantalla: más sobrio que el del cliente, aquí teclea el personal. */
const CLASE_CAMPO =
  "h-12 w-full rounded-md border border-linea bg-hoja px-3 text-base text-tinta outline-none transition-colors duration-150 focus:border-tinta disabled:opacity-60";

export function FormularioActivar({
  nombreActual,
  sucursalActual,
}: {
  nombreActual: string;
  sucursalActual: SucursalEntrega;
}) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [nombre, setNombre] = useState(nombreActual);
  const [sucursal, setSucursal] = useState<SucursalEntrega>(sucursalActual);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function activar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/kiosco/activar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.trim(), clave, nombre: nombre.trim(), sucursal }),
      });
      const datos = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !datos?.ok) {
        setError(datos?.error ?? ERROR_GENERICO);
        setEnviando(false);
        return;
      }
      window.location.assign(RUTA_KIOSCO);
    } catch {
      setError(ERROR_RED);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={activar} className="mt-6 flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="kiosco-nombre" className={CLASE_ETIQUETA_KIOSCO}>
          Nombre del kiosco
        </label>
        <input
          id="kiosco-nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Kiosco Matriz 1"
          maxLength={NOMBRE_KIOSCO_MAX}
          autoComplete="off"
          required
          className={CLASE_CAMPO}
        />
        <p className="text-xs text-tinta-suave">
          Con este nombre se identifica el aparato ante el Vendedor IA. Ponle uno distinto a cada PC.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="kiosco-sucursal" className={CLASE_ETIQUETA_KIOSCO}>
          Sucursal donde está la PC
        </label>
        <select
          id="kiosco-sucursal"
          value={sucursal}
          onChange={(e) => setSucursal(e.target.value as SucursalEntrega)}
          className={CLASE_CAMPO}
        >
          {SUCURSALES_ENTREGA.map((s) => (
            <option key={s.clave} value={s.clave}>
              {s.nombre}
            </option>
          ))}
        </select>
        <p className="text-xs text-tinta-suave">
          Todo pedido que salga de esta pantalla se recoge aquí; el cliente no la elige.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="kiosco-usuario" className={CLASE_ETIQUETA_KIOSCO}>
          Usuario del POS
        </label>
        <input
          id="kiosco-usuario"
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          required
          className={CLASE_CAMPO}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="kiosco-clave" className={CLASE_ETIQUETA_KIOSCO}>
          Contraseña
        </label>
        <input
          id="kiosco-clave"
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          autoComplete="current-password"
          required
          className={CLASE_CAMPO}
        />
      </div>

      {error && (
        <p role="alert" className={CLASE_ERROR_KIOSCO}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || !usuario.trim() || !clave || !nombre.trim()}
        className={`${CLASE_BOTON_AMBAR_KIOSCO} w-full`}
      >
        {enviando ? "Activando…" : "Activar el kiosco"}
      </button>
    </form>
  );
}
