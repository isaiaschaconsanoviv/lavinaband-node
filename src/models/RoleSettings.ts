import mongoose from 'mongoose';

const RoleSettingsSchema = new mongoose.Schema({
  singletonId: { type: String, default: 'config' },
  isActive: { type: Boolean, default: false },
  lastAssignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.models.RoleSettings || mongoose.model('RoleSettings', RoleSettingsSchema);
