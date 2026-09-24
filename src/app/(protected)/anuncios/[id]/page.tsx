'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSession } from 'next-auth/react';

const REACTION_EMOJIS: Record<string, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  AMEN: '🙏',
  PRAY: '🙌'
};

export default function AnnouncementPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    fetch(`/api/announcements/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setAnnouncement(data);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Error de conexión');
        setLoading(false);
      });
  }, [params.id]);

  const toggleReaction = async (type: string) => {
    if (!userId) return;
    
    // Optimistic UI update
    const previousAnn = { ...announcement };
    const newAnn = { ...announcement };
    const existingIndex = newAnn.reactions.findIndex((r: any) => r.userId === userId);
    
    if (existingIndex >= 0) {
      if (newAnn.reactions[existingIndex].type === type) {
        newAnn.reactions.splice(existingIndex, 1);
      } else {
        newAnn.reactions[existingIndex].type = type;
      }
    } else {
      newAnn.reactions.push({ userId, type });
    }
    setAnnouncement(newAnn);

    // API call
    try {
      const res = await fetch(`/api/announcements/${params.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setAnnouncement(updated);
    } catch (err) {
      setAnnouncement(previousAnn); // Rollback
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Cargando anuncio...</div>;
  if (error || !announcement) return <div className="p-8 text-center text-red-400">No se encontró el anuncio.</div>;

  // Aggregate reactions for display
  const reactionCounts: Record<string, number> = {};
  announcement.reactions.forEach((r: any) => {
    reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
  });

  const myReaction = announcement.reactions.find((r: any) => r.userId === userId)?.type;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <button 
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        Volver al Dashboard
      </button>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 sm:p-8 border-b border-zinc-800">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">{announcement.title}</h1>
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold border border-zinc-700">
                {announcement.author.charAt(0).toUpperCase()}
              </div>
              {announcement.author}
            </span>
            <span>•</span>
            <span>{format(new Date(announcement.date), "d 'de' MMMM yyyy, HH:mm", { locale: es })}</span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div 
            className="prose prose-invert prose-lg max-w-none w-full text-zinc-300 leading-relaxed break-words whitespace-pre-wrap [&_img]:rounded-xl [&_img]:shadow-lg [&_img]:!max-w-full [&_img]:h-auto [&_img]:mx-auto [&_img]:my-6 [&_a]:text-blue-400 hover:[&_a]:underline [&_*]:!max-w-full"
            dangerouslySetInnerHTML={{ __html: announcement.text.replace(/&nbsp;/g, ' ') }}
          />
        </div>

        {/* Reactions Section */}
        <div className="bg-zinc-900/40 p-4 sm:p-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-zinc-800/50 p-1.5 rounded-full border border-zinc-700/50 backdrop-blur-sm">
            {Object.keys(REACTION_EMOJIS).map(type => {
              const isSelected = myReaction === type;
              return (
                <button
                  key={type}
                  onClick={() => toggleReaction(type)}
                  className={`relative p-2.5 rounded-full text-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${isSelected ? 'bg-zinc-700/80 shadow-md ring-1 ring-zinc-600' : 'hover:bg-zinc-700/50 grayscale hover:grayscale-0 opacity-70 hover:opacity-100'}`}
                  title={`Reaccionar con ${REACTION_EMOJIS[type]}`}
                >
                  {REACTION_EMOJIS[type]}
                  {reactionCounts[type] > 0 && (
                    <span className="absolute -bottom-1 -right-1 bg-zinc-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-zinc-700">
                      {reactionCounts[type]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-sm text-zinc-500 font-medium flex items-center gap-2">
            {announcement.reactions.length} {announcement.reactions.length === 1 ? 'reacción' : 'reacciones'} en total
          </div>
        </div>
      </div>

      {/* Log de Interacciones */}
      {announcement.reactions && announcement.reactions.length > 0 && (
        <div className="mt-8 border-t border-zinc-800 pt-6">
          <h4 className="text-lg font-bold text-zinc-300 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Reacciones ({announcement.reactions.length})
          </h4>
          <div className="space-y-3">
            {[...announcement.reactions].sort((a, b) => new Date(b.createdAt || announcement.date || 0).getTime() - new Date(a.createdAt || announcement.date || 0).getTime()).map((r, index) => {
              const userName = typeof r.userId === 'object' && r.userId.name ? r.userId.name : 'Usuario';
              const emojiMap: Record<string, string> = { LIKE: '👍', LOVE: '❤️', AMEN: '🙏', PRAY: '🙌' };
              const emoji = emojiMap[r.type as keyof typeof emojiMap] || r.type;
              return (
                <div key={r._id || index} className="flex items-center gap-3 bg-zinc-800/20 p-3 rounded-lg border border-zinc-800/50">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-300">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-zinc-200">
                      <span className="font-semibold text-blue-400">{userName}</span> reaccionó con <span className="text-lg ml-1">{emoji}</span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {format(new Date(r.createdAt || announcement.date || new Date()), "d MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  );
}
