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
  pushSubscriptions: { type: Array, default: [] }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
