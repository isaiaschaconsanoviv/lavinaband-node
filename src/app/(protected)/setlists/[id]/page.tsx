'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DatePicker from '@/components/DatePicker';
import ConfirmModal from '@/components/ConfirmModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, song, onRemove, onUpdateSong }: { id: string, song: any, onRemove: (id: string) => void, onUpdateSong: (id: string, updates: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  
  const [isEditingYt, setIsEditingYt] = useState(false);
  const [ytLink, setYtLink] = useState(song.youtubeLink || '');

  const saveYtLink = async () => {
    const res = await fetch(`/api/songs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtubeLink: ytLink })
    });
    if (res.ok) {
      onUpdateSong(id, { youtubeLink: ytLink });
      setIsEditingYt(false);
    }
  };

  const removeYtLink = async () => {
    const res = await fetch(`/api/songs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtubeLink: '' })
    });
    if (res.ok) {
      onUpdateSong(id, { youtubeLink: '' });
      setYtLink('');
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 bg-zinc-900/60 p-4 rounded-lg border border-zinc-700/50">
      <div {...attributes} {...listeners} className="cursor-grab text-zinc-500 hover:text-zinc-300">
        ☰
      </div>
      <div className="flex-1">
        <h4 className="font-medium flex items-center gap-2">
          {song.title}
          {song.youtubeLink && !isEditingYt && (
            <a href={song.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 transition-colors drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" title="Ver en YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
          )}
        </h4>
        <p className="text-sm text-zinc-400">{song.artist} • {song.key || '-'}</p>
        
        {isEditingYt && (
          <div className="mt-3 flex gap-2">
            <input 
              type="text" 
              value={ytLink} 
              onChange={e => setYtLink(e.target.value)} 
              placeholder="https://youtube.com/..." 
              className="flex-1 bg-zinc-800 text-sm p-1.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500 text-white"
            />
            <button onClick={saveYtLink} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-lg font-medium">Guardar</button>
            <button onClick={() => setIsEditingYt(false)} className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 rounded-lg font-medium">Cancelar</button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isEditingYt && (
          <button onClick={() => setIsEditingYt(true)} className="flex items-center gap-1 text-zinc-400 p-2" title={song.youtubeLink ? "Editar Link YouTube" : "Añadir YouTube"}>
            {!song.youtubeLink && <span className="flex items-center gap-1 text-xs font-medium"><svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-50 hover:opacity-100 hover:text-red-500 transition-all"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg></span>}
            {song.youtubeLink && <span className="text-xs font-semibold hover:text-blue-400">Editar</span>}
          </button>
        )}
        {song.youtubeLink && !isEditingYt && (
          <button onClick={removeYtLink} className="text-zinc-500 hover:text-red-400 text-xs font-semibold p-2" title="Quitar YouTube">✕</button>
        )}
        <button onClick={() => onRemove(id)} className="text-red-400 hover:text-red-300 text-xs font-semibold p-2 border-l border-zinc-700 ml-2 pl-4">Quitar</button>
      </div>
    </div>
  );
}

export default function SetlistDetailPage() {
  const params = useParams();
  const [setlist, setSetlist] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/users').then(res => res.json()).then(data => { if(data.success) setUsers(data.data); });
    fetch(`/api/setlists/${params.id}`, { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d.success) setSetlist(d.data);
      setLoading(false);
    });
    fetch('/api/songs?status=ACTIVE,APPROVED', { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d.success) setAllSongs(d.data);
    });
  }, [params.id]);

  const saveSetlist = async (updatedData: any) => {
    setSetlist(updatedData);
    await fetch(`/api/setlists/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
  };

  const confirmDelete = async () => {
      await fetch('/api/setlists/' + params.id, { method: 'DELETE' });
      window.location.href = '/setlists';
    };
    const deleteSetlist = () => setShowDeleteModal(true);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = setlist.songs.findIndex((s: any) => s.song._id === active.id);
      const newIndex = setlist.songs.findIndex((s: any) => s.song._id === over.id);
      
      const newSongs = [...setlist.songs];
      const [moved] = newSongs.splice(oldIndex, 1);
      newSongs.splice(newIndex, 0, moved);
      
      newSongs.forEach((s, idx) => s.order = idx);
      saveSetlist({ ...setlist, songs: newSongs });
    }
  };


  const updateSongInSetlist = (songId: string, updates: any) => {
    const newSongs = setlist.songs.map((s: any) => {
      if (s.song._id === songId) {
        return { ...s, song: { ...s.song, ...updates } };
      }
      return s;
    });
    setSetlist({ ...setlist, songs: newSongs });
    setAllSongs(prev => prev.map(song => song._id === songId ? { ...song, ...updates } : song));
  };

  const toggleAttendance = (user: any, checked: boolean) => {
    const currentAttendance = setlist.attendance || [];
    const existingIndex = currentAttendance.findIndex((a: any) => (a.user?._id || a.user) === user._id);
    
    let newAttendance = [...currentAttendance];
    if (existingIndex >= 0) {
      newAttendance[existingIndex].status = checked ? 'CONFIRMED' : 'DECLINED';
    } else {
      newAttendance.push({ user: user._id, status: checked ? 'CONFIRMED' : 'DECLINED' });
    }
    
    const updated = { ...setlist, attendance: newAttendance };
    saveSetlist(updated);
  };
  
  const addSong = (song: any) => {
    if (setlist.songs.find((s: any) => s.song._id === song._id)) return;
    const newSongs = [...setlist.songs, { song, order: setlist.songs.length }];
    saveSetlist({ ...setlist, songs: newSongs });
    setShowSelector(false);
  };

  const removeSong = (songId: string) => {
    const newSongs = setlist.songs.filter((s: any) => s.song._id !== songId);
    newSongs.forEach((s: any, idx: number) => s.order = idx);
    saveSetlist({ ...setlist, songs: newSongs });
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Cargando...</div>;
  if (!setlist) return <div className="p-8 text-center text-red-400">No se encontró el setlist.</div>;

  const filteredSongs = allSongs.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <header className="flex justify-between items-center bg-zinc-900/40 p-6 rounded-xl border border-zinc-700/50">
        <div className="w-full sm:w-auto flex-1 mr-4">
          <input 
            type="text" 
            className="text-3xl font-bold bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-blue-500 focus:outline-none w-full mb-3"
            value={setlist.title}
            onChange={(e) => setSetlist({ ...setlist, title: e.target.value })}
            onBlur={() => saveSetlist(setlist)}
          />
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Ensayo:</span>
              <DatePicker 
                value={setlist.rehearsalDate}
                onChange={(date) => { 
                  const updated = { ...setlist, rehearsalDate: date.toISOString() };
                  setSetlist(updated);
                  saveSetlist(updated);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Evento:</span>
              <DatePicker 
                value={setlist.date}
                onChange={(date) => { 
                  const updated = { ...setlist, date: date.toISOString() };
                  setSetlist(updated);
                  saveSetlist(updated);
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={deleteSetlist} className="px-4 py-2 bg-red-900/40 hover:bg-red-600/80 text-red-400 hover:text-white border border-red-900/50 hover:border-red-600 rounded-lg font-medium transition-colors">
            Eliminar
          </button>
          <button onClick={() => setShowSelector(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium">
            + Añadir Canción
          </button>
        </div>
      </header>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar Set List"
        message="¿Estás seguro de que quieres eliminar este set list? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDanger={true}
      />


      


      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Canciones</h2>
          {setlist.songs.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 bg-zinc-900/30 rounded-xl border border-zinc-700/30">
              No hay canciones en este setlist.
            </div>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={setlist.songs.map((s:any) => s.song._id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {setlist.songs.map((item: any) => (
                    <SortableItem key={item.song._id} id={item.song._id} song={item.song} onRemove={removeSong} onUpdateSong={updateSongInSetlist} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Notas</h2>
          <textarea 
            className="w-full h-32 bg-zinc-900/60 p-4 rounded-xl border border-zinc-700/50 focus:outline-none focus:border-blue-500 text-zinc-300 resize-none"
            placeholder="Notas para el ensayo..."
            value={setlist.notes || ''}
            onChange={(e) => setSetlist({ ...setlist, notes: e.target.value })}
            onBlur={() => saveSetlist(setlist)}
          />

          <h2 className="text-xl font-semibold mt-8">Asistencia</h2>
                      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-700/50 space-y-3">
              {users.map((user: any) => {
                const isAttending = setlist.attendance?.some((a: any) => (a.user?._id || a.user) === user._id && a.status === 'CONFIRMED');
                return (
                  <label key={user._id} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                    <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors border ${isAttending ? 'bg-blue-600 border-blue-500' : 'bg-zinc-800 border-zinc-600 group-hover:border-zinc-400'}`}>
                      {isAttending && <span className="text-white text-sm font-bold">✓</span>}
                    </div>
                    <input 
                      type="checkbox"
                      checked={!!isAttending}
                      onChange={(e) => toggleAttendance(user, e.target.checked)}
                      className="hidden"
                    />
                    <span className={`transition-colors ${isAttending ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{user.name}</span>
                  </label>
                )
              })}
            </div>
        </div>
      </div>

      {showSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Seleccionar Canción</h3>
              <button onClick={() => setShowSelector(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 border-b border-zinc-800">
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-zinc-800 p-2 rounded-lg text-white focus:outline-none" />
            </div>
            <div className="overflow-y-auto p-2">
              {filteredSongs.map(song => (
                <button key={song._id} onClick={() => addSong(song)} className="w-full text-left p-3 hover:bg-zinc-800 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium text-zinc-200">{song.title}</div>
                    <div className="text-sm text-zinc-500">{song.artist}</div>
                  </div>
                  <div className="text-sm text-blue-400">{song.key}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
