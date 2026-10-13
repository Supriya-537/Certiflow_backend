import Application from '../models/Application.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { hashPassword } from '../utils/auth.js';

export const getAdminAnalytics = async (req, res) => {
  const totalApplications = await Application.countDocuments();
  const pending = await Application.countDocuments({ currentStatus: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'ADDITIONAL_INFORMATION_REQUIRED'] } });
  const approved = await Application.countDocuments({ currentStatus: 'APPROVED' });
  const rejected = await Application.countDocuments({ currentStatus: 'REJECTED' });
  const officers = await User.countDocuments({ role: 'officer' });
  const citizens = await User.countDocuments({ role: 'citizen' });

  res.json({
    totalApplications,
    pending,
    approved,
    rejected,
    officers,
    citizens,
    summary: {
      statusBreakdown: await Application.aggregate([
        { $group: { _id: '$currentStatus', count: { $sum: 1 } } },
      ]),
    },
  });
};

export const getUsers = async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.json({ users });
};

export const createOfficer = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Officer name, email, and password are required.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'User with this email already exists.' });
  }

  const officer = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    role: 'officer',
    status: 'active',
  });

  await AuditLog.create({
    actor: req.user._id,
    action: 'create_officer',
    resourceType: 'User',
    resourceId: officer._id.toString(),
    metadata: { email: officer.email },
  });

  res.status(201).json({ officer });
};

export const assignOfficer = async (req, res) => {
  const { applicationId, officerId } = req.body;

  const application = await Application.findById(applicationId);
  if (!application) {
    return res.status(404).json({ message: 'Application not found.' });
  }

  const officer = await User.findOne({ _id: officerId, role: 'officer' });
  if (!officer) {
    return res.status(400).json({ message: 'Valid officer ID is required.' });
  }

  application.assignedOfficer = officer._id;
  await application.save();

  await Notification.create({
    recipient: officer._id,
    type: 'assignment',
    message: `You were assigned to application ${application.referenceNumber}.`,
    relatedApplication: application._id,
  });

  res.json({ application });
};

export const exportCsv = async (req, res) => {
  const applications = await Application.find({}).populate('citizen', 'name email');

  const rows = [
    ['Reference Number', 'Citizen', 'Certificate Type', 'Status'],
    ...applications.map((app) => [
      app.referenceNumber,
      app.citizen?.name || '',
      app.certificateType,
      app.currentStatus,
    ]),
  ];

  const csv = rows.map((row) => row.join(',')).join('\n');
  res.header('Content-Type', 'text/csv');
  res.attachment('ceriflow-report.csv');
  res.send(csv);
};
