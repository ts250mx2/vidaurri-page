---
name: Autopartes Vidaurri
description: Vitrina nocturna sobre el despiece de taller — el metal en penumbra y la mercancía encendida con su precio.
colors:
  papel: "#eceef1"
  papel-hondo: "#dfe3e8"
  hoja: "#ffffff"
  linea: "#d3d8de"
  linea-fuerte: "#a9b2bc"
  tinta: "#16181d"
  tinta-suave: "#5b626c"
  plano: "#1c1c22"
  plano-hondo: "#111116"
  plano-claro: "#2a2a33"
  ambar: "#d4af37"
  ambar-press: "#b8942c"
  oro-claro: "#f0d97d"
  oro-hondo: "#8a6d1c"
  anotacion: "#d92d20"
  existencia: "#1f9d55"
  whatsapp: "#25d366"
typography:
  display:
    fontFamily: "Archivo Narrow, Arial Narrow, sans-serif"
    fontSize: "clamp(2.1rem, 5.5vw, 3.6rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.012em"
    textTransform: "uppercase"
  headline:
    fontFamily: "Archivo Narrow, Arial Narrow, sans-serif"
    fontSize: "clamp(1.15rem, 2.6vw, 1.5rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.015em"
    textTransform: "uppercase"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "normal"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo Narrow, Arial Narrow, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.015em"
    textTransform: "uppercase"
  medida:
    fontFamily: "Geist Mono, Consolas, monospace"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "tabular-nums"
  precio:
    fontFamily: "Archivo Narrow, Arial Narrow, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tabular-nums"
rounded:
  sello: "0.25rem"
  lamina: "0.375rem"
  panel: "0.5rem"
  globo: "999px"
spacing:
  canal: "0.75rem"
  ficha: "1rem"
  banda: "2.5rem"
  banda-md: "3rem"
  banda-ancha: "3.5rem"
  banda-ancha-md: "5rem"
components:
  boton-accion:
    backgroundColor: "{colors.ambar}"
    textColor: "{colors.plano-hondo}"
    typography: "{typography.label}"
    rounded: "{rounded.lamina}"
    padding: "0.625rem 0.75rem"
    height: "2.75rem"
  boton-accion-hover:
    backgroundColor: "{colors.ambar-press}"
    textColor: "{colors.plano-hondo}"
  boton-buscar:
    backgroundColor: "{colors.ambar}"
    textColor: "{colors.plano-hondo}"
    typography: "{typography.label}"
    rounded: "{rounded.sello}"
    padding: "0 1.5rem"
    height: "3rem"
  boton-whatsapp:
    backgroundColor: "{colors.whatsapp}"
    textColor: "{colors.plano-hondo}"
    typography: "{typography.label}"
    rounded: "{rounded.lamina}"
    padding: "0 0.875rem"
    height: "2.75rem"
  boton-lamina:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.lamina}"
    padding: "0.625rem 1rem"
    height: "2.75rem"
  lamina:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.lamina}"
    padding: "1rem"
  campo-claro:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sello}"
    padding: "0 0.75rem"
    height: "3rem"
  campo-claro-elegido:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta}"
  campo-oscuro:
    backgroundColor: "rgb(255 255 255 / 0.07)"
    textColor: "#ffffff"
    rounded: "{rounded.sello}"
    padding: "0 0.75rem"
    height: "3rem"
  campo-oscuro-elegido:
    backgroundColor: "rgb(255 255 255 / 0.15)"
    textColor: "#ffffff"
  sello-existencia:
    backgroundColor: "transparent"
    textColor: "{colors.existencia}"
    typography: "{typography.label}"
    rounded: "{rounded.sello}"
    padding: "0.15rem 0.45rem"
  sello-unica:
    backgroundColor: "transparent"
    textColor: "{colors.anotacion}"
    typography: "{typography.label}"
    rounded: "{rounded.sello}"
    padding: "0.15rem 0.45rem"
  globo-partida:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.globo}"
    padding: "0 0.35rem"
    height: "1.75rem"
---

# Design System: Autopartes Vidaurri

## Overview

**Creative North Star: "La vitrina nocturna sobre el despiece"**

La refaccionaria de colisión como vitrina en penumbra: el local está a oscuras y lo único encendido es la mercancía con su precio. Debajo de esa vitrina corre la otra mitad del mundo — el catálogo de despiece del manual de taller: papel milimétrico, rotulado condensado en caja alta, globos de partida numerados, sellos de goma y tinta roja de anotación. Un choque no daña una pieza: daña una zona, y la página abre el auto por zonas para que el cliente toque la que se rompió.

