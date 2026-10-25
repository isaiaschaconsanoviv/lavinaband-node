import { transposeChordLine } from '@/lib/chords';
import type { Slide } from '@/lib/songSlides';

// Una sección de la canción (encabezado, acordes y letra), como en el modal de canción.
// Los tamaños usan `em` para crecer con `fontSize`.
export default function SlideView({ slide, offset, showChords = true, fontSize }: { slide: Slide; offset: number; showChords?: boolean; fontSize: number }) {
  return (
    <div className="font-mono leading-relaxed" style={{ fontSize }}>
      {slide.header && (
        <div className="text-blue-400 font-bold uppercase tracking-wider text-[0.6em] bg-blue-500/10 inline-block px-2 py-1 rounded mb-[0.8em]">
          {slide.header}
        </div>
      )}
      {slide.lines.length === 0 ? (
        <p className="text-zinc-500 italic font-sans text-[0.7em]">La letra no está disponible para esta canción.</p>
      ) : (
        <div className="space-y-[0.6em]">
          {slide.lines.map((line, i) => (
            <div key={i} className="flex flex-col">
              {showChords && line.chord.trim() && (
                <div className="text-purple-400 font-bold whitespace-pre">
                  {transposeChordLine(line.chord, offset).replace(/÷/g, '\n')}
                </div>
              )}
              {/* Sin acordes la letra puede partirse en renglones; con acordes no, para que sigan alineados */}
              <div className={`text-zinc-100 ${showChords ? 'whitespace-pre' : 'whitespace-pre-wrap'}`}>
                {line.lyric || ' '}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
