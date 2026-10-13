import express from 'express';
import {
  createApplication,
  getApplicationById,
  getDashboardSnapshot,
  getPublicTracking,
  listApplications,
  reviewApplication,
  submitApplication,
} from '../controllers/applicationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/track', getPublicTracking);
router.post('/', authenticate, authorize('citizen'), createApplication);
router.get('/', authenticate, listApplications);
router.get('/dashboard', authenticate, authorize('citizen'), getDashboardSnapshot);
router.get('/:id', authenticate, getApplicationById);
router.post('/:id/submit', authenticate, authorize('citizen'), submitApplication);
router.post('/:id/review', authenticate, authorize('officer', 'admin'), reviewApplication);

export default router;