El reparto no es negociable porque lo fijó el cliente con una imagen de referencia. El **campo** es carbón cálido (nunca azul): ahí viven el header, el hero, el footer, las bandas de cifras y la foto real del catálogo fundida en penumbra. La **mercancía** vive fuera de la vitrina, sobre papel claro y lámina blanca, porque el precio se mira en un teléfono de gama media a pleno sol en el patio de un taller y ahí el contraste no es estética, es uso. El **oro de la casa** cose las dos mitades: filos, iconos, el marco del énfasis y la acción.

Se rechaza explícitamente la parrilla uniforme de tarjetas que ordena autopartes como si fueran abarrotes, y el azul corporativo del ramo. El sistema es denso, informativo y de escuadra — nada de esquinas suaves, nada de decoración que no rotule algo.

**Key Characteristics:**
- Dos mundos por contraste: campo carbón para el discurso, papel claro para la mercancía.
- Oro como identidad y acción, nunca como adorno ni como relleno de texto.
- Rotulado técnico condensado en caja alta para todo lo que titula o etiqueta.
- Estados que se leen al sol: sellos de goma, no puntos de color.
- Densidad de catálogo: filetes de 1px, retículas milimétricas, cifras tabulares.
- Un solo movimiento autorado en todo el sitio.

## Colors

Paleta de dos temperaturas: un carbón cálido casi neutro donde se exhibe, y un papel gris frío donde se vende — con un metal dorado como única voz de marca.

### Primary
- **Oro de la casa** (`{colors.ambar}`): la identidad y la ACCIÓN. Filo metálico bajo el header y al pie del hero, iconos de las señales, el marco del énfasis del titular, y el fondo de todo botón que dispara la cotización (`BotonCotizar`, el botón "Buscar mi pieza"). Sobre él el texto siempre va en carbón (`{colors.plano-hondo}`): blanco sobre oro no pasa contraste.
- **Oro pisado** (`{colors.ambar-press}`): estado `hover` y `active` de la acción. Es el único cambio de color que sufre un botón de oro.
- **Brillo alto del metal** (`{colors.oro-claro}`) y **Sombra del metal** (`{colors.oro-hondo}`): no se usan sueltos. Existen para que el filo de oro sea metal y no una línea plana — brillo al centro, cantos en sombra.

### Secondary
- **Carbón medio** (`{colors.plano}`): el campo de la banda de navegación, las bandas oscuras intermedias, la cabecera de la ficha de sucursal y la etiqueta "Nueva" sobre la foto.
- **Carbón hondo** (`{colors.plano-hondo}`): el fondo de la vitrina — hero, footer, encabezado de páginas internas, 404. Es también el `themeColor` de la barra del navegador móvil.
- **Carbón claro** (`{colors.plano-claro}`): panel elevado sobre el campo; `hover` del botón de menú móvil.

### Tertiary
- **Tinta de anotación** (`{colors.anotacion}`): la corrección del ajustador en rojo. Marca tres cosas y ninguna más: la pieza **única e irrepetible** (sello "Pieza única", etiqueta "Usada"), el **error** real (avisos de fallo de red, precios sin confirmar) y el **foco** del teclado sobre papel. También es el `caret-color` de todo campo de texto.
- **Verde de sello** (`{colors.existencia}`): un solo trabajo — el sello "En existencia". Es un verde de tinta, más apagado que el de WhatsApp, y nunca se usa como fondo.
- **Verde de WhatsApp** (`{colors.whatsapp}`): reservado por completo al canal de WhatsApp. Cualquier botón con este fondo abre WhatsApp y nada más.

### Neutral
- **Papel** (`{colors.papel}`): el suelo del sitio (`body`) y de las bandas de catálogo.
- **Papel hondo** (`{colors.papel-hondo}`): segundo plano — bandas alternas, hueco de la foto usada, campos deshabilitados, riel de la barra de desplazamiento.
- **Lámina** (`{colors.hoja}`): la superficie blanca de tarjetas, tablas, buscador claro y mesa de dibujo. Ahí vive la mercancía.
- **Filete** (`{colors.linea}`): el hairline de 1px que separa todo dentro del papel.
- **Trazo con peso** (`{colors.linea-fuerte}`): la regla que subraya un título de sección, el borde del campo elegido, el pulgar de la barra de desplazamiento.
- **Tinta** (`{colors.tinta}`): texto principal sobre papel, y el borde del `hover` de una lámina enlazada.
- **Tinta suave** (`{colors.tinta-suave}`): cota, metadato, año, microcopy — todo lo secundario sobre papel.

