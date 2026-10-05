import mongoose from 'mongoose';

const RoleAssignmentSchema = new mongoose.Schema({
  weekOf: { type: Date, required: true }, // Domingo en que inicia el turno (igual a sundayDate)
  thursdayDate: { type: Date, required: true },
  sundayDate: { type: Date, required: true },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'SKIPPED'], default: 'PENDING' },
  // Cuándo se envió el recordatorio del Lunes previo (api/cron/role-reminder)
  reminderSentAt: { type: Date }
}, { timestamps: true });

export default mongoose.models.RoleAssignment || mongoose.model('RoleAssignment', RoleAssignmentSchema);
