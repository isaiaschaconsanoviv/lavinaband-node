import mongoose from 'mongoose';

// Presentación en vivo de un set list: solo guarda en qué parte va el presentador.
// Cada dispositivo ya tiene la letra del set list y dibuja el slide por su cuenta.
const LiveSessionSchema = new mongoose.Schema({
  setlist: { type: mongoose.Schema.Types.ObjectId, ref: 'Setlist', required: true, unique: true },
  presenter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  presenterName: { type: String },
  song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
  // Posición de la sección dentro de la canción (ver `songSlides` en lib/songSlides.ts)
  section: { type: Number, default: 0 },
  // Pantalla en blanco (pausas, oraciones)
  blank: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.LiveSession || mongoose.model('LiveSession', LiveSessionSchema);
