import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    name: String,
    originalName: String,
    mimeType: String,
    size: Number,
    filePath: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    referenceNumber: { type: String, required: true, unique: true, index: true },
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    certificateType: { type: String, required: true },
    applicantDetails: { type: Object, default: {} },
    certDetails: { type: Object, default: {} },
    supportingDocuments: [documentSchema],
    currentStatus: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'DOCUMENT_VERIFICATION',
        'ADDITIONAL_INFORMATION_REQUIRED',
        'APPROVED',
        'REJECTED',
      ],
      default: 'DRAFT',
      index: true,
    },
    assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    correctionRequest: {
      requested: { type: Boolean, default: false },
      reason: { type: String, default: '' },
      requestedAt: { type: Date, default: null },
    },
    decision: {
      status: { type: String, default: null },
      reason: { type: String, default: '' },
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      decidedAt: { type: Date, default: null },
    },
    notes: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

applicationSchema.index({ citizen: 1, currentStatus: 1, createdAt: -1 });
applicationSchema.index({ assignedOfficer: 1, currentStatus: 1 });
applicationSchema.index({ createdAt: -1 });

export default mongoose.model('Application', applicationSchema);