### Named Rules

**La Regla del Oro Ganado.** El oro es identidad y acción, jamás decoración. Si un elemento de oro no se puede tocar y no es un filo o un icono de la casa, sobra. El tablero de cifras y el footer no llevan un gramo de oro precisamente porque ahí no hay nada que convertir.

**La Regla del Verde Único.** `{colors.whatsapp}` pertenece a WhatsApp y solo a WhatsApp. La existencia de inventario usa su propio verde de tinta (`{colors.existencia}`) y solo como color de trazo, nunca de fondo.

**La Regla del Sol.** La mercancía —foto, código, precio, existencia— vive sobre papel claro o lámina blanca. Nunca se pone un precio a leer sobre el campo carbón.

**La Regla del Texto sin Metal.** El oro no entra nunca en el color del texto largo ni en un degradado tipográfico. Un titular con degradado es un truco, no una jerarquía: el oro enmarca (`.marco-oro`), no rellena.

## Typography

**Display Font:** Archivo Narrow (con `Arial Narrow` de reserva) — pesos 400, 500, 600 y 700.
**Body Font:** Geist (con `system-ui`).
**Label/Mono Font:** Geist Mono (con `Consolas`).

**Character:** Archivo Narrow es la letra del plano: grotesca condensada, monolineal, siempre en caja alta. Rotula, no narra. Geist sostiene todo lo que se lee de corrido porque aguanta un teléfono de gama media al sol. Geist Mono no es un disfraz técnico: aparece únicamente donde hay una **medida** — número de parte, rango de años, teléfono, cifra de una tabla.

### Hierarchy
- **Display** — clase `.titulo-lamina` (Archivo Narrow 700, `clamp(2.1rem, 5.5vw, 3.6rem)` en el encabezado de página y `clamp(2.1rem, 4.8vw, 3.5rem)` en el hero, `line-height: 1`, `letter-spacing: -0.012em`, caja alta, `text-wrap: balance`): el H1 de cada página y los H2 que hacen una afirmación grande. El interlineado es 1 y no menos: en mayúsculas el español acentúa (MÁS, CAPÓ, AÑOS) y más cerrado la tilde toca el renglón de arriba.
- **Headline** — clase `.rotulo-tecnico` en tamaño de sección (Archivo Narrow 700, `clamp(1.15rem, 2.6vw, 1.5rem)`, `line-height: 1`, `letter-spacing: 0.015em`, caja alta): el H2 que abre una banda del catálogo, subrayado por una regla de `{colors.linea-fuerte}`.
- **Title** (Geist 600, 13.5px, `line-height: 1.375`, dos líneas máximo): la descripción de la pieza dentro de una ficha. Va después del código, no antes.
- **Body** (Geist 400, 15px, `line-height: 1.625`, tope de 46–65ch): el párrafo de apoyo del hero, la descripción de una sección. Sobre el campo carbón va en `rgb(255 255 255 / 0.75)`.
- **Label** — `.rotulo-tecnico` chico (Archivo Narrow 700, 10.5–13px, caja alta): etiquetas sobre la foto, rótulos del cajetín, nombres de columna, texto de botón, marca del vehículo.
- **Medida** — `.num-tab` + `font-mono` (Geist Mono 600, 15px, `tabular-nums`): el número de parte, que es como se pide la pieza en el mostrador y por eso encabeza la ficha. También rango de años, teléfono, folio y celdas de tabla.
- **Precio** — componente `Precio` (Archivo Narrow 700, 1.6rem en ficha y `clamp(2.1rem, 5vw, 2.75rem)` en la pieza, `tabular-nums`, `letter-spacing: -0.01em`): la cifra es la cota que cierra el renglón. Debajo, "IVA incluido" en `.rotulo-tecnico` de 11px — nunca en letra chica escondida.

### Named Rules

**La Regla de la Mono como Medida.** Geist Mono solo donde hay una cifra que se compara o se dicta: código de parte, año, teléfono, columna de tabla. Nunca para dar aire "técnico" a un párrafo.

