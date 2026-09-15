"use client";

import { useState, type FormEvent } from "react";
import {
  CLASE_BOTON_AMBAR_KIOSCO,
  CLASE_ERROR_KIOSCO,
  CLASE_ETIQUETA_KIOSCO,
} from "@/components/kiosco/estilos";
import { RUTA_KIOSCO_ACTIVAR } from "@/lib/kiosco/rutas";

// Salir del modo kiosco. Se vuelve a pedir usuario y clave del POS: sin eso no
// se sale, que es justo lo que impide que el cliente curioso convierta el
// kiosco en un navegador. Al borrar la cookie se recarga la activación.

const ERROR_GENERICO = "No fue posible salir del modo kiosco";
const ERROR_RED = "Sin conexión con el servidor; intenta de nuevo";

const CLASE_CAMPO =
  "h-12 w-full rounded-md border border-linea bg-hoja px-3 text-base text-tinta outline-none transition-colors duration-150 focus:border-tinta disabled:opacity-60";

export function FormularioSalir() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function salir(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/kiosco/salir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.trim(), clave }),
      });
      const datos = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !datos?.ok) {
        setError(datos?.error ?? ERROR_GENERICO);
        setEnviando(false);
        return;
      }
      window.location.assign(RUTA_KIOSCO_ACTIVAR);
    } catch {
      setError(ERROR_RED);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salir} className="mt-6 flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="salir-usuario" className={CLASE_ETIQUETA_KIOSCO}>
          Usuario del POS
        </label>
        <input
          id="salir-usuario"
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoFocus
          required
          className={CLASE_CAMPO}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="salir-clave" className={CLASE_ETIQUETA_KIOSCO}>
          Contraseña
        </label>
        <input
          id="salir-clave"
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
        disabled={enviando || !usuario.trim() || !clave}
        className={`${CLASE_BOTON_AMBAR_KIOSCO} w-full`}
      >
        {enviando ? "Saliendo…" : "Salir del modo kiosco"}
      </button>
    </form>
  );
}
