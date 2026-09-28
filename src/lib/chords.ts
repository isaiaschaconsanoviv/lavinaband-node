// Utilidades para analizar y transponer acordes de las canciones.

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const NOTE_INDEX: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, Fb: 4, 'E#': 5, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11, 'B#': 0,
};

// Raíz + alteración + sufijo del acorde (m, 7, maj7, sus4, add9, dim, etc.)
const CHORD_RE = /^([A-G])(#|b)?((?:maj|min|dim|aug|sus|add|m|M|\+|°|ø|º|b|#|\d)*)$/;

// Separadores dentro de una línea de acordes que no forman parte del acorde
const DELIMITER_RE = /([\s\-\/(),\[\]|>*÷¦]+)/;

export interface ParsedChord {
  root: number;
  suffix: string;
  isMinor: boolean;
}

export function parseChord(token: string): ParsedChord | null {
  const match = CHORD_RE.exec(token);
  if (!match) return null;
  const [, letter, accidental = '', suffix] = match;
  return {
    root: NOTE_INDEX[letter + accidental],
    suffix,
    isMinor: /^m(?!aj)/.test(suffix) || suffix.startsWith('min'),
  };
}

export function transposeNote(index: number, semitones: number) {
  return NOTES[(((index + semitones) % 12) + 12) % 12];
}

function transposeToken(token: string, semitones: number) {
  const chord = parseChord(token);
  if (!chord) return token;
  return transposeNote(chord.root, semitones) + chord.suffix;
}

// Transpone una línea de acordes conservando la alineación con la letra:
// si un acorde crece (C -> C#) se consume un espacio de los siguientes, y si
// se acorta se agrega uno, para que los acordes sigan sobre la misma sílaba.
export function transposeChordLine(line: string, semitones: number) {
  if (!semitones || !line) return line;

  let result = '';
  let debt = 0; // caracteres de más (positivo) o de menos (negativo) acumulados

  for (const part of line.split(DELIMITER_RE)) {
    if (!part) continue;

    if (DELIMITER_RE.test(part)) {
      if (/^ +$/.test(part) && debt !== 0) {
        const newLength = Math.max(1, part.length - debt);
        debt -= part.length - newLength;
        result += ' '.repeat(newLength);
      } else {
        result += part;
        if (/[÷¦\n]/.test(part)) debt = 0;
      }
      continue;
    }

    const transposed = transposeToken(part, semitones);
    debt += transposed.length - part.length;
    result += transposed;
  }

  return result;
}

// Extrae los acordes válidos de una o varias líneas de acordes
export function extractChords(lines: string[]) {
  const chords: ParsedChord[] = [];
  for (const line of lines) {
    for (const part of line.split(DELIMITER_RE)) {
      const chord = part && parseChord(part);
      if (chord) chords.push(chord);
    }
  }
  return chords;
}

export interface SongKey {
  root: number;
  isMinor: boolean;
}

export function parseKey(value?: string | null): SongKey | null {
  if (!value) return null;
  const chord = parseChord(value.trim());
  return chord ? { root: chord.root, isMinor: chord.isMinor } : null;
}

export function keyName(key: SongKey, semitones = 0) {
  return transposeNote(key.root, semitones) + (key.isMinor ? 'm' : '');
}

// Grados de una tonalidad mayor: [intervalo desde la tónica, es menor]
const MAJOR_DEGREES: [number, boolean][] = [
  [0, false], [2, true], [4, true], [5, false], [7, false], [9, true],
];

// Detecta la tonalidad a partir de los acordes: la tonalidad mayor cuyos
// acordes diatónicos (I, ii, iii, IV, V, vi) aparecen más, con más peso para
// la tónica, el IV y el V. Si la canción empieza y termina en el vi, es menor.
export function detectKey(chords: ParsedChord[]): SongKey | null {
  if (chords.length === 0) return null;

  const weights = [3, 1, 1, 2, 2, 1.5];
  let best: { root: number; score: number } | null = null;

  for (let root = 0; root < 12; root++) {
    let score = 0;
    for (const chord of chords) {
      const interval = (chord.root - root + 12) % 12;
      const degree = MAJOR_DEGREES.findIndex(([i, minor]) => i === interval && minor === chord.isMinor);
      if (degree !== -1) score += weights[degree];
      else if (MAJOR_DEGREES.some(([i]) => i === interval)) score += 0.25;
      else score -= 0.5;
    }
    // La primera y la última nota suelen ser la tónica
    if (chords[0].root === root && !chords[0].isMinor) score += 2;
    const last = chords[chords.length - 1];
    if (last.root === root && !last.isMinor) score += 2;

    if (!best || score > best.score) best = { root, score };
  }

  if (!best) return null;

  const relativeMinor = (best.root + 9) % 12;
  const first = chords[0];
  const last = chords[chords.length - 1];
  if (first.root === relativeMinor && first.isMinor && last.root === relativeMinor && last.isMinor) {
    return { root: relativeMinor, isMinor: true };
  }
  return { root: best.root, isMinor: false };
}

// Etiqueta de un paso de transposición: +0.5 A#, +1 B, +1.5 C, ...
export function transposeLabel(key: SongKey, semitones: number) {
  const tones = semitones / 2;
  return `+${tones} ${keyName(key, semitones)}`;
}

// Semitonos para pasar de un tono a otro. Los tonos menores se comparan por su
// relativa mayor, así Cm y D# (misma armadura) dan 0.
export function semitonesBetween(from: SongKey, to: SongKey) {
  const majorRoot = (key: SongKey) => (key.isMinor ? key.root + 3 : key.root) % 12;
  return (majorRoot(to) - majorRoot(from) + 12) % 12;
}

// Etiqueta de la posición del capo: formas de acordes que se tocan con él puesto
export function capoLabel(key: SongKey, capo: number) {
  return capo === 0 ? 'Sin capo' : `Capo ${capo} · formas en ${keyName(key, -capo)}`;
}
