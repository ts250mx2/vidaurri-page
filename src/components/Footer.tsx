import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { MarcaAV } from "@/components/LogoAV";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { NEGOCIO, urlWhatsApp, PRELLENADOS } from "@/config/negocio";
import { listarMarcasSurtidas } from "@/lib/catalogo";
import { slugificar } from "@/lib/slug";

// El footer es el CAJETÍN de la lámina: el bloque de datos de la esquina de un
// plano. Primero quién emite el documento (razón social, plaza, facturación),
// después el índice de contenidos (marcas y secciones) y el contacto de la
// casa. Campo azul con papel milimétrico oscuro, renglones de regla y ni un
// gramo de ámbar: aquí lo único que se convierte es el botón de WhatsApp.
//
// Server component: las marcas salen del catálogo real (cacheadas) y si la
// consulta falla el cajetín se dibuja igual, con su salida al catálogo.

const MARCAS_TOP = 10;

const CLASE_ENLACE =
  "text-white/70 transition-colors duration-150 hover:text-white";

const CLASE_TITULO_COLUMNA = "rotulo-tecnico text-[12px] text-white/60";

/** Datos del emisor, tal como se rotulan en el cajetín de un plano. Todos
 *  salen de `negocio.ts` o son afirmaciones firmes del negocio. */
const CAJETIN: ReadonlyArray<readonly [string, string]> = [
  ["Emite", NEGOCIO.razonSocial],
  ["Plaza", NEGOCIO.ciudad],
  ["Facturación", "CFDI 4.0"],
];

export async function Footer() {
  // Surtidas y por volumen, no las 48 líneas del catálogo: enlazar marcas sin
  // una sola pieza manda al cliente (y al buscador) a un listado vacío.
  const marcas = await listarMarcasSurtidas().catch(() => []);
  const marcasVisibles = marcas.slice(0, MARCAS_TOP);

  return (
    <footer className="sobre-plano relative isolate overflow-hidden border-t border-linea-fuerte bg-plano-hondo text-white">

      <div className="relative mx-auto max-w-6xl px-4">
        {/* Renglón del emisor */}
        <div className="grid gap-x-10 gap-y-8 border-b border-white/15 py-11 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <MarcaAV lado={40} />
            <p className="mt-5 max-w-[58ch] text-sm leading-relaxed text-white/75">
              {NEGOCIO.experiencia} surtiendo la hojalatería de Monterrey:
              refacciones de colisión nuevas y usadas, con factura.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            {CAJETIN.map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt className={CLASE_TITULO_COLUMNA}>{rotulo}</dt>
                <dd className="mt-1 max-w-[24ch] text-[13px] leading-snug text-white/85">
                  {valor}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Renglón del índice */}
        <div className="grid gap-x-10 gap-y-10 py-11 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr]">
          <nav aria-label="Marcas">
            <h2 className={CLASE_TITULO_COLUMNA}>Refacciones por marca</h2>
            {marcasVisibles.length > 0 ? (
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {marcasVisibles.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/refacciones/${slugificar(m.linea)}`}
                      className={CLASE_ENLACE}
                    >
                      {m.linea}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/refacciones"
                    className="font-semibold text-white underline-offset-4 hover:underline"
                  >
                    Ver todas
                  </Link>
                </li>
              </ul>
            ) : (
              <p className="mt-4 max-w-[36ch] text-sm leading-relaxed text-white/70">
                <Link
                  href="/refacciones"
                  className="font-semibold text-white underline-offset-4 hover:underline"
                >
                  Abre el catálogo
                </Link>{" "}
                para ver las marcas con piezas en existencia.
              </p>
            )}
          </nav>

          <nav aria-label="Sitio">
            <h2 className={CLASE_TITULO_COLUMNA}>Sitio</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/refacciones" className={CLASE_ENLACE}>Catálogo de refacciones</Link></li>
              <li><Link href="/usadas" className={CLASE_ENLACE}>Piezas usadas con foto real</Link></li>
              <li><Link href="/mayoreo" className={CLASE_ENLACE}>Mayoreo para talleres</Link></li>
              <li><Link href="/nosotros" className={CLASE_ENLACE}>Nosotros</Link></li>
              <li><Link href="/sucursales" className={CLASE_ENLACE}>Sucursales</Link></li>
              <li><Link href="/aviso-de-privacidad" className={CLASE_ENLACE}>Aviso de privacidad</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className={CLASE_TITULO_COLUMNA}>Contacto</h2>
            <ul className="mt-4 space-y-4 text-sm">
              {NEGOCIO.sucursales.map((s) => (
                <li key={s.nombre} className="flex items-start gap-2.5">
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-white/45" />
                  <span>
                    <span className="rotulo-tecnico block text-[13px] text-white">
                      {s.nombre}
                    </span>
                    <span className="mt-0.5 block max-w-[34ch] leading-snug text-white/70">
                      {s.direccion}
                    </span>
                  </span>
                </li>
              ))}
              <li className="flex items-center gap-2.5">
                <Phone aria-hidden className="size-4 shrink-0 text-white/45" />
                <a
                  href={`tel:${NEGOCIO.telefono}`}
                  className="num-tab font-mono text-[13px] text-white underline-offset-4 hover:underline"
                >
                  {NEGOCIO.telefonoBonito}
                </a>
              </li>
              <li className="pt-1">
                <a
                  href={urlWhatsApp(PRELLENADOS.generico)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rotulo-tecnico inline-flex min-h-11 items-center gap-2 rounded-md bg-whatsapp px-4 text-xs text-plano-hondo transition-[filter] duration-150 hover:brightness-95 active:brightness-90"
                >
                  <IconWhatsApp lado={16} />
                  Cotiza por WhatsApp
                </a>
                <p className="mt-2 text-xs text-white/60">
                  {NEGOCIO.asistente} cotiza 24/7 con IVA incluido ·{" "}
                  <span className="num-tab font-mono">
                    {NEGOCIO.whatsappBonito}
                  </span>
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/15">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/60">
          © {new Date().getFullYear()} {NEGOCIO.razonSocial} · {NEGOCIO.ciudad} ·
          Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
