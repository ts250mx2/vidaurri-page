import { Migas, type Miga } from "@/components/Migas";

// Encabezado grafito de las páginas internas. Es la versión corta del hero de
// la home: misma banda, misma retícula, mismo H1 en Barlow. Que todas las
// páginas abran igual es lo que hace que el sitio se lea como un solo objeto y
// no como una suma de plantillas.

export function EncabezadoPagina({
  rotulo,
  titulo,
  descripcion,
  migas,
  children,
}: {
  /** Etiqueta chica sobre el H1 (ej. "Catálogo"). */
  rotulo: string;
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  migas?: Miga[];
  /** Cifras, CTAs o filtros que van dentro de la banda. */
  children?: React.ReactNode;
}) {
  return (
    <section className="sobre-grafito relative isolate overflow-hidden bg-grafito-hondo text-white">
      <span
        aria-hidden
        className="trama-rejilla-oscura absolute inset-0 opacity-70"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-9 md:py-12">
        {migas && migas.length > 0 && (
          <Migas items={migas} tono="oscuro" className="mb-5" />
        )}

        <p className="flex items-center gap-2.5">
          <span aria-hidden className="h-px w-7 shrink-0 bg-white/35" />
          <span className="rotulo text-white/70">{rotulo}</span>
        </p>

        <h1 className="titulo-cartel mt-3 max-w-4xl text-[clamp(2.1rem,5.5vw,3.6rem)]">
          {titulo}
        </h1>

        {descripcion && (
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-300">
            {descripcion}
          </p>
        )}

        {children}
      </div>
    </section>
  );
}
