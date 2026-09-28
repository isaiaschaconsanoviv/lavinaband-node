import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String },
  role: { 
    type: String, 
    enum: ['ADMIN', 'MEMBER', 'GUEST'], 
    default: 'GUEST' 
  },
  roleColor: { type: String, default: '#71717a' }, // Default zinc-500
  setListRoleStatus: { type: String, enum: ['NONE', 'PENDING', 'APPROVED'], default: 'NONE' },
  pushSubscriptions: { type: Array, default: [] },
  // In-Ears: qué canales aporta a la consola y si opera como ingeniero de audio
  isVocalist: { type: Boolean, default: false },
  instruments: { type: [String], enum: ['Batería', 'Bajo', 'G. Acústica', 'G. Eléctrica', 'Teclado'], default: [] },
  isSoundEngineer: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
