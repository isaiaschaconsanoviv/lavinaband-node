// Letra de las canciones por secciones (formato Holyrics) y su división en "slides"
// para el modo presentador y la vista en vivo de los set lists.
import { detectKey, extractChords, parseKey, semitonesBetween } from '@/lib/chords';

export interface ParsedParagraph {
  header?: string;
  lines: { lyric: string; chord: string }[];
}

export function parseHolyrics(lyrics: string, formatting: string): ParsedParagraph[] | null {
  if (!formatting || !formatting.includes('¦')) return null;

  try {
    const parts = formatting.split(/\n{3,}/);
    if (parts.length < 2) return null;

    const headersBlock = parts[0].split('\n');
    const chordsBlock = parts[parts.length - 1].split('\n');

    // Trim empty lines at start and end of chords block
    while (chordsBlock.length > 0 && chordsBlock[0].trim() === '' && !chordsBlock[0].includes('¦')) {
      chordsBlock.shift();
    }
    while (chordsBlock.length > 0 && chordsBlock[chordsBlock.length - 1].trim() === '' && !chordsBlock[chordsBlock.length - 1].includes('¦')) {
      chordsBlock.pop();
    }

    const lyricParagraphs = (lyrics || '').replace(/\r\n/g, '\n').split(/\n{2,}/);

    const result: ParsedParagraph[] = [];
    const maxLen = Math.max(headersBlock.length, chordsBlock.length, lyricParagraphs.length);

    for (let i = 0; i < maxLen; i++) {
      const header = headersBlock[i]?.trim();
      const chordLine = chordsBlock[i] || '';
      const lyricPara = lyricParagraphs[i] || '';

      const lyricLines = lyricPara.split('\n');
      const chordLines = chordLine.split('¦');

      const linesCount = Math.max(lyricLines.length, chordLines.length);
      const lines = [];

      for (let j = 0; j < linesCount; j++) {
        const l = lyricLines[j] || '';
        const c = chordLines[j] || '';
        if (l.trim() || c.trim() || j === 0) {
          lines.push({ lyric: l, chord: c });
        }
      }

      if (!header && lines.every(l => !l.lyric.trim() && !l.chord.trim())) {
        continue;
      }

      result.push({
        header: header?.startsWith('##') ? header.replace(/##\((.*?)\)/, '$1') : header,
        lines
      });
    }

    return result;
  } catch {
    return null;
  }
}

// Semitonos para mostrar los acordes en el tono guardado de la canción (`key`), desde el
// tono en que están escritos. Sin tono guardado válido se muestran como están escritos.
export function chordOffsetToKey(paragraphs: ParsedParagraph[], key?: string | null) {
  const chordKey = detectKey(extractChords(paragraphs.flatMap(p => p.lines.map(l => l.chord))));
  const baseKey = parseKey(key) ?? chordKey;
  return chordKey && baseKey ? semitonesBetween(chordKey, baseKey) : 0;
}

export interface SongContent {
  _id: unknown;
  title?: string;
  key?: string | null;
  lyrics?: string;
  lyricsHTML?: string;
  formatting?: string;
}

export interface Slide {
  songId: string;
  songTitle: string;
  // Posición de la sección dentro de la canción (lo que se sincroniza en la sesión en vivo)
  section: number;
  header?: string;
  lines: { lyric: string; chord: string }[];
}

// Texto plano de la letra HTML (canciones sin formato Holyrics ni `lyrics`)
function htmlToText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

// Un slide por sección. Con formato Holyrics cada párrafo trae su encabezado y acordes;
// si no, se divide la letra por párrafos (líneas en blanco), sin acordes. Siempre hay al
// menos un slide (vacío si la canción no tiene letra).
export function songSlides(song: SongContent): { slides: Slide[]; offset: number } {
  const songId = String(song._id);
  const songTitle = song.title || '';
  const paragraphs = parseHolyrics(song.lyrics ?? '', song.formatting ?? '');

  if (paragraphs && paragraphs.length > 0) {
    return {
      slides: paragraphs.map((p, section) => ({ songId, songTitle, section, header: p.header, lines: p.lines })),
      offset: chordOffsetToKey(paragraphs, song.key),
    };
  }

  const text = (song.lyrics || (song.lyricsHTML ? htmlToText(song.lyricsHTML) : '')).replace(/\r\n/g, '\n');
  const blocks = text.split(/\n\s*\n/).map(b => b.replace(/^\n+|\n+$/g, '')).filter(b => b.trim());
  if (blocks.length === 0) return { slides: [{ songId, songTitle, section: 0, lines: [] }], offset: 0 };

  return {
    slides: blocks.map((b, section) => ({
      songId,
      songTitle,
      section,
      lines: b.split('\n').map(lyric => ({ lyric, chord: '' })),
    })),
    offset: 0,
  };
}
