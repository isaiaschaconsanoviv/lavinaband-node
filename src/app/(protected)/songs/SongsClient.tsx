'use client';
import React, { useState, useMemo, useEffect } from 'react';
import SuggestSongModal from '@/components/songs/SuggestSongModal';
import SongDetailsModal from '@/components/songs/SongDetailsModal';
import ImportMuflButton from '@/components/ImportMuflButton';

export default function SongsClient({ initialSongs, role }: { initialSongs: any[], role: string }) {
  const [songs, setSongs] = useState(initialSongs);
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);
  
  useEffect(() => {
    setSongs(initialSongs);
  }, [initialSongs]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'title'|'artist'|'key'|'tempo'>('title');
  const [sortDirection, setSortDirection] = useState<'asc'|'desc'>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals state
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);

  // Filters & Sorting logic
  const filteredAndSortedSongs = useMemo(() => {
    let result = [...songs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(song => 
        song.title.toLowerCase().includes(term) || 
        song.artist.toLowerCase().includes(term) ||
        (song.key && song.key.toLowerCase().includes(term))
      );
    }

    result.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [songs, searchTerm, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedSongs.length / itemsPerPage);
  const paginatedSongs = filteredAndSortedSongs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: 'title'|'artist'|'key'|'tempo') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="opacity-0 group-hover:opacity-30 inline-block ml-1">↕</span>;
    return <span className="inline-block ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  if (role === 'GUEST') {
    return (
      <div className="bg-zinc-900/60 p-6 rounded-xl border border-zinc-700/50 text-center text-zinc-400 mt-6">
        No tienes permisos para ver las canciones. Solicita acceso a un administrador.
      </div>
    );
  }

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-2">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Canciones</h1>
          <p className="text-zinc-400 mt-1">Explora el repertorio oficial de La Viña Band</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {role === 'ADMIN' && <ImportMuflButton />}
          <button 
            onClick={() => setIsSuggestModalOpen(true)}
            className="flex-1 md:flex-none px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Sugerir Canción
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input 
          type="text" 
          placeholder="Buscar por título, artista o tono..." 
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl pl-12 pr-4 py-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:bg-zinc-900 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900/40 rounded-xl border border-zinc-700/50 overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-700/50">
              <tr>
                <th className="table-cell md:hidden p-4 w-10"></th>
                <th className="p-4 font-semibold cursor-pointer group hover:text-white transition-colors select-none" onClick={() => handleSort('title')}>
                  <div className="flex items-center">Título <SortIcon field="title" /></div>
                </th>
                <th className="p-4 font-semibold cursor-pointer group hover:text-white transition-colors select-none" onClick={() => handleSort('artist')}>
                  <div className="flex items-center">Artista <SortIcon field="artist" /></div>
                </th>
                <th className="hidden md:table-cell p-4 font-semibold cursor-pointer group hover:text-white transition-colors select-none" onClick={() => handleSort('key')}>
                  <div className="flex items-center">Tono <SortIcon field="key" /></div>
                </th>
                
                <th className="hidden md:table-cell p-4 font-semibold text-center select-none text-zinc-400">
                  <div className="flex items-center justify-center">YouTube</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {paginatedSongs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                      {searchTerm ? 'No se encontraron canciones con esa búsqueda.' : 'Aún no hay canciones en la lista.'}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSongs.map((song: any) => (
                  <React.Fragment key={song._id.toString()}>
                  <tr 
                    onClick={() => setSelectedSong(song)}
                    className="hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="table-cell md:hidden p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSongId(expandedSongId === song._id ? null : song._id);
                        }}
                        className="p-2 -m-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
                      >
                        <svg className={`w-5 h-5 transition-transform ${expandedSongId === song._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </td>
                    
                    <td className="p-4 font-medium text-zinc-200 group-hover:text-blue-400 transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20">
                        <svg className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                      </div>
                      {song.title}
                    </td>
                    <td className="p-4 text-zinc-400">{song.artist}</td>
                    <td className="hidden md:table-cell p-4">
                      {song.key ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
                          {song.key}
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    
                    <td className="hidden md:table-cell p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {song.youtubeLink ? (
                        <a 
                          href={song.youtubeLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center justify-center text-red-500 hover:text-red-400 transition-colors"
                          title="Ver en YouTube"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                        </a>
                      ) : (
                        <span className="text-zinc-700">-</span>
                      )}
                    </td>
                  </tr>
                  
                  {expandedSongId === song._id && (
                    <tr className="md:hidden bg-zinc-800/20">
                      <td colSpan={5} className="p-4 border-t border-zinc-800/50">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 uppercase font-semibold">Tono:</span>
                            {song.key ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {song.key}
                              </span>
                            ) : (
                              <span className="text-zinc-600">-</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 uppercase font-semibold">YouTube:</span>
                            {song.youtubeLink ? (
                              <a 
                                href={song.youtubeLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center justify-center text-red-500 hover:text-red-400 transition-colors p-1"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                              </a>
                            ) : (
                              <span className="text-zinc-700">-</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-700/50 bg-zinc-900/30 flex items-center justify-between">
            <span className="text-sm text-zinc-500">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedSongs.length)} de {filteredAndSortedSongs.length}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SuggestSongModal 
        isOpen={isSuggestModalOpen} 
        onClose={() => setIsSuggestModalOpen(false)} 
        onSuccess={() => {}}
      />
      <SongDetailsModal 
        song={selectedSong} 
        isOpen={!!selectedSong} 
        onClose={() => setSelectedSong(null)} 
      />
    </>
  );
}
