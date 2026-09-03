"use client";

import { useState, type FormEvent } from "react";

// Formulario de entrada al mostrador. Manda usuario y contraseña al proxy de
// PAGE (/api/mostrador/login), que es quien habla con IA y deja la cookie
// httpOnly; el navegador nunca ve el token. Al entrar se navega con recarga
// completa para que el proxy de borde y el layout lean la cookie recién puesta.

const ERROR_GENERICO = "No fue posible entrar; intenta de nuevo";
const ERROR_RED = "Sin conexión con el servidor; intenta de nuevo";

interface RespuestaLogin {
  ok?: boolean;
  error?: string;
}

export function FormularioLogin({ volver }: { volver: string }) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/mostrador/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.trim(), clave }),
      });
      const datos = (await res.json().catch(() => null)) as RespuestaLogin | null;
      if (!res.ok || !datos?.ok) {
        setError(datos?.error ?? ERROR_GENERICO);
        setEnviando(false);
        return;
      }
      window.location.assign(volver);
    } catch {
      setError(ERROR_RED);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="mt-6 flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="usuario" className="rotulo-tecnico text-xs text-tinta-suave">
          Usuario
        </label>
        <input
          id="usuario"
          name="usuario"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoFocus
          required
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="h-12 w-full rounded-md border border-linea bg-hoja px-3 text-base text-tinta outline-none transition-colors duration-150 focus:border-tinta"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="clave" className="rotulo-tecnico text-xs text-tinta-suave">
          Contraseña
        </label>
        <input
          id="clave"
          name="clave"
          type="password"
          autoComplete="current-password"
          required
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className="h-12 w-full rounded-md border border-linea bg-hoja px-3 text-base text-tinta outline-none transition-colors duration-150 focus:border-tinta"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-anotacion">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || !usuario.trim() || !clave}
        className="rotulo-tecnico mt-2 inline-flex h-12 w-full items-center justify-center rounded-md bg-ambar text-sm text-plano-hondo transition-colors duration-150 hover:bg-ambar-press active:bg-ambar-press disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
