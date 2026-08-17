import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { MarcaAV } from "@/components/LogoAV";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { NEGOCIO, urlWhatsApp, PRELLENADOS } from "@/config/negocio";
import { listarMarcasSurtidas } from "@/lib/catalogo";
import { slugificar } from "@/lib/slug";

// Footer grafito con la matriz corta de marcas (SEO) y los datos duros del
// negocio. Server component: las marcas salen del catalogo real (cacheadas).
// Los rótulos de columna van en blanco tenue, no en ámbar: en el footer no hay
// nada que convertir salvo el botón de WhatsApp.

const MARCAS_TOP = 10;

const CLASE_ENLACE =
  "text-slate-400 transition-colors duration-150 hover:text-white";

export async function Footer() {
  // Surtidas y por volumen, no las 48 líneas del catálogo: enlazar marcas sin
  // una sola pieza manda al cliente (y al buscador) a un listado vacío.
  const marcas = await listarMarcasSurtidas().catch(() => []);

  return (
    <footer className="sobre-grafito relative isolate overflow-hidden border-t-4 border-ambar bg-grafito-hondo text-slate-300">
      <span
        aria-hidden
        className="trama-rejilla-oscura absolute inset-0 opacity-60"
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <MarcaAV lado={40} className="text-white" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-400">
            {NEGOCIO.experiencia} surtiendo la hojalatería de Monterrey:
            refacciones de colisión nuevas y usadas, con factura.
          </p>
          <p className="mt-3 text-sm font-semibold text-white">
            Facturamos CFDI 4.0.
          </p>
        </div>

        <nav aria-label="Marcas">
          <h2 className="rotulo text-white/50">Refacciones por marca</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {marcas.slice(0, MARCAS_TOP).map((m) => (
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
        </nav>

        <nav aria-label="Sitio">
          <h2 className="rotulo text-white/50">Sitio</h2>
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
          <h2 className="rotulo text-white/50">Contacto</h2>
          <ul className="mt-4 space-y-4 text-sm">
            {NEGOCIO.sucursales.map((s) => (
              <li key={s.nombre} className="flex items-start gap-2.5">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <span>
                  <span className="font-display font-bold uppercase tracking-[0.06em] text-white">
                    {s.nombre}
                  </span>
                  <span className="mt-0.5 block leading-snug text-slate-400">
                    {s.direccion}
                  </span>
                </span>
              </li>
            ))}
            <li className="flex items-center gap-2.5">
              <Phone aria-hidden className="size-4 shrink-0 text-slate-500" />
              <a
                href={`tel:${NEGOCIO.telefono}`}
                className="num-tab font-mono text-[13px] text-white"
              >
                {NEGOCIO.telefonoBonito}
              </a>
            </li>
            <li className="pt-1">
              <a
                href={urlWhatsApp(PRELLENADOS.generico)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-whatsapp px-4 py-3 font-display text-xs font-bold uppercase tracking-wide text-white transition-opacity duration-150 hover:opacity-90"
              >
                <IconWhatsApp lado={16} />
                Cotiza por WhatsApp
              </a>
              <p className="mt-2 text-xs text-slate-500">
                El asistente cotiza 24/7 · {NEGOCIO.whatsappBonito}
              </p>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-slate-500">
          © {new Date().getFullYear()} {NEGOCIO.razonSocial} · {NEGOCIO.ciudad} ·
          Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
