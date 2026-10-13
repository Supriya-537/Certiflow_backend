import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password) => bcrypt.hash(password, 10);

export const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

export const signToken = (user) =>
  jwt.sign(
    {
      id: user._id?.toString?.() || user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'ceriflow-dev-secret',
    { expiresIn: '7d' }
  );
