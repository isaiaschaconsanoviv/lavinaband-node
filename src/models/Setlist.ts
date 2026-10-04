import mongoose from 'mongoose';

const SetlistSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  rehearsalDate: { type: Date },
  songs: [{
    song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
    order: { type: Number }
  }],
  notes: { type: String },
  attendance: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['CONFIRMED', 'DECLINED', 'PENDING'], default: 'PENDING' }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Solo su creador, colaboradores y admins lo ven hasta que se marca como listo
  isReady: { type: Boolean, default: false },
  readyAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.Setlist || mongoose.model('Setlist', SetlistSchema);
