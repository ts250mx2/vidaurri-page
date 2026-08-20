# vidaurri-page

Web pública de **Autopartes Vidaurri** (Monterrey, +40 años, refacciones de
colisión nuevas y usadas). Reemplaza apvidaurri.com. Proyecto hermano de
`../vidaurri-ia`: mismas bases de datos (SOLO LECTURA) y el mismo webservice
del Vendedor IA. Aquí NO hay login: todo es público.

## Stack y ejecución

- Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS 4 (config CSS-first en `src/app/globals.css`).
- `npm run dev` → puerto **3041** · `npm run start` → **3042** (3037/3038 son de vidaurri-ia).
- Alias `@/*` → `./src/*`. Componentes de servidor por defecto; `"use client"` solo con interactividad.

## Dirección de diseño: "Mostrador"

Mostrador de refaccionaria regia llevado a pantalla. Tema claro industrial.

**Regla de oro: si es ámbar, convierte; si es verde brillante, es WhatsApp; nada más usa esos colores.**

Tokens Tailwind (definidos en `globals.css`, úsalos SIEMPRE, nunca hex sueltos):

| Clase | Valor | Uso |
|---|---|---|
| `bg-fondo` | #F4F5F7 | fondo general |
| `bg-fondo-hondo` | #E8EAEF | neutro un paso más hondo: bandas alternas (B2B) |
| `bg-superficie` | #FFFFFF | tarjetas, buscador (usa la clase `carta`) |
| `border-borde` / `border-borde-fuerte` | #E3E6EA / #CED4DC | filete normal / con peso (hover, separadores) |
| `text-tinta` / `bg-grafito` | #171B21 | texto principal; header/franjas oscuras |
| `bg-grafito-hondo` | #0D1015 | hero, encabezados de página, footer |
| `text-tinta-suave` | #5C6570 | secundario, SKU, metadatos |
| `bg-ambar` (hover `bg-ambar-press`) | #FFB400 | EXCLUSIVO de la acción: botón Cotizar, filo del header, borde del bloque de precio. Texto encima SIEMPRE grafito |
| `bg-whatsapp` | #25D366 | SOLO botones/QR de WhatsApp |
| `text-exito` | #1F9D55 | dot y texto "En existencia", confirmaciones |

Tipografía: `titulo-display` = Barlow Condensed para H3/badges/botones;
`titulo-cartel` para H1/H2 y precios (mismo Barlow con tracking negativo e
interlineado 0.98 — no lo bajes: el español en mayúsculas acentúa y la tilde
choca con el renglón de arriba). `rotulo` = etiqueta chica de anaquel sobre cada
título. Cuerpo = Geist (default). SKUs y cifras = `font-mono` + `num-tab`.
Inputs ≥16px (`text-base`). Énfasis: `marcador-ambar` sobre claro,
`placa-ambar` sobre grafito (el subrayado no contrasta con texto blanco).
Nada de librerías de animación: transiciones CSS de 150ms.

Superficies y textura (todas en `globals.css`): `carta` (+ `carta-enlace` si la
tarjeta entera es un link) es la base de toda superficie elevada; `carta-oscura`
sobre grafito. Sombras `shadow-carta` / `shadow-carta-alta` / `shadow-flotante`.
Lo "gráfico" del sitio se construye SOLO con foto real del catálogo, grafito,
Barlow en grande y las tramas neutras `trama-rejilla`, `trama-rejilla-oscura` y
`trama-anaquel` (fondo punteado bajo las fotos de producto). **Nunca ámbar
decorativo**: el ámbar se gana donde hay algo que tocar. Envuelve toda banda
grafito en `sobre-grafito` para que el foco visible cambie a ámbar.

Copy: español mexicano de tuteo imperativo (cotiza, pregunta, llama, recoge —
jamás "solicite"). Precios SIEMPRE "IVA incluido". Urgencia solo real: "En
existencia — recógela hoy en Monterrey", "Pieza única" (solo usadas). PROHIBIDO:
contadores, escasez inventada, sellos genéricos, datos inventados (garantías,
horarios o teléfonos que no estén en `src/config/negocio.ts`).

