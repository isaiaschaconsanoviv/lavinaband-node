'use client';
import { useMemo, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ParsedParagraph {
  header?: string;
  lines: { lyric: string; chord: string }[];
}

function parseHolyrics(lyrics: string, formatting: string): ParsedParagraph[] | null {
  if (!formatting || !formatting.includes('¦')) return null;

  try {
    const parts = formatting.split(/\n{3,}/);
    if (parts.length < 2) return null;

    const headersBlock = parts[0].split('\n');
    let chordsBlock = parts[parts.length - 1].split('\n');
    
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
  } catch (e) {
    return null;
  }
}

export default function SongDetailsModal({ song, isOpen, onClose }: { song: any; isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isEditingYoutube, setIsEditingYoutube] = useState(false);
  const [editYoutubeInput, setEditYoutubeInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (song) {
      setYoutubeLink(song.youtubeLink || '');
    }
    setIsEditingYoutube(false);
  }, [song]);

  const parsedContent = useMemo(() => {
    if (!song) return null;
    return parseHolyrics(song.lyrics, song.formatting);
  }, [song]);

  if (!isOpen || !song) return null;

  let youtubeId = '';
  if (youtubeLink) {
    try {
      const url = new URL(youtubeLink);
      youtubeId = url.searchParams.get('v') || url.pathname.split('/').pop() || '';
    } catch (e) {
      // Invalid URL
    }
  }

  const handleSaveYoutube = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/songs/${song._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeLink: editYoutubeInput })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Enlace de YouTube actualizado');
        setYoutubeLink(editYoutubeInput);
        setIsEditingYoutube(false);
        router.refresh();
      } else {
        toast.error(data.error || 'Error al actualizar enlace');
      }
    } catch (error) {
      toast.error('Error de red al actualizar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-start shrink-0 bg-zinc-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white">{song.title}</h2>
            <p className="text-zinc-400 text-lg">{song.artist}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700 p-2 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          <div className="flex flex-wrap gap-4">
            {song.key && (
              <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <span className="block text-xs text-blue-400 font-medium uppercase">Tono</span>
                <span className="text-lg text-blue-100 font-bold font-mono">{song.key}</span>
              </div>
            )}
            {song.tempo && (
              <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <span className="block text-xs text-purple-400 font-medium uppercase">Tempo</span>
                <span className="text-lg text-purple-100 font-bold">{song.tempo} bpm</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Letra y Acordes
              </h3>
              
              <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-800/50 min-h-[300px] max-h-[600px] overflow-y-auto custom-scrollbar">
                {parsedContent ? (
                  <div className="space-y-6 font-mono text-sm md:text-base leading-relaxed">
                    {parsedContent.map((para, i) => (
                      <div key={i} className="space-y-3">
                        {para.header && (
                          <div className="text-blue-400 font-bold uppercase tracking-wider text-xs bg-blue-500/10 inline-block px-2 py-1 rounded">
                            {para.header}
                          </div>
                        )}
                        <div className="space-y-4">
                          {para.lines.map((line, j) => (
                            <div key={j} className="flex flex-col">
                              {line.chord.trim() && (
                                <div className="text-purple-400 font-bold whitespace-pre min-h-[1.25rem]">
                                  {line.chord.replace(/÷/g, '\n')}
                                </div>
                              )}
                              <div className="text-zinc-200 whitespace-pre min-h-[1.25rem]">
                                {line.lyric}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : song.lyricsHTML ? (
                  <div 
                    className="holyrics-lyrics-html font-sans" 
                    dangerouslySetInnerHTML={{ __html: song.lyricsHTML }} 
                  />
                ) : song.lyrics ? (
                  <pre className="text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed text-sm">
                    {song.lyrics}
                  </pre>
                ) : (
                  <p className="text-zinc-500 italic text-sm text-center mt-10">La letra no está disponible para esta canción.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* YouTube Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                    YouTube
                  </h3>
                  {!isEditingYoutube && (
                    <button 
                      onClick={() => {
                        setEditYoutubeInput(youtubeLink);
                        setIsEditingYoutube(true);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      {youtubeLink ? 'Editar' : 'Añadir link'}
                    </button>
                  )}
                </div>

                {isEditingYoutube ? (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                    <input 
                      type="url" 
                      placeholder="https://youtube.com/watch?v=..."
                      value={editYoutubeInput}
                      onChange={(e) => setEditYoutubeInput(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setIsEditingYoutube(false)}
                        disabled={isSaving}
                        className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSaveYoutube}
                        disabled={isSaving}
                        className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1"
                      >
                        {isSaving ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                ) : youtubeId ? (
                  <div className="rounded-xl overflow-hidden border border-zinc-800 aspect-video bg-black shadow-lg">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed/${youtubeId}`} 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-8 text-center">
                    <p className="text-zinc-500 text-sm">No hay video de YouTube enlazado.</p>
                  </div>
                )}
              </div>
              
              {song.link || song.sheetLink ? (
                <div className="space-y-3">
                   <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Enlaces Útiles</h3>
                   <div className="flex flex-col gap-2">
                     {song.link && (
                       <a href={song.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 transition-colors">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                         Audio / Spotify
                       </a>
                     )}
                     {song.sheetLink && (
                       <a href={song.sheetLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 transition-colors">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                         Partitura / Cifrado
                       </a>
                     )}
                   </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
