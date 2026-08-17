"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Marca, Modelo, TipoParte } from "@/lib/catalogo";
import { slugificar } from "@/lib/slug";

// Filtros del catálogo de nuevas (rail de escritorio y <details> en móvil). Al
// aplicar navega a la URL semántica del contrato: /refacciones/marca/modelo/año/tipo
// por slug, con texto/existencia en el querystring (y `parte` como query solo
// cuando hay tipo elegido sin marca, porque el path exige marca primero).
//
// Los campos son casillas del cajetín: fondo de papel, filete de plano y la
// etiqueta rotulada arriba. 16px de tipo como mínimo: en iOS un campo más chico
// hace que el navegador se acerque solo, y aquí se llena con una mano.

export interface FiltrosIniciales {
  marcaId?: number;
  modeloId?: number;
  anio?: number;
  parteId?: number;
  texto?: string;
  soloExistencia?: boolean;
}

const CLASE_CAMPO =
  "h-12 w-full rounded-md border border-linea bg-papel px-3 text-base text-tinta transition-colors duration-150 hover:border-linea-fuerte focus:border-tinta disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-linea";

const CLASE_ETIQUETA =
  "mb-1.5 block font-display text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-tinta-suave";

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

  // Modelos de la marca elegida (también al montar con marca inicial). El
  // reset de modelo/año vive en los onChange, no aquí, para no pisar los
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

  const hayFiltros =
    marcaId > 0 ||
    modeloId > 0 ||
    anio > 0 ||
    parteId > 0 ||
    texto.trim() !== "" ||
    soloExistencia;

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
          <option value={0}>
            {marcaId ? "Todos los modelos" : "Elige marca primero"}
          </option>
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
          <option value={0}>
            {modeloId ? "Todos los años" : "Elige modelo primero"}
          </option>
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

      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-linea bg-papel px-3 py-3 text-sm font-semibold transition-colors duration-150 hover:border-linea-fuerte">
        <input
          type="checkbox"
          checked={soloExistencia}
          onChange={(e) => setSoloExistencia(e.target.checked)}
          className="size-4 accent-existencia"
        />
        Solo con existencia
      </label>

      <button
        type="submit"
        disabled={aplicando}
        className="rotulo-tecnico h-12 rounded-md bg-ambar px-5 text-sm text-plano-hondo transition-colors duration-150 hover:bg-ambar-press active:bg-ambar-press disabled:opacity-60"
      >
        {aplicando ? "Aplicando…" : "Aplicar filtros"}
      </button>

      {hayFiltros && (
        <Link
          href="/refacciones"
          className="inline-flex min-h-11 items-center justify-center text-[13px] font-semibold text-tinta-suave underline-offset-4 transition-colors duration-150 hover:text-tinta hover:underline"
        >
          Quitar todos los filtros
        </Link>
      )}
    </form>
  );
}
