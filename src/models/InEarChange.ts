import mongoose from 'mongoose';

// Historial de cambios de las mezclas, para avisar al ingeniero de audio
const InEarChangeSchema = new mongoose.Schema({
  mix: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changes: [{
    _id: false,
    channel: { type: String, required: true },
    label: { type: String, required: true },
    from: { type: Number, required: true },
    to: { type: Number, required: true },
  }],
  appliedAt: { type: Date },
  appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.InEarChange || mongoose.model('InEarChange', InEarChangeSchema);
