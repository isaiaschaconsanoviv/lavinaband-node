'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import toast from 'react-hot-toast';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

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
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const quillRef = useRef<any>(null);

  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

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

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      const toastId = toast.loading('Subiendo imagen...');
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        const editor = quillRef.current?.getEditor();
        if (editor) {
          const range = editor.getSelection(true);
          editor.insertEmbed(range ? range.index : editor.getLength(), 'image', data.url);
          editor.setSelection(range ? range.index + 1 : editor.getLength());
        }
        toast.success('Imagen subida', { id: toastId });
      } catch (error) {
        toast.error('Error al subir imagen', { id: toastId });
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  const handleEditInit = () => {
    setNewTitle(announcement.title || 'Anuncio sin título');
    setNewText(announcement.text);
    setIsEditing(true);
  };

  const handlePublish = async () => {
    if (!newTitle.trim() || !newText.trim() || newText === '<p><br></p>') return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/announcements/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, text: newText })
      });
      if (!res.ok) throw new Error('Error al actualizar');
      const updated = await res.json();
      setAnnouncement({ ...announcement, title: updated.title, text: updated.text });
      setIsEditing(false);
      toast.success('Anuncio actualizado');
    } catch (err) {
      toast.error('No se pudo guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/announcements/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success('Anuncio eliminado');
      router.push('/dashboard');
    } catch (err) {
      toast.error('No se pudo eliminar');
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

      {isEditing ? (
        <div className="bg-zinc-800/80 rounded-2xl border border-blue-500/30 shadow-inner p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold text-blue-400">Editar Anuncio</h4>
            <button onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-white transition-colors">
              ✕
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Título</label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Ej: Ensayo General"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-zinc-100 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-1">Contenido</label>
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100">
              <ReactQuill
                // @ts-expect-error ReactQuill dynamic import typing issue
                ref={quillRef}
                theme="snow"
                value={newText}
                onChange={setNewText}
                modules={modules}
                placeholder="Escribe tu anuncio aquí..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePublish}
              disabled={isSaving || !newTitle.trim() || !newText.trim() || newText === '<p><br></p>'}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl relative">
          
          {userRole === 'ADMIN' && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
              <button
                onClick={handleEditInit}
                className="p-2 text-blue-400 bg-blue-900/20 hover:bg-blue-900/50 rounded-lg transition-colors"
                title="Editar anuncio"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="p-2 text-red-400 bg-red-900/20 hover:bg-red-900/50 rounded-lg transition-colors"
                title="Eliminar anuncio"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          )}

          <div className="p-6 sm:p-8 border-b border-zinc-800">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight pr-20">{announcement.title}</h1>
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
      )}

      {/* Log de Interacciones */}
      {!isEditing && announcement.reactions && announcement.reactions.length > 0 && (
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(false)}></div>
          <div className="relative bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-white mb-2">Eliminar Anuncio</h3>
            <p className="text-zinc-400 mb-6 text-sm">¿Estás seguro de que deseas eliminar este anuncio? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-600/20 text-sm"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