Jerarquía CTA: 1º WhatsApp (verde) · 2º chat Vico (ámbar) · 3º llamar/visitar ·
4º navegación neutra. Nunca dos del mismo nivel juntos. Bajo todo CTA de
conversación: "Respondemos en minutos en horario hábil" o "El asistente cotiza 24/7".

## Piezas ya construidas

- `src/config/negocio.ts` — datos del negocio (`NEGOCIO`), `urlWhatsApp(texto)`,
  `PRELLENADOS` por contexto (SIEMPRE incluir el código de pieza cuando exista).
  Datos marcados PENDIENTE: no inventar valores nuevos.
- `src/lib/catalogo.ts` — nuevas (bdav): `listarMarcas/listarMarcasSurtidas/
  listarTiposParte/listarModelosDeMarca/rangoAniosDeModelo/buscarProductos/
  productoPorCodigo/relacionadosDeGolpe/resumenCatalogo/muestrasPorTipo/
  productosDeVitrina`. Público = precio CON IVA y `enExistencia` booleano.
  NUNCA exponer costos, inventario exacto, localización ni datos de clientes.
  **De cara al cliente usa `listarMarcasSurtidas()`** (solo marcas con piezas,
  ordenadas por volumen): `listarMarcas()` trae las 48 líneas del catálogo,
  incluidas las de camión y las que no tienen una sola pieza — sirve para
  RESOLVER slugs de ruta, no para vitrinas, footer ni sitemap.
- `src/lib/usadas.ts` — Bodega Usado: `listarMarcasUsadas/listarPartesUsadas/
  buscarPiezasUsadas/piezaUsadaPorId/usadasEquivalentes/resumenBodega`.
- `src/lib/slug.ts` — `slugificar`, `porSlug` (URLs semánticas).
- `src/lib/formato.ts` — `pesos()`, `rangoAnios()`.
- `src/lib/aldo.ts` — `precioAldo(codigo)` (disponibilidad sobre pedido, scraping
  cacheado; envolver en timeout corto y NUNCA bloquear la página por él).
- Sistema visual compartido — úsalos SIEMPRE en vez de rehacer el bloque:
  `TituloSeccion` (filete + rótulo + H2 + acción; prop `tono="oscuro"` sobre
  grafito), `EncabezadoPagina` (banda grafito con migas + H1 que abre TODA
  página interna), `Migas`, `TableroCifras` (franja de cifras de home y
  nosotros), `TarjetaSucursal`, `MarcaAV` (lockup del logo en header/footer).
  El hero se viste con `MuroPiezas` (fondo de fotos reales fundidas en grafito)
  y `PilaPiezas` (abanico de 3 fichas, solo desktop); ambos salen de los mismos
  códigos verificados de `muestrasPorTipo`, así que si el S3 no responde el hero
  degrada a grafito liso sin romperse.
- Componentes: `Header`, `Footer`, `BarraMovil` (fija abajo en móvil),
  `ChatVico` (chat IA; se abre con `abrirChat(mensaje?)` de `BotonCotizar.tsx`),
  `BotonCotizar` (mensaje que termina en ": " va al input; si no, se envía),
  `TarjetaProducto`, `TarjetaUsada`, `FotoPieza` (fallback), `Precio`,
  `LogoMarca` (logo del fabricante desde `public/marcas/<slug>.png`, cae al
  nombre en Barlow si falta; los archivos se bajan una vez con
  `scripts/descargar-logos.mjs`, nunca se enlaza al origen en caliente),
  `VitrinaDestacados` (mercancía real con precio en la home),
  `QrWhatsApp` (solo desktop: `hidden md:block` en el padre), `SelectorVehiculo`
  (marca→modelo→año→tipo; navega a `/refacciones/...`), `LogoAV`, `IconWhatsApp`.
- `src/lib/marca-agua.ts` — `estamparMarca(buffer)` / `sellarRespuesta(res)`:
  estampa el lockup de la casa (`public/marca-agua.png`) abajo a la derecha de
  TODA foto de pieza. Cuesta ~10-14 ms; devuelve `null` (y loguea) cuando algo
  falla, y el llamador sirve el original: una foto sin sello es mejor que una
  pieza sin foto. **Tiene un gemelo idéntico en `vidaurri-ia/src/lib/`: si
  cambias uno, cambia el otro**, o el mismo producto sale marcado distinto en
  WhatsApp que en la web. El PNG se regenera con `scripts/generar-marca-agua.mjs`.