**La Regla de la Caja Alta Corta.** Archivo Narrow va siempre en `uppercase`. Por eso no se usa para frases: un rótulo de más de cinco o seis palabras en caja alta deja de leerse. Lo largo es de Geist.

**La Regla del Código Primero.** En cualquier ficha de pieza, el número de parte es el primer dato y va en mono; la descripción viene después, en cuerpo.

## Layout

Contenedor único de `max-w-6xl` (72rem) con canal lateral de `1rem` (`px-4`) en todos los anchos — el sitio entero se lee como una sola lámina y no como una suma de plantillas.

**Ritmo vertical por tipo de banda:**
- Banda de catálogo (destacados, usadas, tipos, sucursales): `2.5rem` móvil → `3rem` desktop (`py-10 md:py-12`).
- Banda de contenido de página interna: `2rem` → `2.5rem` (`py-8 md:py-10`).
- Encabezado de página (`EncabezadoPagina`): `2.5rem` → `3.5rem` (`py-10 md:py-14`).
- Banda de discurso larga (nosotros, mayoreo, sucursales): `3.5rem` → `5rem` (`py-14 md:py-20`).

**Parrillas de mercancía:** 2 columnas en móvil → 3 en `md`/`sm` → 4 en `lg`, con `gap-3` que abre a `gap-4` en `md`. En la portada caben cuatro piezas por renglón, y por eso las primeras cuatro fotos no se difieren.

**Hero:** tres columnas asimétricas en `lg` — `minmax(0,1fr) auto minmax(0,22rem)`: titular a la izquierda, las tres señales al centro, la acción (buscador + tarjeta de Vico) a la derecha. En móvil se apila en ese mismo orden de peso.

**Buscador responsivo por contenedor, no por viewport.** `SelectorVehiculo` vive dentro de un `@container`: se acomoda 2×2 cuando ocupa media portada y se estira a los cuatro campos en una línea cuando ocupa el ancho completo. Lo decide su caja, no la pantalla.

**Densidad táctil:** toda zona tocable mide al menos `2.75rem` (44px) de alto; los campos de formulario miden `3rem` (48px) con `text-base` de 16px para evitar el zoom automático de iOS. El `main` lleva `pb-24` en móvil para dejar sitio a la barra fija inferior.

**Encabezado de sección:** título en `.rotulo-tecnico` a la izquierda, dato de contexto a la derecha, separados por una regla `border-b border-linea-fuerte pb-3`. Ese es el arranque canónico de una banda de papel.

## Elevation & Depth

Sistema híbrido y deliberadamente plano en el papel: la profundidad la dan el **filete de 1px** y el **cambio de superficie** (papel → lámina), no la sombra. Las sombras existen en tres pasos y solo tres, y ninguna aparece en reposo salvo la más baja.

### Shadow Vocabulary
- **Lámina** (`box-shadow: 0 1px 2px rgb(10 24 38 / 0.05), 0 2px 8px rgb(10 24 38 / 0.06)`): la sombra en reposo de toda tarjeta `.lamina`. Casi imperceptible; su trabajo es despegar la hoja blanca del papel gris.
- **Lámina alta** (`box-shadow: 0 2px 4px rgb(10 24 38 / 0.06), 0 14px 30px rgb(10 24 38 / 0.14)`): exclusiva del `hover` de una lámina enlazable (`.lamina-enlace`), acompañada de `translateY(-2px)` y de un borde que se cierra a `{colors.tinta}`.
- **Flotante** (`box-shadow: 0 20px 50px rgb(10 24 38 / 0.45)`): la sombra profunda del panel de vitrina sobre el campo carbón — hoy solo el buscador en tono oscuro del hero.

Sobre el campo carbón la elevación no se hace con sombra sino con **luz**: `.panel-vitrina` es un cristal traslúcido (degradado de blanco al 7% → 3%, borde blanco al 10%) con el filo superior encendido por dentro (`inset 0 1px 0 rgb(255 255 255 / 0.08)`). `.marco-oro` usa la misma idea con metal: brillo interior superior y un halo exterior de oro al 16%.

### Named Rules

**La Regla del Filete Antes que la Sombra.** Para separar dos cosas, primero un `1px` de `{colors.linea}`; después un cambio de fondo; la sombra es el último recurso y solo la más baja.

**La Regla de la Sombra que Responde.** Las dos sombras altas son respuesta a un estado (hover, flotación sobre el campo). Nunca se aplican a una superficie en reposo.

