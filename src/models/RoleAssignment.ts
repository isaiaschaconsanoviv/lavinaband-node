import mongoose from 'mongoose';

const RoleAssignmentSchema = new mongoose.Schema({
  weekOf: { type: Date, required: true }, // Monday of the week
  thursdayDate: { type: Date, required: true },
  sundayDate: { type: Date, required: true },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'SKIPPED'], default: 'PENDING' }
}, { timestamps: true });

export default mongoose.models.RoleAssignment || mongoose.model('RoleAssignment', RoleAssignmentSchema);
