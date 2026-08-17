import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FotoPieza } from "@/components/FotoPieza";

// Mosaicos por tipo de pieza: los tipos que más se chocan, con una foto de
// muestra del catálogo real y el sinónimo regional entre paréntesis
// (facia/defensa, calavera/stop). Cada mosaico filtra el catálogo por tipo.
// La foto va a tamaño completo (nunca `&thumb=1`): las miniaturas del S3 pesan
// 2-5 KB y se ven pixeladas en cuanto pasan de ~120 px.

export interface MosaicoTipo {
  id: number;
  etiqueta: string;
  /** Código de artículo de muestra para la foto (null = sin foto, cae al fallback). */
  codigo: string | null;
}

export function MosaicosTipos({ items }: { items: MosaicoTipo[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="tipos-titulo" className="bg-fondo">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        {/* Encabezado de mostrador: un solo renglón con filete abajo. Nada de
            titular gigante: aquí lo que vende es la mercancía. */}
        <div className="flex items-baseline justify-between gap-4 border-b border-borde pb-2.5">
          <h2
            id="tipos-titulo"
            className="titulo-display text-xl text-tinta md:text-[1.375rem]"
          >
            Busca por tipo de pieza
          </h2>
          <Link
            href="/refacciones"
            className="inline-flex shrink-0 items-center gap-1.5 py-2 font-display text-sm font-bold uppercase tracking-wide text-tinta underline-offset-4 hover:underline"
          >
            Ver todo el catálogo
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((t) => (
            <Link
              key={t.id}
              href={`/refacciones?parte=${t.id}`}
              className="carta carta-enlace group flex flex-col overflow-hidden"
            >
              <FotoPieza
                src={
                  t.codigo
                    ? `/api/foto?codigo=${encodeURIComponent(t.codigo)}`
                    : null
                }
                alt={`${t.etiqueta} del catálogo de Autopartes Vidaurri`}
                className="trama-anaquel aspect-[4/3] w-full border-b border-borde"
                imgClassName="p-2.5 transition-transform duration-150 group-hover:scale-105"
              />
              <span className="flex flex-1 items-center justify-between gap-2 px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block font-display text-[13px] font-bold uppercase leading-tight tracking-wide text-tinta sm:text-sm">
                    {t.etiqueta}
                  </span>
                  <span className="mt-1 block text-[12px] leading-none text-tinta-suave">
                    Ver precios
                  </span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="size-4 shrink-0 text-tinta-suave transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-tinta"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
