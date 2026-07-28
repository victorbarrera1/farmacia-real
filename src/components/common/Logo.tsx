import { Icon } from '../icons/Icon';

/**
 * Logotipo "Farmacias Real". `variant` cambia la paleta:
 * - claro: para cabeceras sobre blanco
 * - oscuro: para el pie (texto blanco, caja del emblema en blanco)
 */
export function Logo({
  variant = 'claro',
  showTagline = true,
}: {
  variant?: 'claro' | 'oscuro';
  showTagline?: boolean;
}) {
  const oscuro = variant === 'oscuro';

  return (
    <a href="#inicio" className="flex items-center gap-[9px] text-texto no-underline shrink-0">
      <span
        className={`grid size-10 place-items-center shrink-0 ${
          oscuro ? 'rounded-md bg-white p-0.5' : ''
        }`}
      >
        <Icon id="i-emblema" className="size-10" />
      </span>
      <span>
        <b
          className={`block text-[1.2rem] font-extrabold leading-none tracking-[-0.03em] ${
            oscuro ? 'text-white' : 'text-azul'
          }`}
        >
          Farmacias <i className={`not-italic ${oscuro ? 'text-[#FF6B6F]' : 'text-rojo'}`}>Real</i>
        </b>
        {showTagline && !oscuro && (
          <small className="mt-[3px] hidden text-[0.64rem] font-bold uppercase tracking-[0.09em] text-gris-2 min-[480px]:block">
            Tu farmacia de barrio
          </small>
        )}
      </span>
    </a>
  );
}
