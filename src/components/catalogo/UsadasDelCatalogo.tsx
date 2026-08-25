import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buscarPiezasUsadas } from "@/lib/usadas";
import { raizParte } from "@/lib/texto";
import { TituloSeccion } from "@/components/TituloSeccion";
import { TarjetaUsada } from "@/components/TarjetaUsada";

// Franja de la Bodega Usado dentro del catálogo de nuevas: la misma búsqueda
// que el cliente ya hizo (texto, marca, modelo, tipo, año) se cruza contra las
// piezas usadas y, si hay coincidencias, se ofrecen abajo de los resultados.
// La Bodega es remota y puede fallar: cualquier error loguea y la franja
// pinta el `respaldo` (o desaparece) sin tocar el resto de la página (regla
// dura #5). Con `sinNuevas`, la franja ES el resultado de la búsqueda: cambia
// el copy y solo si la Bodega tampoco tiene nada se pinta el `respaldo`
// (el cuadro de rescate), para no dar un "no la encontramos" junto a piezas
// que sí aparecieron.

const MAX_TARJETAS = 4;

export async function UsadasDelCatalogo({
  texto,
  marca,
  modelo,
  tipoParte,
  anio,
  sinNuevas = false,
  respaldo = null,
}: {
  texto?: string;
  marca?: string;
  modelo?: string;
  tipoParte?: string;
  anio?: number;
  /** true cuando el catálogo de nuevas quedó en cero: la franja habla como
   *  resultado principal, no como "también". */
  sinNuevas?: boolean;
  /** Qué pintar cuando la Bodega no tiene coincidencias o no responde. */
  respaldo?: React.ReactNode;
}) {
  const termino = [texto, tipoParte && raizParte(tipoParte), marca, modelo]
    .filter(Boolean)
    .join(" ")
    .trim();

  // Sin búsqueda ni filtros no hay nada que cruzar (el catálogo completo no
  // es una búsqueda; las usadas ya tienen su propia sección en /usadas).
  if (!termino) return respaldo;

  let resultado: Awaited<ReturnType<typeof buscarPiezasUsadas>>;
  try {
    resultado = await buscarPiezasUsadas({
      texto: termino,
      anio,
      pageSize: MAX_TARJETAS,
    });
  } catch (error) {
    console.error("Bodega Usado sin respuesta en la búsqueda del catálogo:", error);
    return respaldo;
  }
  if (resultado.total === 0) return respaldo;

  const query = new URLSearchParams({ texto: termino });
  if (anio) query.set("anio", String(anio));
  const hrefTodas = `/usadas?${query.toString()}`;

  const conteo =
    resultado.total === 1
      ? "Encontramos 1 pieza usada que cruza con tu búsqueda. Es única y la foto es de la pieza exacta que te llevas."
      : `Encontramos ${resultado.total.toLocaleString("es-MX")} piezas usadas que cruzan con tu búsqueda. Cada una es única y la foto es de la pieza exacta que te llevas.`;

  return (
    <section
      aria-labelledby="usadas-catalogo-titulo"
      className={sinNuevas ? undefined : "mt-10 md:mt-12"}
    >
      <TituloSeccion
        titulo={
          <span id="usadas-catalogo-titulo">
            {sinNuevas
              ? "En la Bodega de Usado sí la tenemos"
              : "También en la Bodega de Usado"}
          </span>
        }
        descripcion={sinNuevas ? `En piezas nuevas no apareció, pero ${conteo.charAt(0).toLowerCase()}${conteo.slice(1)}` : conteo}
        accion={
          <Link
            href={hrefTodas}
            className="rotulo-tecnico inline-flex min-h-11 items-center gap-1.5 text-[13px] text-tinta underline-offset-4 hover:underline"
          >
            Ver todas en usadas
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        }
      />

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {/* Sin `indice`: la franja va abajo de los resultados, sus fotos
            pueden esperar a que el usuario llegue ahí. */}
        {resultado.piezas.slice(0, MAX_TARJETAS).map((p) => (
          <TarjetaUsada key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
