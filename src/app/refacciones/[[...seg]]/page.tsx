import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import {
  buscarProductos,
  listarMarcas,
  listarModelosDeMarca,
  listarTiposParte,
  type Marca,
  type Modelo,
  type TipoParte,
} from "@/lib/catalogo";
import { porSlug, slugificar } from "@/lib/slug";
import { urlSitio } from "@/config/negocio";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import { PanelFiltros } from "@/components/catalogo/PanelFiltros";
import { Paginacion } from "@/components/catalogo/Paginacion";
import { PillVehiculo } from "@/components/catalogo/PillVehiculo";
import { SinResultados } from "@/components/catalogo/SinResultados";

// Catalogo de refacciones NUEVAS con URLs semanticas (contrato del catalogo):
// /refacciones/[[...seg]] con segmentos opcionales marca/modelo/año/tipo por
// slug + querystring texto/parte/pagina/existencia. El path manda sobre el
// query cuando se duplican. Segmento irreconocible -> notFound().

interface PropsCatalogo {
  params: Promise<{ seg?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface EstadoCatalogo {
  marcas: Marca[];
  tipos: TipoParte[];
  marca?: Marca;
  modelo?: Modelo;
  anio?: number;
  tipo?: TipoParte;
  /** true si el tipo vino en el path (y no por ?parte=). */
  tipoEnPath: boolean;
  texto?: string;
  soloExistencia: boolean;
  pagina: number;
  /** Path semántico canónico sin querystring. */
  rutaBase: string;
  /** Querystring a conservar en paginación (sin `pagina`). */
  query: Record<string, string>;
}

function uno(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function decodificar(seg: string): string {
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
}

/** "FACIAS DELANTERAS" -> "Facias Delanteras" (para títulos y migas). */
function enTitulo(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/\p{L}+/gu, (palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1));
}

/** Sinónimo regional del tipo de parte (regla dura #4 de SEO). */
function sinonimoDeTipo(parte: string): string | null {
  const s = slugificar(parte);
  if (s.startsWith("facia")) return "defensa";
  if (s.startsWith("defensa")) return "facia";
  if (s.startsWith("calavera")) return "stop";
  if (s.startsWith("stop")) return "calavera";
  if (s.startsWith("cofre")) return "capó";
  if (s.startsWith("capo")) return "cofre";
  if (s.startsWith("salpicadera")) return "aleta";
  if (s.startsWith("aleta")) return "salpicadera";
  return null;
}

/** JSON-LD seguro dentro de <script>: escapa `<` para evitar cierre inyectado. */
function jsonLdSeguro(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}

/** Resuelve segmentos del path + querystring contra el catálogo real. */
async function resolverFiltros(props: PropsCatalogo): Promise<EstadoCatalogo> {
  const [{ seg = [] }, sp] = await Promise.all([props.params, props.searchParams]);
  const [marcas, tipos] = await Promise.all([listarMarcas(), listarTiposParte()]);

  let marca: Marca | undefined;
  let modelo: Modelo | undefined;
  let anio: number | undefined;
  let tipo: TipoParte | undefined;

  if (seg.length > 0) {
    // seg[0] SIEMPRE debe ser una marca; si no matchea, 404.
    marca = porSlug(marcas, decodificar(seg[0]), (m) => m.linea);
    if (!marca) notFound();

    const modelos = await listarModelosDeMarca(marca.id);
    // Los demás segmentos aceptan cualquier orden: año (4 dígitos), modelo o
    // tipo de parte. Lo irreconocible corta con 404.
    for (const crudo of seg.slice(1)) {
      const s = decodificar(crudo);
      if (!anio && /^\d{4}$/.test(s)) {
        anio = Number(s);
        continue;
      }
      const m = !modelo ? porSlug(modelos, s, (x) => x.modelo) : undefined;
      if (m) {
        modelo = m;
        continue;
      }
      const t = !tipo ? porSlug(tipos, s, (x) => x.parte) : undefined;
      if (t) {
        tipo = t;
        continue;
      }
      notFound();
    }
  }
  const tipoEnPath = Boolean(tipo);

  const texto = (uno(sp.texto) ?? "").trim().slice(0, 80) || undefined;
  const soloExistencia = uno(sp.existencia) === "1";
  const pagina = Math.max(1, Math.trunc(Number(uno(sp.pagina)) || 1));

  // El path manda: ?parte= solo aplica cuando el path no fijó tipo.
  if (!tipo) {
    const idParte = Number(uno(sp.parte)) || 0;
    if (Number.isInteger(idParte) && idParte > 0) {
      tipo = tipos.find((t) => t.id === idParte);
    }
  }

  // Path canónico (reordena segmentos al orden del contrato).
  const segCanon: string[] = [];
  if (marca) segCanon.push(slugificar(marca.linea));
  if (modelo) segCanon.push(slugificar(modelo.modelo));
  if (anio) segCanon.push(String(anio));
  if (tipo && tipoEnPath) segCanon.push(slugificar(tipo.parte));
  const rutaBase = `/refacciones${segCanon.length ? `/${segCanon.join("/")}` : ""}`;

  const query: Record<string, string> = {};
  if (texto) query.texto = texto;
  if (tipo && !tipoEnPath) query.parte = String(tipo.id);
  if (soloExistencia) query.existencia = "1";

  return {
    marcas,
    tipos,
    marca,
    modelo,
    anio,
    tipo,
    tipoEnPath,
    texto,
    soloExistencia,
    pagina,
    rutaBase,
    query,
  };
}

export async function generateMetadata(props: PropsCatalogo): Promise<Metadata> {
  const f = await resolverFiltros(props);
  const partes = [
    f.tipo && enTitulo(f.tipo.parte),
    f.marca && enTitulo(f.marca.linea),
    f.modelo && enTitulo(f.modelo.modelo),
    f.anio,
  ].filter(Boolean);

  const title = partes.length
    ? `Refacciones ${partes.join(" ")} | Precio con IVA | Autopartes Vidaurri Monterrey`
    : "Catálogo de refacciones de colisión | Precio con IVA | Autopartes Vidaurri Monterrey";

  let description: string;
  if (f.tipo) {
    const sinonimo = sinonimoDeTipo(f.tipo.parte);
    description = `${partes.join(" ")} con precio con IVA incluido.${
      sinonimo ? ` También le dicen ${sinonimo}.` : ""
    } Refacción nueva o usada en Monterrey: cotiza por chat o WhatsApp y recógela hoy si hay existencia.`;
  } else if (f.marca) {
    description = `Refacciones de colisión ${partes.join(" ")} nuevas y usadas: facias, cofres, faros, calaveras y salpicaderas con precio con IVA incluido. Cotiza por chat o WhatsApp y recoge en Monterrey.`;
  } else {
    description =
      "Catálogo de refacciones de colisión nuevas y usadas: facias, cofres, faros, calaveras y salpicaderas. Precio con IVA incluido. Cotiza por chat o WhatsApp y recoge en Monterrey.";
  }

  // `absolute` evita duplicar la marca con el template del layout.
  return { title: { absolute: title }, description };
}

export default async function PaginaCatalogo(props: PropsCatalogo) {
  const f = await resolverFiltros(props);

  const resultado = await buscarProductos({
    texto: f.texto,
    idLinea: f.marca?.id,
    idModelo: f.modelo?.id,
    idParte: f.tipo?.id,
    anio: f.anio,
    soloExistencia: f.soloExistencia,
    page: f.pagina,
  });
  const totalPaginas = Math.max(1, Math.ceil(resultado.total / resultado.pageSize));

  // Migas de pan (visibles + JSON-LD): Inicio / Refacciones / Marca / Modelo /
  // Año / Tipo. Solo entra a las migas lo que forma parte del path.
  const migas: Array<{ nombre: string; href: string }> = [
    { nombre: "Inicio", href: "/" },
    { nombre: "Refacciones", href: "/refacciones" },
  ];
  const acumulado: string[] = [];
  const agregarMiga = (nombre: string, slug: string) => {
    acumulado.push(slug);
    migas.push({ nombre, href: `/refacciones/${acumulado.join("/")}` });
  };
  if (f.marca) agregarMiga(enTitulo(f.marca.linea), slugificar(f.marca.linea));
  if (f.modelo) agregarMiga(enTitulo(f.modelo.modelo), slugificar(f.modelo.modelo));
  if (f.anio) agregarMiga(String(f.anio), String(f.anio));
  if (f.tipo && f.tipoEnPath) agregarMiga(enTitulo(f.tipo.parte), slugificar(f.tipo.parte));

  const base = urlSitio();
  const jsonLdMigas = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: migas.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.nombre,
      item: `${base}${m.href}`,
    })),
  };
  const jsonLdLista =
    resultado.productos.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          numberOfItems: resultado.total,
          itemListElement: resultado.productos.map((p, i) => ({
            "@type": "ListItem",
            position: (resultado.page - 1) * resultado.pageSize + i + 1,
            name: p.descripcion,
            url: `${base}/pieza/${encodeURIComponent(p.codigo)}`,
          })),
        }
      : null;

  // H1 con las partes que existen; sin filtros, el genérico del catálogo.
  const partesTitulo = [
    f.tipo && enTitulo(f.tipo.parte),
    f.marca && enTitulo(f.marca.linea),
    f.modelo && enTitulo(f.modelo.modelo),
    f.anio,
  ].filter(Boolean);
  const h1 = partesTitulo.length
    ? `Refacciones ${partesTitulo.join(" ")}`
    : "Catálogo de refacciones de colisión";

  const etiquetaVehiculo = f.marca
    ? [enTitulo(f.marca.linea), f.modelo && enTitulo(f.modelo.modelo), f.anio]
        .filter(Boolean)
        .join(" ")
    : "";

  // Conteo bajo el H1 solo cuando no hay pill (la pill ya lo trae); la
  // búsqueda libre siempre se refleja para que el usuario vea qué filtró.
  const lineaResultados = [
    !f.marca
      ? resultado.total === 1
        ? "1 pieza encontrada"
        : `${resultado.total.toLocaleString("es-MX")} piezas encontradas`
      : "",
    f.texto ? `resultados para “${f.texto}”` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const termino =
    [
      f.texto,
      f.tipo && enTitulo(f.tipo.parte),
      f.marca && enTitulo(f.marca.linea),
      f.modelo && enTitulo(f.modelo.modelo),
      f.anio,
    ]
      .filter(Boolean)
      .join(" ") || "una refacción de colisión";

  const iniciales = {
    marcaId: f.marca?.id,
    modeloId: f.modelo?.id,
    anio: f.anio,
    parteId: f.tipo?.id,
    texto: f.texto,
    soloExistencia: f.soloExistencia,
  };
  // Remonta los paneles cuando cambian los filtros de la URL (migas, pill ✕…)
  // para que los selects no se queden con una selección vieja.
  const clavePanel = `${f.marca?.id ?? 0}-${f.modelo?.id ?? 0}-${f.anio ?? 0}-${
    f.tipo?.id ?? 0
  }-${f.texto ?? ""}-${f.soloExistencia ? 1 : 0}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdSeguro(jsonLdMigas) }}
      />
      {jsonLdLista && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdSeguro(jsonLdLista) }}
        />
      )}

      {f.marca && <PillVehiculo etiqueta={etiquetaVehiculo} total={resultado.total} />}

      <EncabezadoPagina
        titulo={h1}
        migas={migas}
        documento={
          totalPaginas > 1
            ? `Hoja ${resultado.page} de ${totalPaginas}`
            : undefined
        }
      >
        {lineaResultados && (
          <p className="num-tab mt-4 text-sm text-white/70">{lineaResultados}</p>
        )}
      </EncabezadoPagina>

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="flex items-start gap-6">
          {/* Rail de filtros: solo escritorio, fijo bajo el header (y el
              renglón de vehículo, cuando lo hay). */}
          <aside
            aria-label="Filtros del catálogo"
            className={`hidden w-64 shrink-0 self-start lg:sticky lg:block ${
              f.marca ? "lg:top-[172px]" : "lg:top-[120px]"
            }`}
          >
            <div className="lamina p-5">
              <h2 className="rotulo-tecnico text-[13px] text-tinta-suave">
                Filtra el catálogo
              </h2>
              <div className="mt-4">
                <PanelFiltros
                  key={clavePanel}
                  marcas={f.marcas}
                  tipos={f.tipos}
                  iniciales={iniciales}
                />
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {/* Móvil: mismos filtros en un colapsable arriba de los resultados. */}
            <details className="lamina mb-5 lg:hidden">
              <summary className="rotulo-tecnico flex min-h-12 cursor-pointer select-none items-center gap-2 px-4 py-3.5 text-sm">
                <SlidersHorizontal aria-hidden className="size-4" />
                Filtrar resultados
              </summary>
              <div className="border-t border-linea p-4">
                <PanelFiltros
                  key={clavePanel}
                  marcas={f.marcas}
                  tipos={f.tipos}
                  iniciales={iniciales}
                />
              </div>
            </details>

            {resultado.productos.length > 0 ? (
              <>
                {/* El listado necesita su propio encabezado para que el orden
                    h1 → h2 → h3 de las fichas no se salte un nivel. */}
                <h2 className="sr-only">Partidas del catálogo</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                  {resultado.productos.map((p) => (
                    <TarjetaProducto key={p.codigo} p={p} />
                  ))}
                </div>
                <Paginacion
                  pagina={resultado.page}
                  totalPaginas={totalPaginas}
                  rutaBase={f.rutaBase}
                  query={f.query}
                />
              </>
            ) : (
              <SinResultados termino={termino} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
