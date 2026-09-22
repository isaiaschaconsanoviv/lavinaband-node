import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ImportMuflButton from '@/components/ImportMuflButton';

export default async function RepertoryPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  await dbConnect();
  
  // Only show active and approved songs in the main repertory list
  const songs = await Song.find({ status: { $in: ['ACTIVE', 'APPROVED'] } }).sort({ title: 1 }).lean();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Canciones</h1>
          <p className="text-zinc-400 mt-1">Lista oficial de canciones de La Viña Band</p>
        </div>
        
        {role !== 'GUEST' && (
          <div className="flex gap-3">
            {role === 'ADMIN' && <ImportMuflButton />}
            <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all shadow-lg">
              + Sugerir Canción
            </button>
          </div>
        )}
      </header>

      {role === 'GUEST' ? (
        <div className="bg-zinc-900/60 p-6 rounded-xl border border-zinc-700/50 text-center text-zinc-400">
          No tienes permisos para ver las canciones. Solicita acceso a un administrador.
        </div>
      ) : (
        <div className="bg-zinc-900/40 rounded-xl border border-zinc-700/50 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-900/90 text-zinc-300 text-sm uppercase tracking-wider [&>tr>th:first-child]:rounded-tl-xl [&>tr>th:last-child]:rounded-tr-xl">
              <tr>
                <th className="p-4 font-semibold">Título</th>
                <th className="p-4 font-semibold">Artista</th>
                <th className="p-4 font-semibold">Tono</th>
                <th className="p-4 font-semibold">Tempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {songs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-400">
                    Aún no hay canciones en la lista.
                  </td>
                </tr>
              ) : (
                songs.map((song: any) => (
                  <tr key={song._id.toString()} className="hover:bg-zinc-700/30 transition-colors">
                    <td className="p-4 font-medium text-zinc-100">{song.title}</td>
                    <td className="p-4 text-zinc-400">{song.artist}</td>
                    <td className="p-4 text-blue-400 font-mono">{song.key || '-'}</td>
                    <td className="p-4 text-zinc-400">{song.tempo ? `${song.tempo} bpm` : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}