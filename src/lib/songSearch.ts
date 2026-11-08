// Búsqueda de canciones por título, artista, tono y letra (en el navegador).
// La usan el listado de canciones y el selector "Seleccionar Canción" del set list.

type SearchableSong = { _id: string; title?: string; artist?: string; key?: string; lyrics?: string };
type SongSearchEntry = { meta: string[]; lines: { text: string; norm: string }[] };
export type SongSearchIndex = Map<string, SongSearchEntry>;

// Sin acentos ni mayúsculas: "senor" encuentra "Señor"
export const normalizeSearch = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// En la letra solo se busca a partir de 3 letras (con menos, casi todas coinciden)
export const MIN_LYRICS_SEARCH = 3;

// Texto ya normalizado de cada canción, para calcularlo una vez por lista y no en cada tecla
export function buildSongSearchIndex(songs: SearchableSong[]): SongSearchIndex {
  return new Map(songs.map(song => {
    const lines = String(song.lyrics || '').split('\n')
      .map(line => line.replace(/\/\//g, '').trim()) // sin las marcas // de repetición
      .filter(Boolean);
    return [song._id, {
      meta: [song.title, song.artist, song.key].filter((f): f is string => Boolean(f)).map(normalizeSearch),
      lines: lines.map(line => ({ text: line, norm: normalizeSearch(line) })),
    }];
  }));
}

// Filtra las canciones. `lyricMatches`: las que tienen lo buscado en la letra → la primera
// línea que coincide, para mostrarla bajo el título (aunque también coincidan por título o
// artista, para que siempre se vea dónde está en la letra).
export function searchSongs<T extends SearchableSong>(songs: T[], index: SongSearchIndex, searchTerm: string) {
  const lyricMatches = new Map<string, string>();
  const term = normalizeSearch(searchTerm.trim());
  if (!term) return { results: songs, lyricMatches };

  const results = songs.filter(song => {
    const entry = index.get(song._id);
    if (!entry) return false;
    const line = term.length >= MIN_LYRICS_SEARCH ? entry.lines.find(l => l.norm.includes(term)) : undefined;
    if (line) lyricMatches.set(song._id, line.text);
    return Boolean(line) || entry.meta.some(field => field.includes(term));
  });
  return { results, lyricMatches };
}
