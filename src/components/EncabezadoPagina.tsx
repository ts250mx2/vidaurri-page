import { Migas, type Miga } from "@/components/Migas";

// EL CAJETÍN de la lámina: la banda con la que abren todas las páginas
// internas. Campo azul de plano con la retícula milimétrica, las migas y el
// número de documento arriba —el renglón de identificación de la hoja— y
// debajo el H1 rotulado. Que todas las páginas abran igual es lo que hace que
// el sitio se lea como un solo objeto y no como una suma de plantillas.
//
// Sin etiqueta-rótulo sobre el H1: el título carga solo. La prop `rotulo`
// sigue declarada para no romper a quien todavía la pasa, pero no se renderiza.

export function EncabezadoPagina({
  titulo,
  descripcion,
  migas,
  documento,
  children,
}: {
  /** Ignorada. Resto del mundo anterior; ya no se renderiza. */
  rotulo?: string;
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  migas?: Miga[];
  /** Número de documento del cajetín (ej. "Lámina 04 · Usadas"). Opcional. */
  documento?: string;
  /** Cifras, CTAs o filtros que van dentro de la banda. */
  children?: React.ReactNode;
}) {
  const listaMigas = migas ?? [];
  const hayMigas = listaMigas.length > 0;

  return (
    <section className="sobre-plano relative isolate overflow-hidden bg-plano-hondo text-white">

      <div className="relative mx-auto max-w-6xl px-4 py-10 md:py-14">
        {(hayMigas || documento) && (
          <div className="mb-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/15 pb-4">
            {hayMigas && <Migas items={listaMigas} tono="oscuro" />}
            {documento && (
              <span className="num-tab ml-auto font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
                {documento}
              </span>
            )}
          </div>
        )}

        <h1 className="titulo-lamina max-w-4xl text-[clamp(2.1rem,5.5vw,3.6rem)]">
          {titulo}
        </h1>

        {descripcion && (
          <p className="mt-5 max-w-[65ch] text-[15px] leading-relaxed text-white/75">
            {descripcion}
          </p>
        )}

        {children}
      </div>
    </section>
  );
}
