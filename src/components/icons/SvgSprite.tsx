/* ================================================================
   Sprite SVG: emblema de marca + ilustraciones de producto.
   Los íconos de interfaz vienen de lucide-react (ver Icon.tsx).
   Se monta una vez y el resto referencia con <use href="#id">.
   Se inyecta como HTML crudo para conservar los atributos SVG tal cual.
   ================================================================ */
const SPRITE = `<defs>
  <!-- Emblema aproximado del logo del local: octágono azul con acentos rojos
       y la copa de Higía al centro. Reemplazar por el archivo original del
       dueño (SVG o PNG) cuando lo entregue. -->
  <g id="i-emblema">
    <path d="M17.66 1H6.34L1 6.34v11.32L6.34 23h11.32L23 17.66V6.34z" fill="#D6202A"/>
    <path d="M17.04 2.5H6.96L2.5 6.96v10.08l4.46 4.46h10.08l4.46-4.46V6.96z" fill="#1B2A55"/>
    <circle cx="12" cy="12" r="6.55" fill="#fff"/>
    <path d="M8.6 8.15h6.8c0 3.1-1.55 4.75-2.75 5.2v1.5h2.15v1.5H9.2v-1.5h2.15v-1.5c-1.2-.45-2.75-2.1-2.75-5.2z" fill="#D6202A"/>
    <path d="M14.75 8.15c.75-2.5-.5-3.85-1.95-3.5-1.3.3-1.5 2-.2 2.4" fill="none" stroke="#D6202A" stroke-width="1.45" stroke-linecap="round"/>
  </g>

  <!-- ilustraciones de producto (80x80) -->
  <g id="il-caja"><rect x="14" y="21" width="52" height="42" rx="4" fill="#E7EBF5" stroke="#1B2A55" stroke-width="2.4"/><path d="M14 33h52" stroke="#1B2A55" stroke-width="1.6" opacity=".55"/><rect x="21" y="41" width="24" height="4" rx="2" fill="#1B2A55" opacity=".38"/><rect x="21" y="49" width="15" height="4" rx="2" fill="#1B2A55" opacity=".22"/><path d="M55 44h7M58.5 40.5v7" stroke="#D6202A" stroke-width="2.8" stroke-linecap="round"/></g>
  <g id="il-frasco"><rect x="32" y="11" width="16" height="9" rx="2" fill="#1B2A55" opacity=".42"/><path d="M28 27a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v33a4 4 0 0 1-4 4H32a4 4 0 0 1-4-4z" fill="#E7EBF5" stroke="#1B2A55" stroke-width="2.4"/><rect x="33" y="37" width="14" height="17" rx="2" fill="#fff" stroke="#1B2A55" stroke-width="1.6"/></g>
  <g id="il-tubo"><rect x="34" y="9" width="12" height="8" rx="2" fill="#1B2A55" opacity=".42"/><path d="M29 20h22l2.5 40A5 5 0 0 1 48.5 65h-17A5 5 0 0 1 26.5 60z" fill="#E7EBF5" stroke="#1B2A55" stroke-width="2.4"/><rect x="32" y="34" width="16" height="4.5" rx="2.2" fill="#1B2A55" opacity=".35"/><rect x="32" y="43" width="11" height="4.5" rx="2.2" fill="#1B2A55" opacity=".22"/></g>
  <g id="il-bomba"><path d="M40 7v11M40 11h9" stroke="#1B2A55" stroke-width="2.6" stroke-linecap="round"/><rect x="34" y="18" width="12" height="9" rx="2" fill="#1B2A55" opacity=".42"/><rect x="25" y="27" width="30" height="37" rx="5" fill="#E7EBF5" stroke="#1B2A55" stroke-width="2.4"/><rect x="31" y="38" width="18" height="15" rx="2" fill="#fff" stroke="#1B2A55" stroke-width="1.6"/></g>
  <g id="il-tarro"><ellipse cx="40" cy="20" rx="18" ry="5.5" fill="#1B2A55" opacity=".35"/><path d="M22 20v39a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V20" fill="#E7EBF5" stroke="#1B2A55" stroke-width="2.4"/><rect x="29" y="33" width="22" height="15" rx="2" fill="#fff" stroke="#1B2A55" stroke-width="1.6"/></g>
  <g id="il-paquete"><path d="M18 25h44v34a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4z" fill="#E7EBF5" stroke="#1B2A55" stroke-width="2.4"/><path d="M18 25l6-9h32l6 9" fill="none" stroke="#1B2A55" stroke-width="2.4" stroke-linejoin="round"/><rect x="27" y="39" width="26" height="4.5" rx="2.2" fill="#1B2A55" opacity=".35"/><rect x="27" y="48" width="16" height="4.5" rx="2.2" fill="#1B2A55" opacity=".22"/></g>
  <g id="il-aparato"><rect x="16" y="19" width="48" height="34" rx="5" fill="#E7EBF5" stroke="#1B2A55" stroke-width="2.4"/><rect x="24" y="26" width="32" height="15" rx="2" fill="#fff" stroke="#1B2A55" stroke-width="1.6"/><path d="M28 34h4.5l2-4.5 3 9 2-4.5H52" fill="none" stroke="#1B2A55" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="26" cy="47" r="2.6" fill="#1B2A55" opacity=".45"/><path d="M30 53v10M50 53v10" stroke="#1B2A55" stroke-width="2.4" stroke-linecap="round"/></g>
  <g id="il-inhalador"><rect x="32" y="9" width="13" height="19" rx="3.5" fill="#1B2A55" opacity=".4"/><path d="M27 28h22a4 4 0 0 1 4 4v9H23v-9a4 4 0 0 1 4-4z" fill="#E7EBF5" stroke="#1B2A55" stroke-width="2.4"/><path d="M23 41h30l-4 21a4 4 0 0 1-4 3.4H31A4 4 0 0 1 27 62z" fill="#E7EBF5" stroke="#1B2A55" stroke-width="2.4"/></g>
  <g id="il-sobre"><rect x="17" y="22" width="46" height="37" rx="4" fill="#E7EBF5" stroke="#1B2A55" stroke-width="2.4"/><path d="M17 32h46" stroke="#1B2A55" stroke-width="1.6" opacity=".55"/><rect x="25" y="40" width="26" height="4.5" rx="2.2" fill="#1B2A55" opacity=".35"/><rect x="25" y="49" width="16" height="4.5" rx="2.2" fill="#1B2A55" opacity=".22"/></g>
  <g id="il-perfume"><rect x="32" y="10" width="16" height="9" rx="2" fill="#1B2A55" opacity=".45"/><path d="M35 19h10v7H35z" fill="#D6202A" opacity=".75"/><path d="M25 34a8 8 0 0 1 8-8h14a8 8 0 0 1 8 8v25a6 6 0 0 1-6 6H31a6 6 0 0 1-6-6z" fill="#E7EBF5" stroke="#1B2A55" stroke-width="2.4"/><rect x="31" y="38" width="18" height="14" rx="3" fill="#fff" stroke="#D6202A" stroke-width="1.8"/><path d="M36 45h8" stroke="#1B2A55" stroke-width="2" stroke-linecap="round"/></g>
</defs>`;

export function SvgSprite() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute' }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: SPRITE }}
    />
  );
}
