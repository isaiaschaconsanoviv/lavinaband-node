'use client';

import React, { useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface Announcement {
  _id?: string;
  id?: string;
  title?: string;
  text: string;
  date: string;
  author: string;
  reactions?: { userId: string, type: string }[];
}

interface BulletinBoardCardProps {
  initialAnnouncements: Announcement[];
  role: string;
  userName: string;
}

export default function BulletinBoardCard({ initialAnnouncements, role, userName }: BulletinBoardCardProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements || []);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  
  // Modal State
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(announcements.length / itemsPerPage));
  const currentAnnouncements = useMemo(() => {
    return announcements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [announcements, currentPage]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const quillRef = useRef<any>(null);

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
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  const handleSaveList = async (updatedList: Announcement[], isNew?: boolean, newTitle?: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcements: updatedList, isNew, newTitle })
      });
      if (!res.ok) throw new Error('Error al guardar');
      setAnnouncements(updatedList);
      toast.success('Tablón actualizado');
    } catch (error) {
      toast.error('No se pudo guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = () => {
    if (!newTitle.trim() || !newText.trim() || newText === '<p><br></p>') return;
    
    let updatedList;
    let isNewAnnouncement = false;
    
    if (editId) {
      // Update existing
      updatedList = announcements.map(a => 
        (a._id || a.id) === editId ? { ...a, title: newTitle, text: newText } : a
      );
    } else {
      // Create new
      isNewAnnouncement = true;
      const newAnnouncement: Announcement = {
        id: Date.now().toString(),
        title: newTitle,
        text: newText,
        date: new Date().toISOString(),
        author: userName || 'Admin'
      };
      updatedList = [newAnnouncement, ...announcements];
    }
    
    handleSaveList(updatedList, isNewAnnouncement, newTitle);
    
    // Reset form
    setNewTitle('');
    setNewText('');
    setEditId(null);
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    const updatedList = announcements.filter(a => (a._id || a.id) !== id);
    handleSaveList(updatedList);
  };
  
  const handleEditInit = (ann: Announcement) => {
    setNewTitle(ann.title || 'Anuncio sin título');
    setNewText(ann.text);
    setEditId((ann._id || ann.id) as string);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setNewTitle('');
    setNewText('');
    setEditId(null);
    setIsEditing(false);
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl p-6 shadow-lg md:col-span-3">
      <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          Tablón de Anuncios
        </h3>
        {role === 'ADMIN' && !isEditing && (
          <button 
            onClick={() => {
              setEditId(null);
              setNewTitle('');
              setNewText('');
              setIsEditing(true);
            }}
            className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
          >
            Nuevo Anuncio
          </button>
        )}
      </div>

      {isEditing && role === 'ADMIN' && (
        <div className="mb-8 p-5 bg-zinc-800/80 rounded-xl border border-blue-500/30 shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-blue-400">{editId ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}</h4>
            <button onClick={handleCancelEdit} className="text-zinc-400 hover:text-white transition-colors">
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
              onClick={handleCancelEdit}
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handlePublish}
              disabled={isSaving || !newTitle.trim() || !newText.trim() || newText === '<p><br></p>'}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : (editId ? 'Actualizar' : 'Publicar')}
            </button>
          </div>
        </div>
      )}

      {/* List View */}
      <div className="flex flex-col mb-4">
        {announcements.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 italic bg-zinc-800/20 rounded-xl border border-zinc-800/50">
            No hay anuncios publicados.
          </div>
        ) : (
          currentAnnouncements.map((ann) => (
            <div 
              key={ann._id || (ann._id || ann.id)} 
              className="group relative flex flex-col sm:flex-row sm:items-center justify-between py-5 px-2 sm:px-4 border-b border-zinc-800/80 last:border-0 hover:bg-zinc-800/30 rounded-lg transition-colors cursor-pointer -mx-2 sm:-mx-4"
              onClick={() => window.location.href = `/anuncios/${ann._id || (ann._id || ann.id)}`}
            >
              <div className="flex-1 pr-4">
                <h4 className="text-xl font-bold text-blue-400 mb-2 group-hover:text-blue-300 transition-colors">
                  {ann.title || 'Anuncio sin título'}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                      {ann.author.charAt(0).toUpperCase()}
                    </div>
                    <span>{ann.author}</span>
                  </div>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <span className="text-zinc-500">{format(new Date(ann.date), "d MMM yyyy, HH:mm", { locale: es })}</span>
                  {ann.reactions && ann.reactions.length > 0 && (() => {
                    const uniqueReactions = Array.from(new Set(ann.reactions.map(r => r.type)));
                    const emojiMap: Record<string, string> = { LIKE: '👍', LOVE: '❤️', AMEN: '🙏', PRAY: '🙌' };
                    return (
                      <>
                        <span className="text-zinc-600 hidden sm:inline">•</span>
                        <div className="flex items-center gap-1 bg-zinc-800/50 px-2 py-0.5 rounded-full border border-zinc-700/50 shadow-sm">
                          <div className="flex -space-x-1.5">
                            {uniqueReactions.slice(0, 3).map(type => (
                              <span key={type} className="text-[12px] bg-zinc-900 rounded-full w-5 h-5 flex items-center justify-center border border-zinc-700">{emojiMap[type]}</span>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-zinc-300 ml-1">{ann.reactions.length}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {role === 'ADMIN' && (
                <div className="absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mt-4 sm:mt-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEditInit(ann); }}
                    className="p-2 text-blue-400 bg-blue-900/20 hover:bg-blue-900/50 rounded-lg transition-colors"
                    title="Editar anuncio"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId((ann._id || ann.id) as string); }}
                    className="p-2 text-red-400 bg-red-900/20 hover:bg-red-900/50 rounded-lg transition-colors"
                    title="Eliminar anuncio"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="relative bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-white mb-2">Eliminar Anuncio</h3>
            <p className="text-zinc-400 mb-6 text-sm">¿Estás seguro de que deseas eliminar este anuncio? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  handleDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
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
