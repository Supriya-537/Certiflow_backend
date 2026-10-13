import Application from '../models/Application.js';
import ApplicationEvent from '../models/ApplicationEvent.js';
import Notification from '../models/Notification.js';
import { canTransitionApplication, buildReferenceNumber } from '../utils/applicationFlow.js';

export const createApplication = async (req, res) => {
  const { certificateType, applicantDetails, certDetails, supportingDocuments } = req.body;

  if (!certificateType) {
    return res.status(400).json({ message: 'Certificate type is required.' });
  }

  const application = await Application.create({
    referenceNumber: buildReferenceNumber(),
    citizen: req.user._id,
    certificateType,
    applicantDetails: applicantDetails || {},
    certDetails: certDetails || {},
    supportingDocuments: supportingDocuments || [],
    currentStatus: 'DRAFT',
  });

  return res.status(201).json({ application });
};

export const listApplications = async (req, res) => {
  let query = {};

  if (req.user.role === 'citizen') {
    query.citizen = req.user._id;
  }

  if (req.user.role === 'officer') {
    query.assignedOfficer = req.user._id;
  }

  const applications = await Application.find(query)
    .populate('citizen', 'name email')
    .populate('assignedOfficer', 'name email')
    .sort({ createdAt: -1 });

  return res.json({ applications });
};

export const getApplicationById = async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('citizen', 'name email')
    .populate('assignedOfficer', 'name email');

  if (!application) {
    return res.status(404).json({ message: 'Application not found.' });
  }

  if (req.user.role === 'citizen' && application.citizen.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only access your own applications.' });
  }

  if (req.user.role === 'officer' && application.assignedOfficer && application.assignedOfficer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'This application is not assigned to you.' });
  }

  const events = await ApplicationEvent.find({ application: application._id }).sort({ createdAt: -1 });

  return res.json({ application, events });
};

export const submitApplication = async (req, res) => {
  const application = await Application.findOne({ _id: req.params.id, citizen: req.user._id });

  if (!application) {
    return res.status(404).json({ message: 'Application not found.' });
  }

  if (application.currentStatus !== 'DRAFT') {
    return res.status(400).json({ message: 'Only draft applications can be submitted.' });
  }

  const previousStatus = application.currentStatus;
  application.currentStatus = 'SUBMITTED';
  application.submittedAt = new Date();
  await application.save();

  await ApplicationEvent.create({
    application: application._id,
    applicationRef: application.referenceNumber,
    previousStatus,
    newStatus: 'SUBMITTED',
    actor: req.user._id,
    eventType: 'SUBMITTED',
    explanation: 'Citizen submitted application for review.',
  });

  await Notification.create({
    recipient: req.user._id,
    type: 'application_submitted',
    message: `Application ${application.referenceNumber} was submitted successfully.`,
    relatedApplication: application._id,
  });

  return res.json({ application });
};

export const reviewApplication = async (req, res) => {
  const { status, explanation, reason } = req.body;
  const application = await Application.findById(req.params.id);

  if (!application) {
    return res.status(404).json({ message: 'Application not found.' });
  }

  if (req.user.role !== 'officer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only officers can review applications.' });
  }

  if (!status) {
    return res.status(400).json({ message: 'Review status is required.' });
  }

  if (!canTransitionApplication(application.currentStatus, status)) {
    return res.status(400).json({ message: `Invalid transition from ${application.currentStatus} to ${status}.` });
  }

  if (status === 'REJECTED' && !reason) {
    return res.status(400).json({ message: 'Rejection reason is required.' });
  }

  const previousStatus = application.currentStatus;
  application.currentStatus = status;
  application.reviewedAt = new Date();
  application.decision = {
    status,
    reason: reason || '',
    decidedBy: req.user._id,
    decidedAt: new Date(),
  };

  if (status === 'ADDITIONAL_INFORMATION_REQUIRED') {
    application.correctionRequest = {
      requested: true,
      reason: explanation || 'Please provide the missing information.',
      requestedAt: new Date(),
    };
  }

  await application.save();

  await ApplicationEvent.create({
    application: application._id,
    applicationRef: application.referenceNumber,
    previousStatus,
    newStatus: status,
    actor: req.user._id,
    eventType: 'REVIEW',
    explanation: explanation || reason || 'Officer updated review status.',
  });

  await Notification.create({
    recipient: application.citizen,
    type: status === 'REJECTED' ? 'application_rejected' : 'status_update',
    message: `Application ${application.referenceNumber} moved to ${status}.`,
    relatedApplication: application._id,
  });

  return res.json({ application });
};

export const getPublicTracking = async (req, res) => {
  const { referenceNumber } = req.query;
  if (!referenceNumber) {
    return res.status(400).json({ message: 'Reference number is required.' });
  }

  const application = await Application.findOne({ referenceNumber }).populate('citizen', 'name');
  if (!application) {
    return res.status(404).json({ message: 'Application not found.' });
  }

  return res.json({
    referenceNumber: application.referenceNumber,
    certificateType: application.certificateType,
    currentStatus: application.currentStatus,
    submittedAt: application.submittedAt,
    citizenName: application.citizen?.name ? `${application.citizen.name}` : 'Citizen',
  });
};

export const getDashboardSnapshot = async (req, res) => {
  const total = await Application.countDocuments({ citizen: req.user._id });
  const underReview = await Application.countDocuments({ citizen: req.user._id, currentStatus: 'UNDER_REVIEW' });
  const corrections = await Application.countDocuments({ citizen: req.user._id, currentStatus: 'ADDITIONAL_INFORMATION_REQUIRED' });
  const approved = await Application.countDocuments({ citizen: req.user._id, currentStatus: 'APPROVED' });

  const recent = await Application.find({ citizen: req.user._id }).sort({ createdAt: -1 }).limit(5);

  res.json({ total, underReview, corrections, approved, recent });
};
