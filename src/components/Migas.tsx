import Link from "next/link";
import { ChevronRight } from "lucide-react";
import clsx from "clsx";

// Migas de pan del sitio. El último elemento nunca es enlace (es la página
// actual) y se marca con aria-current. El tono "oscuro" es el de los
// encabezados grafito de las páginas internas.

export interface Miga {
  nombre: string;
  /** Sin href = página actual. */
  href?: string;
}

export function Migas({
  items,
  tono = "claro",
  className,
}: {
  items: Miga[];
  tono?: "claro" | "oscuro";
  className?: string;
}) {
  if (items.length === 0) return null;
  const oscuro = tono === "oscuro";

  return (
    <nav aria-label="Migas de pan" className={className}>
      <ol
        className={clsx(
          "flex flex-wrap items-center gap-x-1 gap-y-1 text-[13px]",
          oscuro ? "text-slate-400" : "text-tinta-suave"
        )}
      >
        {items.map((m, i) => {
          const ultima = i === items.length - 1;
          return (
            <li key={`${m.nombre}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 && (
                <ChevronRight
                  aria-hidden
                  className="size-3.5 shrink-0 opacity-60"
                />
              )}
              {ultima || !m.href ? (
                <span
                  aria-current={ultima ? "page" : undefined}
                  className={clsx(
                    "max-w-[36ch] truncate font-semibold",
                    oscuro ? "text-white" : "text-tinta"
                  )}
                >
                  {m.nombre}
                </span>
              ) : (
                <Link
                  href={m.href}
                  className={clsx(
                    "truncate underline-offset-4 transition-colors duration-150 hover:underline",
                    oscuro ? "hover:text-white" : "hover:text-tinta"
                  )}
                >
                  {m.nombre}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