## Shapes

El plano es de escuadra: radios cortos, ángulos rectos, líneas rectas.

- **Filete de sección / tarjeta:** `0.25rem` (`rounded-sm`) para sellos, campos de formulario, etiquetas sobre foto y el marco de oro.
- **Lámina y botón:** `0.375rem` (`rounded-md`) — la tarjeta, el botón de acción, el botón de WhatsApp, el botón de lámina.
- **Panel de vitrina:** `0.5rem`, medio paso más suave porque es cristal y no papel.
- **Círculo completo:** `999px`, reservado al **globo de partida** (el número que rotula una pieza en un despiece) y al pulgar de la barra de desplazamiento.

**Bordes:** todos de `1px` salvo tres excepciones intencionales — el globo de partida (`1.5px`), el sello de goma (`1.5px`, del color de la tinta que lleva) y el marco de oro (`2px`). El filo de oro del header es una banda de `3px` al pie del elemento.

**Texturas del plano** (superficies sobre las que se dibuja, no adornos de fondo):
- `.trama-plano`: papel milimétrico claro, retícula de 12px con línea gruesa cada 60px, en tinta al 5% / 9%. Va sobre `bg-hoja` o `bg-papel`.
- `.trama-plano-oscura`: la misma retícula en blanco al 4.5% / 8%, para el campo carbón (footer, encabezado de página, bloque B2B, 404), normalmente a `opacity-70`.
- `.mesa-dibujo`: fondo blanco con retícula de 12px, exclusivo del hueco de la foto de producto — las fotos del catálogo vienen recortadas sobre blanco y necesitan una base que las sostenga.

**Sesgo del sello:** `.sello` lleva `transform: rotate(-1.2deg)`. Un sello de goma nunca cae perfectamente a escuadra, y esa es la única irregularidad tolerada en todo el sistema.

## Components

### Buttons
- **Shape:** esquinas cortas de `0.375rem`; el botón del buscador va a `0.25rem` para hacer juego con los campos.
- **Acción (oro)** — `BotonCotizar`: fondo `{colors.ambar}`, texto `{colors.plano-hondo}` en `.rotulo-tecnico` de 13px, alto mínimo 44px, padding `0.625rem 0.75rem`. Es la única pieza de oro de una ficha de catálogo. La base va con padding chico a propósito para que quien la use pueda agrandarla desde `className` sin pelear con la cascada.
- **Hover / Focus:** el fondo baja a `{colors.ambar-press}` en 150ms; el texto **no cambia** — blanco sobre oro no llega al contraste mínimo, ni siquiera en hover. `:focus-visible` dibuja un `outline: 2px` con `outline-offset: 2px`.
- **Buscar (oro grande):** mismo oro, alto `3rem`, padding lateral `1.5rem`, con icono de lupa a 16px y texto que cambia a "Buscando…" mientras navega; `disabled:opacity-70`.
- **WhatsApp:** fondo `{colors.whatsapp}`, texto `{colors.plano-hondo}`, alto 44px. Su único estado es `hover:brightness-95` / `active:brightness-90` — no cambia de color, porque el verde es una marca ajena.
- **Lámina (secundario):** fondo `{colors.hoja}`, borde `{colors.linea}`, texto `{colors.tinta}` en `.rotulo-tecnico`; en `hover` el borde se cierra a `{colors.tinta}` y el fondo baja a `{colors.papel}`. Es el botón de "Cómo llegar" y "Llamar".
- **Enlace de rescate:** botón de texto subrayado al hover, en `{colors.ambar}` sobre campo carbón y en `{colors.tinta}` sobre papel, con flecha de 16px.

### Chips
- **Tipos más buscados (hero):** píldora de `rounded-sm`, borde blanco al 20% sobre fondo blanco al 5%, texto blanco en Archivo Narrow 600 de 12.5px con `tracking-[0.08em]`, alto mínimo 44px. En `hover` borde y texto pasan a `{colors.ambar}`.
- **Etiqueta sobre foto:** rectángulo de `rounded-sm` en la esquina superior izquierda de la imagen. "Nueva" sobre `{colors.plano}`; "Usada" sobre `{colors.anotacion}`; el contador de fotos sobre `{colors.plano-hondo}` al 85%, abajo a la derecha.

