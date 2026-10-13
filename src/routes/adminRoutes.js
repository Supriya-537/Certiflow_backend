import express from 'express';
import { assignOfficer, createOfficer, exportCsv, getAdminAnalytics, getUsers } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/analytics', getAdminAnalytics);
router.get('/users', getUsers);
router.post('/officers', createOfficer);
router.post('/assign-officer', assignOfficer);
router.get('/export', exportCsv);

export default router;
