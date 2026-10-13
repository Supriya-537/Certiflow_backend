import express from 'express';
import {
  createApplication,
  downloadApplicationDocument,
  getApplicationById,
  getDashboardSnapshot,
  getPublicTracking,
  listApplications,
  reviewApplication,
  submitApplication,
} from '../controllers/applicationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { supportingDocumentUpload } from '../middleware/upload.js';

const router = express.Router();
const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

router.get('/track', getPublicTracking);
router.post(
  '/',
  authenticate,
  authorize('citizen'),
  supportingDocumentUpload.array('supportingDocuments', 5),
  asyncRoute(createApplication)
);
router.get('/', authenticate, listApplications);
router.get('/dashboard', authenticate, authorize('citizen'), getDashboardSnapshot);
router.get('/:id/documents/:filename', authenticate, asyncRoute(downloadApplicationDocument));
router.get('/:id', authenticate, getApplicationById);
router.post('/:id/submit', authenticate, authorize('citizen'), submitApplication);
router.post('/:id/review', authenticate, authorize('officer', 'admin'), reviewApplication);

export default router;