### Cards / Containers
- **Corner Style:** `0.375rem`.
- **Background:** `{colors.hoja}` con borde `{colors.linea}` de 1px.
- **Shadow Strategy:** sombra **Lámina** en reposo. Si la tarjeta entera es un enlace se le añade `.lamina-enlace`, que en `hover` sube a **Lámina alta**, cierra el borde a `{colors.tinta}` y levanta 2px.
- **Internal Padding:** `1rem` (`p-4`) en la ficha de catálogo; `1.25rem` (`px-5`) en la ficha de sucursal.
- **Estructura de la ficha de pieza:** foto en proporción fija 4:3 sobre `.mesa-dibujo` (nueva) o `bg-papel-hondo` (usada, foto real recortada con `object-cover`) → código de parte en mono → descripción en cuerpo → marca y años en `tinta-suave` → **línea guía** (`border-t border-linea pt-3.5`) que baja al renglón de sello + precio → fila de CTAs (cotizar + WhatsApp) → microcopy. Toda la ficha navega mediante un enlace absoluto (`absolute inset-0 z-10`) y los CTAs se elevan por encima con `z-20` para seguir siendo tocables. La foto crece a `scale-[1.04]` en `group-hover`.
- **Variante sobre campo carbón:** existe `.lamina-plano` (fondo `{colors.plano-claro}`, borde blanco al 12%, radio `0.375rem`) pero **hoy no tiene usos en `src/`**. Antes de emplearla, verificar que sigue siendo la respuesta correcta frente a `.panel-vitrina`.

### Inputs / Fields
- **Style:** alto `3rem`, `rounded-sm`, `text-base` (16px), padding lateral `0.75rem`. En tono claro: borde `{colors.linea}` sobre `{colors.papel}`. En tono oscuro (sobre la vitrina): cristal ahumado — borde blanco al 20% sobre blanco al 7%, texto blanco.
- **Elegido:** el campo cambia de peso, no solo de contenido — borde a `{colors.linea-fuerte}` (o `ambar/55` en oscuro), fondo a `{colors.hoja}` (o blanco al 15%) y `font-semibold`. Se ve de un vistazo qué ya se filtró.
- **Hover:** borde a `{colors.linea-fuerte}` en claro, a `ambar/60` en oscuro.
- **Focus:** `outline: 2px solid {colors.anotacion}` con `offset: 2px` sobre papel; dentro de `.sobre-plano` el outline cambia a `{colors.ambar}`, porque el rojo no se lee contra el carbón. El cursor de texto (`caret-color`) es siempre `{colors.anotacion}`.
- **Disabled:** el estado va en el **borde y el fondo** (`border-linea` + `bg-papel-hondo`, o blanco al 10% / 3% en oscuro), nunca bajando la opacidad del texto — eso tiraba el contraste a 3.6:1 en los campos del hero, que se leen a un brazo de distancia y a pleno sol.
- **Error:** párrafo con icono de triángulo de 16px y texto `{colors.anotacion}` de 13px, con `role="status"`. Vacío y error son estados distintos: "Sin modelos" es un dato real de la base; "no cargó la lista" es el aviso rojo.

### Navigation
- **Header de dos pisos:** arriba una **cinta utilitaria** informativa sobre `{colors.plano-hondo}` (facturación, envíos, años de casa, horario y teléfono) en 12px al 70% de blanco — sin oro y sin botones, porque ahí no hay nada que convertir; oculta bajo `sm` y su contenido baja al menú móvil. Abajo la **banda de navegación** de `4rem` sobre `{colors.plano}`, rematada por un filo de oro de `3px` como pseudo-elemento.
- **Enlaces:** `.rotulo-tecnico` de 13px, blanco al 65% que sube a blanco puro en `hover`. La sección activa va en blanco y lleva un **filete blanco de 2px** al pie (un punto blanco de 6px en el menú móvil). El oro marca dónde se toca, nunca dónde se está.
- **Mobile:** botón de menú de 44px con `hover:bg-plano-claro`; el desplegable repite los enlaces con separadores de blanco al 10%, y añade la cinta y el teléfono. Existe además una barra fija inferior (`BarraMovil`).
- **Footer / cajetín:** el bloque de datos de la esquina de un plano, sobre `{colors.plano-hondo}` con `.trama-plano-oscura` al 70%. Tres renglones separados por `border-white/15`: emisor (razón social, plaza, facturación en `<dl>`), índice (marcas, sitio, contacto) y aviso legal. Ni un gramo de oro: aquí lo único que convierte es el botón de WhatsApp.

