'use client';

import CustomSelect from '@/components/ui/CustomSelect';
import { capoLabel, keyName, type SongKey } from '@/lib/chords';

const MAX_CAPO = 9;

interface CapoSelectorProps {
  // Tono en el que suena la canción (el tono guardado)
  baseKey: SongKey;
  capo: number;
  onChange: (capo: number) => void;
}

// Selector de posición del capo: los acordes se muestran con las formas que se
// tocan con el capo puesto, sin cambiar el tono en el que suena la canción.
export default function CapoSelector({ baseKey, capo, onChange }: CapoSelectorProps) {
  const options = Array.from({ length: MAX_CAPO + 1 }, (_, i) => ({
    value: String(i),
    label: capoLabel(baseKey, i),
  }));

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="w-full sm:w-64">
        <CustomSelect
          name="capo"
          className="min-w-0"
          options={options}
          value={String(capo)}
          onChange={val => onChange(Number(val))}
        />
      </div>
      <p className="text-xs text-zinc-500">
        Suena en <span className="font-mono text-zinc-300">{keyName(baseKey)}</span>
      </p>
    </div>
  );
}
