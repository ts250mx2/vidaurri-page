# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dos audiencias de igual prioridad, con caminos separados y visibles desde la
portada (confirmado por el cliente):

1. **El particular que chocó.** Su auto está parado, no conoce el nombre técnico
   de la pieza ("se rompió el plástico de adelante"), compara contra el precio de
   agencia y busca ahorrar. Llega con urgencia, muchas veces desde el celular y
   fuera de horario de oficina, a veces la misma noche del percance.
2. **Talleres de hojalatería y pintura, y refaccionarias.** Compra recurrente y
   profesional: piden por código, les importa el surtido, la disponibilidad
   inmediata, el precio de mayoreo y la factura.

Audiencia terciaria confirmada: aseguradoras y ajustadores, que piden
cotizaciones de valuación completas.

## Product Purpose

Vender refacciones automotrices **de colisión** (facias/defensas, cofres, faros,
calaveras, espejos, salpicaderas, parrillas, puertas) nuevas y usadas en
Monterrey. El sitio no cobra en línea: su trabajo es que el cliente encuentre su
pieza, vea el precio con IVA y **abra una conversación** (chat del asistente,
WhatsApp o llamada) o vaya a sucursal. El éxito se mide en conversaciones
iniciadas y piezas cotizadas, no en carritos.

## Positioning

Cuatro ventajas confirmadas por el cliente como no copiables por la competencia:

1. **Nuevas y usadas bajo el mismo techo.** La misma pieza puede ofrecerse nueva,
   sobre pedido o usada, y el cliente elige por precio. Casi ningún competidor
   combina ambas bodegas.
2. **Las usadas se muestran con la foto real de la pieza exacta que se entrega**
   (no foto de catálogo). El acervo de fotos es un activo que tardaría años en
   replicarse.
3. **Más de 40 años en Monterrey, con dos sucursales físicas y surtido para
   recoger el mismo día**, frente a vendedores en línea sin bodega.
4. **Cotización al momento por WhatsApp 24/7** mediante el asistente, incluso
   fuera de horario.

## Operating Context

- La urgencia ya existe y no hay que fabricarla: el auto está parado, la
  aseguradora presiona y el taller tiene la nave ocupada. El sitio debe
  posicionarse como la resolución más rápida, nunca inventar escasez.
- Mayoría de tráfico esperado en móvil, con frecuencia en condiciones adversas
  (pantalla al sol en el patio de un taller, gama media).
- La conversación ocurre en WhatsApp: es el canal natural del comprador mexicano
  de refacciones.
- Cada pieza usada es única e irrepetible: la escasez ahí sí es real.

## Capabilities and Constraints

- Catálogo real de solo lectura sobre dos bases MySQL distintas: piezas nuevas
  (bdav) y bodega de usado. La web nunca escribe.
- Público visible: descripción, compatibilidades por modelo y año, precio de
  venta **con IVA** y existencia como sí/no. Prohibido exponer costos, utilidad,
  inventario exacto, ubicación en bodega o datos de clientes.
- Sin carrito ni pago en línea en esta fase: la conversión es la conversación.
- Tres formas de compra que el sitio debe saber comunicar: entrega inmediata
  (existencia en tienda), sobre pedido (se consigue, mismo precio de nueva, sin
  prometer plazos ni mencionar al proveedor) y usada.
- Facturación CFDI 4.0.
- El asistente atiende dos canales con el mismo cerebro: el chat del sitio y
  WhatsApp. Su nombre es Vico.

## Brand Commitments

- Nombre: Autopartes Vidaurri (razón social Autopartes Vidaurri, S.A. de C.V.).
- Monograma AV con degradado ámbar→rojo, heredado del sistema interno.
- Asistente llamado **Vico**, presentado siempre como IA y con salida a una
  persona real (teléfono y WhatsApp) permanentemente disponible.
- WhatsApp del asistente: +1 641 658 4476.
- Voz: español mexicano, tuteo imperativo (cotiza, pregunta, llama, recoge).
  Nunca "solicite" ni trato de usted.
- Todo precio se comunica con IVA incluido.

## Evidence on Hand

Real y verificado en esta base de datos:

- 41,948 artículos nuevos con precio; 22 marcas con existencia real, encabezadas
  por Chevrolet (1,731 piezas), Ford (1,272), Toyota (1,197) y Nissan (1,033).
- 17,289 piezas usadas con existencia y su acervo de fotos reales.
- Fotos de producto de artículos nuevos, resueltas por la columna `imagen`.
- Logos de las 22 marcas surtidas, en `public/marcas/`.
- Compatibilidades por modelo y año, y códigos alternos (OEM) para búsqueda.

**Ausencias que el trabajo futuro NO debe fabricar:** no hay testimonios,
reseñas verificadas, calificaciones, número de clientes, tiempos de entrega
comprometidos, porcentajes de descuento ni precios de lista promocionales.

**Datos del negocio pendientes de confirmación** (hoy con marcadores en
`src/config/negocio.ts`, tomados de fuentes públicas): teléfonos por sucursal,
horarios exactos, año real de fundación y la política de garantía verdadera. El
cliente ofreció proporcionarlos; hasta que lleguen, no deben presentarse como
definitivos ni inventarse.

## Product Principles

1. **La mercancía manda.** Piezas reales, con foto y precio con IVA, antes que
   cualquier discurso.
2. **Dos puertas, sin estorbarse.** Público y mayoreo deben encontrar su camino
   desde la portada sin que uno diluya al otro.
3. **Ningún callejón sin salida.** Búsqueda vacía, 404 o pieza agotada siempre
   ofrecen conversación con el contexto ya cargado: cada búsqueda fallida es un
   prospecto.
4. **Solo verdad.** Urgencia real (existencia, pieza única), cero escasez
   inventada, cero datos sin confirmar.
5. **El celular es la sala de exhibición.** Se diseña para una pantalla a pleno
   sol y para que conversar nunca esté a más de un toque.

## Accessibility & Inclusion

Legibilidad en exteriores y en pantallas de gama media es un requisito de uso
real, no una preferencia estética. Áreas táctiles cómodas, campos de formulario
de al menos 16px para evitar el zoom automático de iOS, contraste verificado y
respeto a la preferencia de movimiento reducido.
