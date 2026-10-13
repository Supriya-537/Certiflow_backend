import User from '../models/User.js';
import { hashPassword, comparePassword, signToken } from '../utils/auth.js';

export const registerCitizen = async (req, res) => {
  const { name, email, password, phone, address, role = 'citizen' } = req.body;
  const validRoles = ['citizen', 'officer', 'admin'];

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Choose a valid account role.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    address: address || '',
    passwordHash: await hashPassword(password),
    role,
    status: 'active',
  });

  const token = signToken(user);

  return res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  if (role && user.role !== role) {
    return res.status(403).json({ message: `This account is not registered as a ${role === 'admin' ? 'administrator' : role}.` });
  }

  const token = signToken(user);
  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  res.json({ user });
};

export const updateProfile = async (req, res) => {
  const { name, phone, address } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, phone, address },
    { new: true }
  ).select('-passwordHash');

  res.json({ user });
};
