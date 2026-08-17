"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Marca, Modelo, TipoParte } from "@/lib/catalogo";
import { slugificar } from "@/lib/slug";

// Filtros del catalogo de nuevas (rail desktop y <details> movil). Al aplicar
// navega a la URL semantica del contrato: /refacciones/marca/modelo/año/tipo
// por slug, con texto/existencia en el querystring (y `parte` como query solo
// cuando hay tipo elegido sin marca, porque el path exige marca primero).

export interface FiltrosIniciales {
  marcaId?: number;
  modeloId?: number;
  anio?: number;
  parteId?: number;
  texto?: string;
  soloExistencia?: boolean;
}

const CLASE_CAMPO =
  "h-12 w-full rounded-lg border border-borde bg-fondo px-3 text-base text-tinta transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45";
const CLASE_ETIQUETA = "rotulo mb-1.5 block text-tinta-suave";

export function PanelFiltros({
  marcas,
  tipos,
  iniciales = {},
}: {
  marcas: Marca[];
  tipos: TipoParte[];
  iniciales?: FiltrosIniciales;
}) {
  const router = useRouter();
  const [marcaId, setMarcaId] = useState(iniciales.marcaId ?? 0);
  const [modeloId, setModeloId] = useState(iniciales.modeloId ?? 0);
  const [anio, setAnio] = useState(iniciales.anio ?? 0);
  const [parteId, setParteId] = useState(iniciales.parteId ?? 0);
  const [texto, setTexto] = useState(iniciales.texto ?? "");
  const [soloExistencia, setSoloExistencia] = useState(
    iniciales.soloExistencia ?? false
  );
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [anios, setAnios] = useState<number[]>([]);
  const [aplicando, setAplicando] = useState(false);

  // Modelos de la marca elegida (tambien al montar con marca inicial). El
  // reset de modelo/año vive en los onChange, no aqui, para no pisar los
  // valores iniciales que llegan de la URL.
  useEffect(() => {
    if (!marcaId) {
      setModelos([]);
      return;
    }
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
    if (!modeloId) {
      setAnios([]);
      return;
    }
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

  function aplicar() {
    const seg: string[] = [];
    const marca = marcas.find((m) => m.id === marcaId);
    const tipo = tipos.find((t) => t.id === parteId);
    if (marca) {
      seg.push(slugificar(marca.linea));
      const modelo = modelos.find((m) => m.id === modeloId);
      if (modelo) seg.push(slugificar(modelo.modelo));
      if (anio) seg.push(String(anio));
      if (tipo) seg.push(slugificar(tipo.parte));
    }
    const query = new URLSearchParams();
    const libre = texto.trim();
    if (libre) query.set("texto", libre);
    if (!marca && tipo) query.set("parte", String(tipo.id));
    if (soloExistencia) query.set("existencia", "1");
    const qs = query.toString();
    setAplicando(true);
    router.push(
      `/refacciones${seg.length ? `/${seg.join("/")}` : ""}${qs ? `?${qs}` : ""}`
    );
  }

  return (
    <form
      aria-label="Filtros del catálogo"
      onSubmit={(e) => {
        e.preventDefault();
        aplicar();
      }}
      className="flex flex-col gap-3.5"
    >
      <label className="block">
        <span className={CLASE_ETIQUETA}>Búsqueda libre</span>
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Nombre o número de parte"
          maxLength={80}
          className={CLASE_CAMPO}
        />
      </label>

      <label className="block">
        <span className={CLASE_ETIQUETA}>Marca</span>
        <select
          value={marcaId}
          onChange={(e) => {
            setMarcaId(Number(e.target.value));
            setModeloId(0);
            setAnio(0);
          }}
          className={CLASE_CAMPO}
        >
          <option value={0}>Todas las marcas</option>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.linea}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={CLASE_ETIQUETA}>Modelo</span>
        <select
          value={modeloId}
          onChange={(e) => {
            setModeloId(Number(e.target.value));
            setAnio(0);
          }}
          disabled={!marcaId || modelos.length === 0}
          className={CLASE_CAMPO}
        >
          <option value={0}>Todos los modelos</option>
          {modelos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.modelo}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={CLASE_ETIQUETA}>Año</span>
        <select
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          disabled={!modeloId || anios.length === 0}
          className={CLASE_CAMPO}
        >
          <option value={0}>Todos los años</option>
          {anios.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={CLASE_ETIQUETA}>Tipo de pieza</span>
        <select
          value={parteId}
          onChange={(e) => setParteId(Number(e.target.value))}
          className={CLASE_CAMPO}
        >
          <option value={0}>Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.parte}
            </option>
          ))}
        </select>
      </label>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-borde bg-fondo px-3 py-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={soloExistencia}
          onChange={(e) => setSoloExistencia(e.target.checked)}
          className="size-4 accent-exito"
        />
        Solo con existencia
      </label>

      <button
        type="submit"
        disabled={aplicando}
        className="h-12 rounded-lg bg-ambar px-5 font-display text-sm font-bold uppercase tracking-wide text-grafito transition-colors duration-150 hover:bg-ambar-press hover:text-white disabled:opacity-60"
      >
        {aplicando ? "Aplicando…" : "Aplicar filtros"}
      </button>
    </form>
  );
}
