"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Car,
  Search,
  Tag,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import type { Marca, Modelo, TipoParte } from "@/lib/catalogo";
import { slugificar } from "@/lib/slug";
import { abrirChat } from "@/components/BotonCotizar";

// Buscador Marca → Modelo → Año → Tipo de pieza (selects encadenados).
// Navega a la URL semántica del catálogo: /refacciones/nissan/versa/2016/faros.
// Modelos y años se pueblan bajo demanda desde /api/catalogo/*.
//
// Es el formulario del plano: lámina blanca, campos de escuadra y una sola
// acción en ámbar. Sobre el campo azul del hero es lo más brillante de la
// pantalla, porque es lo primero que hay que tocar.
//
// El ancho manda el reparto: la lámina se acomoda en 2×2 cuando vive en media
// portada y se estira a los cuatro campos en una línea cuando ocupa el ancho
// completo de una página interna. Lo decide el contenedor, no el viewport.

export function SelectorVehiculo({
  marcas,
  tipos,
  compacto = false,
  tono = "claro",
}: {
  marcas: Marca[];
  tipos: TipoParte[];
  /** Versión compacta para páginas internas (sin línea de rescate a Vico). */
  compacto?: boolean;
  /** "oscuro" cuando el buscador va sobre el campo azul de plano (el hero). */
  tono?: "claro" | "oscuro";
}) {
  const router = useRouter();
  const [marcaId, setMarcaId] = useState(0);
  const [modeloId, setModeloId] = useState(0);
  const [anio, setAnio] = useState(0);
  const [parteId, setParteId] = useState(0);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [anios, setAnios] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);
  const [falloRed, setFalloRed] = useState(false);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    setModeloId(0);
    setModelos([]);
    if (!marcaId) return;
    let vivo = true;
    setCargando(true);
    setFalloRed(false);
    fetch(`/api/catalogo/modelos?marca=${marcaId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { modelos?: Modelo[] }) => {
        if (vivo) setModelos(d.modelos ?? []);
      })
      .catch(() => {
        if (vivo) setFalloRed(true);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [marcaId]);

  useEffect(() => {
    setAnio(0);
    setAnios([]);
    if (!modeloId) return;
    let vivo = true;
    setCargando(true);
    setFalloRed(false);
    fetch(`/api/catalogo/anios?modelo=${modeloId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { rango?: { desde: number; hasta: number } | null }) => {
        if (!vivo || !d.rango) return;
        const lista: number[] = [];
        for (let a = d.rango.hasta; a >= d.rango.desde; a--) lista.push(a);
        setAnios(lista.slice(0, 60));
      })
      .catch(() => {
        if (vivo) setFalloRed(true);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
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

  /** El campo cambia de peso al elegir: se ve de un vistazo qué ya filtraste.
   *  Sobre la vitrina los campos son de cristal ahumado, no láminas blancas:
   *  el buscador es parte del panel oscuro, y lo único que brilla es el botón. */
  // El deshabilitado NO se comunica bajando la opacidad del texto: eso tiraba
  // el contraste a 3.6:1 en los campos del hero, que se leen a un brazo de
  // distancia y a pleno sol. El estado va en el borde y el fondo; la letra
  // conserva su contraste.
  // `pl-10`: el hueco del icono que va dentro del campo (ver <Campo/>).
  const claseCampo = (elegido: boolean) =>
    tono === "oscuro"
      ? clsx(
          "h-12 w-full min-w-0 appearance-none rounded-lg border pl-10 pr-8 text-base text-white",
          "transition-colors duration-150",
          "enabled:hover:border-ambar/60",
          "disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-black/20 disabled:text-white/70",
          elegido
            ? "border-ambar/55 bg-black/35 font-semibold"
            : "border-white/15 bg-black/25"
        )
      : clsx(
          "h-12 w-full min-w-0 appearance-none rounded-lg border pl-10 pr-8 text-base text-tinta",
          "transition-colors duration-150",
          "enabled:hover:border-linea-fuerte",
          "disabled:cursor-not-allowed disabled:border-linea disabled:bg-papel-hondo disabled:text-tinta-suave",
          elegido ? "border-linea-fuerte bg-hoja font-semibold" : "border-linea bg-papel"
        );

  /** Envuelve un select para meterle su icono a la izquierda y el chevron a la
   *  derecha, como los campos de la referencia. `appearance-none` mata la flecha
   *  nativa; sin el chevron propio el campo dejaría de leerse como desplegable. */
  const Campo = ({
    icono: Icono,
    children,
  }: {
    icono: LucideIcon;
    children: React.ReactNode;
  }) => (
    <span className="relative block min-w-0">
      <Icono
        aria-hidden
        className={clsx(
          "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2",
          tono === "oscuro" ? "text-white/55" : "text-tinta-suave"
        )}
      />
      {children}
      <span
        aria-hidden
        className={clsx(
          "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]",
          tono === "oscuro" ? "text-white/55" : "text-tinta-suave"
        )}
      >
        ▼
      </span>
    </span>
  );

  // Vacío y error son estados distintos: "sin modelos" es un dato real de la
  // base; si la lista no llegó, lo explica el aviso rojo de abajo.
  const modeloVacio = marcaId > 0 && !cargando && !falloRed && modelos.length === 0;
  const anioVacio = modeloId > 0 && !cargando && !falloRed && anios.length === 0;

  return (
    <div className="@container">
      <form
        role="search"
        aria-label="Buscar refacción por vehículo"
        onSubmit={(e) => {
          e.preventDefault();
          buscar();
        }}
        className={clsx(
          "grid grid-cols-2 gap-2.5 rounded-md border p-3",
          "@2xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]",
          tono === "oscuro"
            ? "panel-vitrina border-white/15 shadow-flotante"
            : "border-linea bg-hoja shadow-lamina"
        )}
      >
        <Campo icono={Car}>
          <select
            aria-label="Marca"
            className={claseCampo(marcaId > 0)}
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
        </Campo>

        <Campo icono={Tag}>
          <select
            aria-label="Modelo"
            className={claseCampo(modeloId > 0)}
            value={modeloId}
            onChange={(e) => setModeloId(Number(e.target.value))}
            disabled={!marcaId || modelos.length === 0}
          >
            <option value={0}>
              {cargando && !modelos.length
                ? "Cargando…"
                : modeloVacio
                  ? "Sin modelos"
                  : "Modelo"}
            </option>
            {modelos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.modelo}
              </option>
            ))}
          </select>
        </Campo>

        <Campo icono={CalendarDays}>
          <select
            aria-label="Año"
            className={claseCampo(anio > 0)}
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            disabled={!modeloId || anios.length === 0}
          >
            <option value={0}>
              {cargando && modeloId > 0 && !anios.length
                ? "Cargando…"
                : anioVacio
                  ? "Sin años"
                  : "Año"}
            </option>
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Campo>

        <Campo icono={Wrench}>
          <select
            aria-label="Tipo de pieza"
            className={claseCampo(parteId > 0)}
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
        </Campo>

        <button
          type="submit"
          disabled={buscando}
          className={clsx(
            "boton-metal-plata col-span-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-6 @2xl:col-span-1",
            "disabled:opacity-70"
          )}
        >
          {buscando ? "BUSCANDO…" : "BUSCAR MI PIEZA"}
        </button>

        {/* La lista puede no llegar: la refaccionaria no se queda muda. */}
        {falloRed && (
          <p
            role="status"
            className="col-span-full flex items-start gap-1.5 text-[13px] leading-snug text-anotacion"
          >
            <TriangleAlert aria-hidden className="mt-px size-4 shrink-0" />
            <span>
              No cargó la lista. Busca solo por marca o cuéntale tu auto a Vico.
            </span>
          </p>
        )}
      </form>

      {!compacto && (
        <div className="mt-3 px-1">
          <button
            type="button"
            onClick={() =>
              abrirChat(
                "Hola, no sé cómo se llama la pieza que necesito. Te cuento: "
              )
            }
            className={clsx(
              "inline-flex min-h-11 items-center gap-1.5 text-left text-sm font-semibold underline-offset-4 hover:underline",
              tono === "oscuro" ? "text-ambar" : "text-tinta"
            )}
          >
            ¿No sabes cómo se llama la pieza? Cuéntaselo a Vico
            <ArrowRight aria-hidden className="size-4 shrink-0" />
          </button>
          <p
            className={clsx(
              "text-[13px] leading-snug",
              tono === "oscuro" ? "text-slate-300" : "text-tinta-suave"
            )}
          >
            Descríbela con tus palabras y te contesta en el chat, aquí mismo.
          </p>
        </div>
      )}
    </div>
  );
}
