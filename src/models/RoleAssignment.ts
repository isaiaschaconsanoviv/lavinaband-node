import mongoose from 'mongoose';

const RoleAssignmentSchema = new mongoose.Schema({
  weekOf: { type: Date, required: true }, // Domingo en que inicia el turno (igual a sundayDate)
  thursdayDate: { type: Date, required: true },
  sundayDate: { type: Date, required: true },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Encargado solo de ese día, si un admin lo reasignó por día (si no hay, es `assignedUser`)
  sundayUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  thursdayUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'SKIPPED'], default: 'PENDING' },
  // Cuándo se envió el recordatorio del Lunes previo (api/cron/role-reminder)
  reminderSentAt: { type: Date },
  // Resultado del envío del recordatorio (dispositivos que lo recibieron / fallaron), para diagnosticar
  // (uno por persona: si se cambió un día, el recordatorio va a cada encargado con sus días)
  reminderDelivery: [{ _id: false, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, sent: Number, failed: Number, optedOut: Number, error: String }]
}, { timestamps: true });

export default mongoose.models.RoleAssignment || mongoose.model('RoleAssignment', RoleAssignmentSchema);