- API: `/api/foto?codigo=&thumb=1` (fotos nuevas), `/api/usadas/foto?n=`
  (fotos usadas), `/api/chat` (proxy al Vendedor IA), `/api/catalogo/modelos`,
  `/api/catalogo/anios`.

## Rutas del sitio

- `/` home · `/refacciones/[[...seg]]` catálogo (segmentos: marca/modelo/año/tipo
  por slug; filtros extra por querystring) · `/pieza/[codigo]` ficha nueva ·
  `/usadas` y `/usadas/[id]` · `/mayoreo` · `/nosotros` · `/sucursales` ·
  `/aviso-de-privacidad` · `not-found` con rescate conversacional.

## Trampas verificadas de las bases (no volver a tropezar)

- **bdav es MySQL 5.7.12**, no 8.0 (la doc de vidaurri-ia dice 8.0 y está mal).
  NO hay funciones de ventana: `ROW_NUMBER() OVER (...)` es error de sintaxis.
  Para "N por grupo" usa `UNION ALL` de subconsultas con `LIMIT`.
- **`garantizarSoloLectura()` exige que el SQL EMPIECE con `select|with|show|…`**.
  Un `UNION ALL` con `LIMIT` por bloque abre con `(` y es rechazado: envuélvelo en
  `SELECT ... FROM ( ... ) AS x`.
- **Fotos de artículos nuevos**: el nombre de archivo en el S3 es la columna
  `articulos.imagen` cuando está capturada, si no el `codigo` (`ProductoResumen.foto`
  ya resuelve esto — úsalo, nunca `codigo` directo para la foto).
  `imagen` vacía NO significa "sin foto"; solo sirve para ordenar candidatos
  (los códigos genéricos tipo `GENERICODE` la tienen vacía y no tienen foto).
- Los `.catch()` que degradan deben **loguear**: un fallo silencioso aquí vacía
  secciones enteras sin que nada lo delate.
- **`&thumb=1` pixela**: las miniaturas del S3 pesan 2-5 KB y se rompen en cuanto
  la foto pasa de ~120 px. Producto (tarjetas, mosaicos, fichas) SIEMPRE a
  tamaño completo; el thumb solo se justifica en el muro decorativo del hero.

## Reglas duras

1. SQL solo por `consultaBdav`/`consultaUsadas` (solo lectura, parametrizado).
2. Callejones sin salida no existen: cero resultados y 404 SIEMPRE ofrecen
   "Pregúntale a Vico" (`abrirChat`) con el contexto precargado + WhatsApp.
3. QR solo desktop; en móvil botón `wa.me` directo.
4. SEO: páginas de catálogo con `generateMetadata` (title tipo "Facia Nissan
   Versa 2015-2019 | Nueva y Usada con Precio | Autopartes Vidaurri Monterrey"),
   JSON-LD Product/Offer en fichas, sinónimos regionales en el cuerpo
   (facia/defensa, calavera/stop, cofre/capó, salpicadera/aleta).
5. La Bodega Usado es remota y puede fallar: toda consulta a usadas en páginas
   de nuevas va en try/catch y degrada sin romper la página.
6. **Ninguna foto de pieza sale sin sello.** Toda ruta que sirva imagen de
   catálogo pasa por `lib/marca-agua`; las estáticas del carrusel se sellan al
   generarlas (`scripts/sellar-estaticas.mjs`, originales en `assets/vitrina/`).
   Sellar obliga a bufferear la imagen, así que esas rutas van con
   `cache: "no-store"` hacia el origen y `Cache-Control` largo hacia afuera.
   Dos excepciones a propósito: los **logos de fabricantes** (`public/marcas/`)
   son marcas ajenas y no se tocan, y las miniaturas de menos de 110 px salen
   limpias porque ahí el sello es una mancha ilegible que no protege nada.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
