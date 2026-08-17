import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FotoPieza } from "@/components/FotoPieza";

// Las zonas del golpe: los tipos de pieza que más se chocan, cada uno con una
// foto de muestra del catálogo real y el sinónimo regional entre paréntesis
// (facia/defensa, calavera/stop). Cada mosaico filtra el catálogo por tipo.
//
// Va sobre papel milimétrico: es la superficie donde se dibuja el despiece. La
// foto va a tamaño completo (nunca `&thumb=1`): las miniaturas del S3 pesan
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
    <section aria-labelledby="tipos-titulo" className="bg-papel">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-linea-fuerte pb-3">
          <h2
            id="tipos-titulo"
            className="rotulo-tecnico text-[clamp(1.15rem,2.6vw,1.5rem)] leading-none text-tinta"
          >
            ¿Qué se te rompió?
          </h2>
          <Link
            href="/refacciones"
            className="rotulo-tecnico inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[13px] text-tinta underline-offset-4 hover:underline"
          >
            Ver todo el catálogo
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((t) => (
            <Link
              key={t.id}
              href={`/refacciones?parte=${t.id}`}
              className="lamina lamina-enlace group flex flex-col overflow-hidden"
            >
              <FotoPieza
                src={
                  t.codigo
                    ? `/api/foto?codigo=${encodeURIComponent(t.codigo)}`
                    : null
                }
                alt={`${t.etiqueta} del catálogo de Autopartes Vidaurri`}
                className="mesa-dibujo aspect-[4/3] w-full border-b border-linea"
                imgClassName="p-2.5 transition-transform duration-150 group-hover:scale-105"
              />
              <span className="flex flex-1 items-center justify-between gap-2 px-3 py-2.5">
                <span className="min-w-0">
                  <span className="rotulo-tecnico block text-[13px] leading-tight text-tinta sm:text-sm">
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
