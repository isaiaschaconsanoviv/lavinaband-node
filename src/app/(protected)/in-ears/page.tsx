export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getInEarActor, loadBandMembers, loadMix } from '@/lib/inEarsServer';
import { buildChannels, isPerformer } from '@/lib/inEars';
import InEarsClient from './InEarsClient';

export default async function InEarsPage() {
  const actor = await getInEarActor();
  if (!actor) redirect('/songs');

  const members = await loadBandMembers();
  const channels = buildChannels(members);
  const performers = members.filter(isPerformer).map(m => ({ _id: m._id, name: m.name }));

  // Por defecto se abre la mezcla propia; los ingenieros que no tocan abren la primera
  const isActorPerformer = performers.some(p => p._id === actor.id);
  const initialOwnerId = isActorPerformer ? actor.id : actor.canManage ? performers[0]?._id ?? null : null;
  const initialMix = initialOwnerId ? await loadMix(initialOwnerId) : { levels: {}, order: [] };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl lg:max-w-none mx-auto">
      <header>
        <h1 className="text-3xl font-bold">In-Ears</h1>
        <p className="text-zinc-400 mt-1">
          {actor.isSoundEngineer && !isActorPerformer
            ? 'Revisa los cambios que pide la banda en sus mezclas y márcalos como aplicados.'
            : 'Ajusta tu mezcla personal. El ingeniero de audio recibe tus cambios.'}
        </p>
      </header>

      <InEarsClient
        actorId={actor.id}
        canManage={actor.canManage}
        isSoundEngineer={actor.isSoundEngineer}
        channels={channels}
        performers={performers}
        initialOwnerId={initialOwnerId}
        initialMix={JSON.parse(JSON.stringify(initialMix))}
      />
    </div>
  );
}
