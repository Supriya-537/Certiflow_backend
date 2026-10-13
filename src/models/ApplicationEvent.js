import mongoose from 'mongoose';

const applicationEventSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    applicationRef: { type: String, required: true, index: true },
    previousStatus: { type: String, default: null },
    newStatus: { type: String, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    eventType: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('ApplicationEvent', applicationEventSchema);