### El sello de existencia (componente firma)
El estado de inventario es un **SELLO DE GOMA**, no un punto de color: borde de `1.5px` en `currentColor`, radio `0.25rem`, Archivo Narrow 700 a 11px en caja alta con `letter-spacing: 0.08em`, y `rotate(-1.2deg)`. Dos variantes y solo dos:
- `.sello-existencia` en `{colors.existencia}` — "En existencia".
- `.sello-unica` en `{colors.anotacion}` — "Pieza única", la irrepetible del almacén de usado.

Cuando el sello cae sobre papel gris o sobre una trama, se le añade `bg-hoja` para que la tinta verde y la roja conserven contraste de cuerpo. La escasez no se fabrica: se sella, y solo cuando es verdad.

### El globo de partida
El círculo numerado del despiece: `min-width: 1.75rem`, alto `1.75rem`, borde de `1.5px` en `{colors.tinta}`, fondo `{colors.hoja}`, cifra en Geist Mono 600 de 12px con `tabular-nums`. Hoy rotula los pasos de la ficha de pieza. Su variante invertida para campo carbón (`.globo-partida-claro`: borde blanco al 55%, fondo transparente, texto blanco) está definida pero **sin usos en `src/`**.

### La vitrina del hero
Tres capas, todas decorativas y todas prescindibles sin que se rompa nada:
1. `.pieza-vitrina` — hasta cuatro miniaturas de **mercancía real del catálogo** (nunca stock), en `grayscale(1) contrast(1.2) brightness(0.75)`, `mix-blend-mode: luminosity` y `opacity: 0.35`, escaladas a 125%. Si el almacén de fotos no responde, el hero queda en carbón liso.
2. `.velo-vitrina` — el velo que garantiza que manden el titular y el buscador: cierra por abajo y por la izquierda con carbón sólido que se abre a 70% de opacidad hacia la derecha, más un halo radial de oro al 16% arriba a la derecha. Ese halo es luz de vitrina que nace del filo del header, no un degradado decorativo. Bajo 768px el velo se reescribe a un degradado vertical opaco (88% → 95%).
3. `.filo-oro` — la banda metálica de `1px` a `opacity-70` que remata la vitrina contra la banda siguiente. Es un degradado horizontal de cinco paradas (sombra → brillo → oro → brillo → sombra), y es el **único** uso de la clase `.filo-oro` en el sitio: el filo del header dibuja el mismo degradado en línea, deliberadamente, para no heredar la animación.

### Motion
**Un solo momento autorado en todo el sitio.** Al cargar la portada, una luz recorre **una vez** el filo de oro que remata el hero, de izquierda a derecha, como el tubo de una vitrina al encender: `enciende-vitrina`, `1100ms`, `cubic-bezier(0.16, 1, 0.3, 1)`, con `180ms` de retardo. Viaja en un pseudo-elemento (`.filo-oro::after`) cuyo estado en reposo es `opacity: 0`, sobre un filo que **ya está pintado antes de que la animación exista**: si el motor nunca corre, el filo se lee completo y no falta nada.

Todo lo demás es transición de estado, nunca entrada: `150ms` con `cubic-bezier(0.16, 1, 0.3, 1)` para la lámina (sombra, borde, `translateY`) y `150ms ease` para colores, filtros y bordes.

Con `prefers-reduced-motion: reduce` todas las animaciones y transiciones se colapsan a `0.01ms` con una sola iteración, y `.lamina-enlace:hover` deja de levantarse. El `rotate(-1.2deg)` del sello sobrevive porque es forma, no movimiento.

### Superficies del navegador
Lo que no se dibuja también lleva el diseño:
- `::selection`: fondo `{colors.ambar}`, texto `{colors.plano-hondo}`.
- Barra de desplazamiento: `scrollbar-width: thin` con pulgar `{colors.linea-fuerte}` sobre riel transparente; en WebKit, 11px de ancho, riel `{colors.papel-hondo}`, pulgar redondeado a 99px con 3px de riel como margen, que oscurece a `{colors.tinta-suave}` en hover.
- `overscroll-behavior: none` en `html` y `body`; `touch-action: manipulation` en todo control.

## Do's and Don'ts

