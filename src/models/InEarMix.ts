import mongoose from 'mongoose';

// Mezcla personal de in-ear de un miembro: nivel de cada canal (-15 a +15) y su orden
const InEarMixSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  // { [channelId]: nivel } — los canales sin valor están en 0
  levels: { type: mongoose.Schema.Types.Mixed, default: {} },
  // Niveles que el ingeniero ya aplicó en la consola. Lo que difiere de `levels` está
  // pendiente. Sin default a propósito: las mezclas anteriores no lo tienen y se
  // consideran totalmente aplicadas (ver loadMix en lib/inEarsServer.ts).
  appliedLevels: { type: mongoose.Schema.Types.Mixed },
  order: { type: [String], default: [] },
}, { timestamps: true, minimize: false });

export default mongoose.models.InEarMix || mongoose.model('InEarMix', InEarMixSchema);
