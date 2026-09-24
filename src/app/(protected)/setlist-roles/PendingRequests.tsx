'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function PendingRequests({ initialRequests }: { initialRequests: any[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (userId: string, action: 'APPROVED' | 'NONE') => {
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/role-requests/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });
      
      const data = await res.json();
      if (res.ok) {
        setRequests(requests.filter(req => req._id !== userId));
        toast.success(action === 'APPROVED' ? 'Solicitud aprobada' : 'Solicitud denegada');
      } else {
        toast.error(data.error || 'Error al procesar solicitud');
      }
    } catch (err) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <div className="bg-zinc-900/60 backdrop-blur border border-yellow-500/30 rounded-xl p-6 shadow-lg mb-8">
      <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        Solicitudes Pendientes para Rol de Set Lists ({requests.length})
      </h3>
      <div className="space-y-3">
        {requests.map(req => (
          <div key={req._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/50">
            <div className="flex items-center gap-3 mb-3 sm:mb-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-zinc-200 border-2" style={{ borderColor: req.roleColor || '#71717a', backgroundColor: `${req.roleColor || '#71717a'}33` }}>
                {req.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-zinc-100">{req.name}</p>
                <p className="text-xs text-zinc-400">{req.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction(req._id, 'APPROVED')}
                disabled={loading === req._id}
                className="flex-1 sm:flex-none px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading === req._id ? '...' : 'Aprobar'}
              </button>
              <button
                onClick={() => handleAction(req._id, 'NONE')}
                disabled={loading === req._id}
                className="flex-1 sm:flex-none px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading === req._id ? '...' : 'Denegar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
