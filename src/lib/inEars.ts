// Definiciones compartidas (cliente y servidor) de la sección In-Ears.

// Posiciones del medidor de la consola: de 2 en 2, con saltos de 12 a 15 en los extremos
export const IN_EAR_LEVELS = [-15, -12, -10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10, 12, 15];
export const IN_EAR_MIN = IN_EAR_LEVELS[0];
export const IN_EAR_MAX = IN_EAR_LEVELS[IN_EAR_LEVELS.length - 1];

export const INSTRUMENTS = ['Batería', 'Bajo', 'G. Acústica', 'G. Eléctrica', 'Teclado'] as const;
export type Instrument = typeof INSTRUMENTS[number];

// Identificador de cada instrumento para los IDs de canal (sin puntos ni espacios,
// porque los IDs se usan como llaves en MongoDB)
const INSTRUMENT_SLUGS: Record<Instrument, string> = {
  'Batería': 'bateria',
  'Bajo': 'bajo',
  'G. Acústica': 'guitarra-acustica',
  'G. Eléctrica': 'guitarra-electrica',
  'Teclado': 'teclado',
};

// Volumen general del monitor personal: siempre va arriba y no se reordena
export const MASTER_CHANNEL = 'master';

// Canales fijos que no corresponden a un miembro de la banda
export const FIXED_CHANNELS = [
  { id: 'fixed:pastor', label: 'Pastor', icon: '🎤' },
  { id: 'fixed:multimedia', label: 'Multimedia', icon: '🎶' },
];

export interface InEarChannel {
  id: string;
  // Nombre completo del canal, por ejemplo "G. Eléctrica · Guty Leal"
  label: string;
  // Partes del nombre para mostrarlas en dos renglones: "G. Eléctrica" / "Guty"
  title: string;
  // Solo la primera palabra del nombre del miembro
  member?: string;
  // Ícono que se muestra junto al nombre (solo en el fader, no en notificaciones)
  icon?: string;
  kind: 'voice' | 'instrument' | 'fixed';
  color?: string;
}

export interface BandMember {
  _id: string;
  name: string;
  roleColor?: string;
  isVocalist?: boolean;
  instruments?: string[];
}

// Un miembro tiene mezcla personal si canta o toca algún instrumento
export function isPerformer(member: BandMember) {
  return !!member.isVocalist || (member.instruments?.length ?? 0) > 0;
}

// Canales de la consola a partir de las marcas de los usuarios
export function buildChannels(members: BandMember[]): InEarChannel[] {
  const channels: InEarChannel[] = [];
  for (const member of members) {
    const firstName = member.name.trim().split(/\s+/)[0];
    if (member.isVocalist) {
      channels.push({ id: `voice:${member._id}`, label: `Voz · ${member.name}`, title: 'Voz', member: firstName, kind: 'voice', color: member.roleColor });
    }
    for (const instrument of member.instruments ?? []) {
      if (!INSTRUMENTS.includes(instrument as Instrument)) continue;
      channels.push({ id: `inst:${member._id}:${INSTRUMENT_SLUGS[instrument as Instrument]}`, label: `${instrument} · ${member.name}`, title: instrument, member: firstName, kind: 'instrument', color: member.roleColor });
    }
  }
  for (const fixed of FIXED_CHANNELS) {
    channels.push({ ...fixed, title: fixed.label, kind: 'fixed' });
  }
  return channels;
}

// Aplica el orden guardado de la mezcla; los canales nuevos van al final
export function sortChannels(channels: InEarChannel[], order: string[] = []) {
  const position = new Map(order.map((id, i) => [id, i]));
  return [...channels].sort((a, b) => {
    const pa = position.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const pb = position.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return pa - pb;
  });
}

// Ajusta cualquier valor a la posición válida más cercana del medidor
export function clampLevel(value: number) {
  return IN_EAR_LEVELS.reduce((best, level) => (Math.abs(level - value) < Math.abs(best - value) ? level : best), 0);
}

// Siguiente posición hacia arriba (+1) o hacia abajo (-1)
export function stepLevel(value: number, direction: 1 | -1) {
  const index = IN_EAR_LEVELS.indexOf(clampLevel(value));
  return IN_EAR_LEVELS[Math.max(0, Math.min(IN_EAR_LEVELS.length - 1, index + direction))];
}

export function formatLevel(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

// Cuántos cuadritos del medidor subió (positivo) o bajó (negativo) un canal
export function levelSteps(from: number, to: number) {
  return IN_EAR_LEVELS.indexOf(clampLevel(to)) - IN_EAR_LEVELS.indexOf(clampLevel(from));
}

// Cambio expresado en cuadritos del medidor, por ejemplo "▲ 2 cuadritos" o "▼ 1 cuadrito"
export function formatStepChange(from: number, to: number) {
  const steps = levelSteps(from, to);
  const count = Math.abs(steps);
  return `${steps > 0 ? '▲' : '▼'} ${count} ${count === 1 ? 'cuadrito' : 'cuadritos'}`;
}
