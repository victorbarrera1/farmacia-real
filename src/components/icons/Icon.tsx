import type { CSSProperties } from 'react';
import {
  MapPin, ShoppingBag, Search, X, LayoutGrid, Clock, Phone, Plus, Check,
  ArrowRight, TriangleAlert, Heart, Activity, Pill, Bike, ShieldCheck, Baby,
  Droplet, Leaf, Sparkles, type LucideIcon,
} from 'lucide-react';
import type { IconId, Ilustracion } from '../../types';

/* Íconos de interfaz → lucide-react. El emblema de marca y los íconos de
   marca (WhatsApp, Instagram) van como SVG propios, porque lucide no los trae. */
const MAPA: Partial<Record<IconId, LucideIcon>> = {
  'i-pin': MapPin,
  'i-bolsa': ShoppingBag,
  'i-lupa': Search,
  'i-x': X,
  'i-grilla': LayoutGrid,
  'i-reloj': Clock,
  'i-tel': Phone,
  'i-mas': Plus,
  'i-cruz': Plus,
  'i-check': Check,
  'i-flecha': ArrowRight,
  'i-alerta': TriangleAlert,
  'i-corazon': Heart,
  'i-pulso': Activity,
  'i-pastilla': Pill,
  'i-moto': Bike,
  'i-escudo': ShieldCheck,
  'i-bebe': Baby,
  'i-gota': Droplet,
  'i-hoja': Leaf,
  'i-perfume': Sparkles,
};

interface IconProps {
  id: IconId;
  className?: string;
  style?: CSSProperties;
}

/** Ícono de interfaz. El tamaño se controla con clases (p. ej. `size-5`). */
export function Icon({ id, className, style }: IconProps) {
  if (id === 'i-emblema') {
    return (
      <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
        <use href="#i-emblema" />
      </svg>
    );
  }
  if (id === 'i-wa') return <WhatsAppGlyph className={className} style={style} />;
  if (id === 'i-ig') return <InstagramGlyph className={className} style={style} />;

  const L = MAPA[id];
  if (!L) return null;
  return <L className={className} style={style} aria-hidden="true" />;
}

/** Ilustración de producto (80×80) referenciando el sprite. */
export function Ilu({ il, className }: { il: Ilustracion; className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <use href={`#il-${il}`} />
    </svg>
  );
}

function WhatsAppGlyph({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.7.2 1.4.2 2 .1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4Z" />
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22.4l5.4-1.4A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.2.8.9-3.1-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
    </svg>
  );
}

function InstagramGlyph({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden="true">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4.8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
