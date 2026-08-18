# Farmacias Real — sistema visual del storefront

## Dirección

Catálogo farmacéutico retail orientado a búsqueda: navegación convencional, precio y disponibilidad visibles, alta legibilidad y reserva por WhatsApp. La estética toma la familiaridad estructural de las grandes farmacias, pero conserva la identidad azul marino + rojo de Farmacias Real.

## Tipografía

No fue posible verificar de forma concluyente la familia exacta de `cruzverde.cl` desde sus recursos públicos indexables. Para no atribuir ni copiar una fuente propietaria sin evidencia, el storefront usa una pila neutral de sistema: `Arial, Helvetica, Roboto, sans-serif`. Es rápida, ampliamente disponible, sobria y evita el aspecto geométrico/decorativo típico de plantillas generadas.

- Cuerpo: 16px mínimo, 1.5 de interlineado.
- Etiquetas y metadatos: 12–14px, nunca para información esencial.
- Producto: 15–16px, dos líneas máximo.
- Precio: 22–28px, peso 800.
- Títulos: contraste moderado; no usar titulares gigantes.

## Color

Los tokens canónicos viven en `src/index.css` bajo `@theme`.

- Azul marino: navegación, selección y foco.
- Rojo: acciones comerciales y acentos, nunca estados clínicos.
- Blanco / azul muy claro: superficies.
- Verde: solo disponibilidad y WhatsApp.
- Ámbar: stock bajo y advertencias.

## Geometría y densidad

- Unidad base: 4px.
- Contenedor máximo: 1280px.
- Sidebar desktop: 266px.
- Tarjetas: radio 16–20px, borde de 1px y sombra mínima.
- Botones primarios: píldora, mínimo 44px de alto.
- Inputs: mínimo 46px.
- Grid: 1 columna hasta 374px; 2 desde 375px; 3 en tablet; 3/4 junto al sidebar.

## Interacción: política sin movimiento

El storefront público no usa movimiento decorativo.

- Duración visual: 0ms.
- Sin GSAP, Reveal, autoplay, carruseles, parallax, pulsos, escalado, desplazamiento suave ni apariciones progresivas.
- Hover, foco, selección, drawers y filtros cambian de forma instantánea.
- El foco visible y los estados `aria-*` sí son obligatorios.
- Los modales conservan Escape, backdrop, foco inicial y bloqueo del fondo.

## Arquitectura pública

1. Barra informativa compacta.
2. Cabecera pegajosa: logo, búsqueda, sucursal y pedido.
3. Barra de sucursal móvil.
4. Catálogo inmediato: sidebar de categorías/facetas en desktop; drawers en móvil.
5. Tarjetas de producto con stock, precio efectivo por local y acción.
6. Sucursales compactas.
7. Pie legal.

## Restricciones del negocio

- No hay pago en línea ni despacho.
- El pedido deriva a WhatsApp para cotizar/reservar y retirar presencialmente.
- Los productos con receta son neutrales: sin promoción, CTA específico y sin precio en el mensaje de WhatsApp.
- `st[]`, `vis[]` y `px[]` permanecen alineados por posición con las sucursales.
