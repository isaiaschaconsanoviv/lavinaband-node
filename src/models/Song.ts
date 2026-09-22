import mongoose from 'mongoose';

const SongSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  key: { type: String },
  tempo: { type: Number },
  link: { type: String },
  sheetLink: { type: String },
  youtubeLink: { type: String },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'SUGGESTED', 'APPROVED', 'REJECTED'], 
    default: 'ACTIVE' 
  },
  suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.Song || mongoose.model('Song', SongSchema);
