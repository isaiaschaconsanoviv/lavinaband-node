import mongoose from 'mongoose';

const ReactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['LIKE', 'LOVE', 'AMEN', 'PRAY', 'FIRE', 'MUSIC', 'HAHA', 'PARTY', 'CHECK', 'EYES', 'SAD', 'CLAP'], default: 'LIKE' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  author: { type: String, required: true },
  date: { type: Date, default: Date.now },
  reactions: [ReactionSchema]
}, { timestamps: true });

export default mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
