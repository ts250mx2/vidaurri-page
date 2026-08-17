"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import clsx from "clsx";
import type { Marca, Modelo, TipoParte } from "@/lib/catalogo";
import { slugificar } from "@/lib/slug";
import { abrirChat } from "@/components/BotonCotizar";

// Buscador Marca -> Modelo -> Año -> Tipo de pieza (selects encadenados).
// Navega a la URL semantica del catalogo: /refacciones/nissan/versa/2016/faros.
// Los selects de modelo y año se pueblan bajo demanda desde /api/catalogo/*.
// Es el objeto mas brillante de la pantalla en el hero: tarjeta blanca sobre
// el muro grafito, para que la primera accion del sitio sea inconfundible.

export function SelectorVehiculo({
  marcas,
  tipos,
  compacto = false,
  tono = "claro",
}: {
  marcas: Marca[];
  tipos: TipoParte[];
  /** Version compacta para paginas internas (sin linea de rescate a Vico). */
  compacto?: boolean;
  /** "oscuro" cuando el buscador va sobre una banda grafito (el hero). */
  tono?: "claro" | "oscuro";
}) {
  const router = useRouter();
  const [marcaId, setMarcaId] = useState(0);
  const [modeloId, setModeloId] = useState(0);
  const [anio, setAnio] = useState(0);
  const [parteId, setParteId] = useState(0);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [anios, setAnios] = useState<number[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    setModeloId(0);
    setModelos([]);
    if (!marcaId) return;
    let vivo = true;
    fetch(`/api/catalogo/modelos?marca=${marcaId}`)
      .then((r) => r.json())
      .then((d: { modelos?: Modelo[] }) => {
        if (vivo) setModelos(d.modelos ?? []);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [marcaId]);

  useEffect(() => {
    setAnio(0);
    setAnios([]);
    if (!modeloId) return;
    let vivo = true;
    fetch(`/api/catalogo/anios?modelo=${modeloId}`)
      .then((r) => r.json())
      .then((d: { rango?: { desde: number; hasta: number } | null }) => {
        if (!vivo || !d.rango) return;
        const lista: number[] = [];
        for (let a = d.rango.hasta; a >= d.rango.desde; a--) lista.push(a);
        setAnios(lista.slice(0, 60));
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [modeloId]);

  function buscar() {
    const marca = marcas.find((m) => m.id === marcaId);
    if (!marca) {
      router.push("/refacciones");
      return;
    }
    const partes: string[] = [slugificar(marca.linea)];
    const modelo = modelos.find((m) => m.id === modeloId);
    if (modelo) partes.push(slugificar(modelo.modelo));
    if (anio) partes.push(String(anio));
    const tipo = tipos.find((t) => t.id === parteId);
    if (tipo) partes.push(slugificar(tipo.parte));
    setBuscando(true);
    router.push(`/refacciones/${partes.join("/")}`);
  }

  /** El select cambia de peso al elegir: se ve de un vistazo qué ya filtraste. */
  const claseSelect = (elegido: boolean) =>
    clsx(
      "h-12 w-full min-w-0 rounded-lg border px-3 text-base text-tinta",
      "transition-colors duration-150",
      "disabled:cursor-not-allowed disabled:opacity-45",
      elegido
        ? "border-borde-fuerte bg-superficie font-semibold"
        : "border-borde bg-fondo"
    );

  return (
    <div>
      <form
        role="search"
        aria-label="Buscar refacción por vehículo"
        onSubmit={(e) => {
          e.preventDefault();
          buscar();
        }}
        className={clsx(
          "grid grid-cols-2 gap-2.5 rounded-xl border bg-superficie p-3",
          "md:grid-cols-[repeat(4,minmax(0,1fr))_auto]",
          tono === "oscuro"
            ? "border-white/10 shadow-flotante"
            : "border-borde shadow-carta"
        )}
      >
        <select
          aria-label="Marca"
          className={claseSelect(marcaId > 0)}
          value={marcaId}
          onChange={(e) => setMarcaId(Number(e.target.value))}
        >
          <option value={0}>Marca</option>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.linea}
            </option>
          ))}
        </select>

        <select
          aria-label="Modelo"
          className={claseSelect(modeloId > 0)}
          value={modeloId}
          onChange={(e) => setModeloId(Number(e.target.value))}
          disabled={!marcaId || modelos.length === 0}
        >
          <option value={0}>Modelo</option>
          {modelos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.modelo}
            </option>
          ))}
        </select>

        <select
          aria-label="Año"
          className={claseSelect(anio > 0)}
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          disabled={!modeloId || anios.length === 0}
        >
          <option value={0}>Año</option>
          {anios.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          aria-label="Tipo de pieza"
          className={claseSelect(parteId > 0)}
          value={parteId}
          onChange={(e) => setParteId(Number(e.target.value))}
        >
          <option value={0}>Tipo de pieza</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.parte}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={buscando}
          className={clsx(
            "col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-ambar px-6 md:col-span-1",
            "font-display text-sm font-bold uppercase tracking-wide text-grafito",
            "transition-colors duration-150 hover:bg-ambar-press hover:text-white",
            "disabled:opacity-60"
          )}
        >
          <Search aria-hidden className="size-4" />
          {buscando ? "Buscando…" : "Buscar mi pieza"}
        </button>
      </form>

      {!compacto && (
        <p
          className={clsx(
            "mt-3 px-1 text-sm",
            tono === "oscuro" ? "text-slate-400" : "text-tinta-suave"
          )}
        >
          ¿No sabes cómo se llama la pieza?{" "}
          <button
            type="button"
            onClick={() =>
              abrirChat("Hola, no sé cómo se llama la pieza que necesito. Te cuento: ")
            }
            className={clsx(
              "font-semibold underline-offset-4 hover:underline",
              tono === "oscuro" ? "text-white" : "text-tinta"
            )}
          >
            Cuéntaselo a Vico con tus palabras →
          </button>
        </p>
      )}
    </div>
  );
}