### Do:
- **Do** pintar toda mercancía —foto, código, precio, existencia— sobre `{colors.hoja}` o `{colors.papel}`. El campo carbón es para el discurso y la identidad, no para el precio.
- **Do** reservar `{colors.ambar}` para filos, iconos de la casa, el marco del énfasis y los botones que abren la cotización. Si no se toca y no es un filo, no lleva oro.
- **Do** abrir cada ficha de pieza con el número de parte en Geist Mono y `tabular-nums` (`.num-tab`): así se pide la pieza en el mostrador.
- **Do** comunicar existencia con `.sello` + `.sello-existencia` o `.sello-unica`, y añadirles `bg-hoja` cuando caigan sobre papel o trama.
- **Do** rotular con `.rotulo-tecnico` o `.titulo-lamina` (Archivo Narrow, caja alta) todo lo que titula, etiqueta o nombra una columna.
- **Do** separar con un filete de `1px` de `{colors.linea}` antes de recurrir a un cambio de fondo, y a una sombra solo al final.
- **Do** garantizar 44px de alto en cualquier zona tocable y 48px con texto de 16px en los campos de formulario.
- **Do** comunicar el estado deshabilitado en el borde y el fondo, dejando la letra con su contraste.
- **Do** dejar que un contenedor `@container` decida el reparto de un formulario reutilizable, en vez de amarrarlo al viewport.
- **Do** abrir toda banda de papel con el par título `.rotulo-tecnico` + regla `border-b border-linea-fuerte`.

### Don't:
- **Don't** poner una etiqueta-rótulo (kicker) encima de un título. El título carga solo — `EncabezadoPagina` conserva la prop `rotulo` por compatibilidad, pero **no la renderiza**.
- **Don't** usar bordes laterales de color de más de `1px`. Las únicas excepciones vivas son el globo de partida y el sello (`1.5px`), el marco de oro (`2px`) y el filo de oro del header (`3px`).
- **Don't** anidar una tarjeta dentro de otra. Para tres columnas relacionadas se usa **una sola** `.lamina` con `divide-y` / `md:divide-x`, como en el bloque de tres formas de compra.
- **Don't** aplicar degradados al texto ni pintar un titular en oro. El oro enmarca con `.marco-oro`; nunca rellena una letra.
- **Don't** usar emoji como icono. Los iconos vienen de `lucide-react`, siempre `aria-hidden`, a 12–20px.
- **Don't** numerar secciones ni tarjetas de forma decorativa (01 / 02 / 03). El orden de las sucursales no es información, y un número que no significa nada es adorno. El globo de partida sí numera — porque en un despiece el número **es** el dato.
- **Don't** agregar una segunda animación de entrada, un `reveal` por scroll ni un efecto por sección. El barrido del filo de oro es el único movimiento autorado, y por eso se nota.
- **Don't** teñir texto de blanco sobre `{colors.ambar}`, ni siquiera en hover: sobre oro el texto va en `{colors.plano-hondo}`.
- **Don't** usar `{colors.whatsapp}` para nada que no abra WhatsApp, ni `{colors.anotacion}` para nada que no sea pieza única, error real o foco sobre papel.
- **Don't** poner foto de banco de imágenes en la vitrina. El fondo del hero es mercancía que de verdad está en el anaquel, o carbón liso.

---

## Notas de auditoría (código vs. intención)

Registradas porque la verdad del build gana sobre el comentario:

1. **El filo del header no es `.filo-oro`.** `Header.tsx` dibuja el mismo degradado de cinco paradas como utilidad en línea sobre un `after:h-[3px]`. Es deliberado: `.filo-oro::after` lleva la animación de encendido, y aplicar la clase al header repetiría el barrido en cada página. El comentario del header dice "filo ámbar de 4px"; el código dice **3px**, y manda el código.
2. **`.lamina-plano` y `.globo-partida-claro` están definidas en `globals.css` pero no se usan en `src/`.** Quedan documentadas como disponibles, no como vigentes.
3. **Los comentarios del código todavía dicen "campo azul" en varios sitios** (`Header.tsx`, `Footer.tsx`, `globals.css` en la regla de foco, `SelectorVehiculo.tsx`). El mundo azul ya no existe: el campo es carbón cálido `{colors.plano}` / `{colors.plano-hondo}`. Léase "campo carbón" en todos ellos.
4. **Hay dos verdes y no son intercambiables:** `{colors.existencia}` es tinta de sello, `{colors.whatsapp}` es la marca del canal.
5. **No hay `tailwind.config`.** Tailwind v4 lee los tokens directamente del bloque `@theme` de `src/app/globals.css`, que es la fuente de verdad única del sistema.
