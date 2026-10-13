import express from 'express';
import { getMe, login, registerCitizen, updateProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

router.post('/register', asyncRoute(registerCitizen));
router.post('/login', asyncRoute(login));
router.get('/me', asyncRoute(authenticate), asyncRoute(getMe));
router.put('/profile', asyncRoute(authenticate), asyncRoute(updateProfile));

export default router;
