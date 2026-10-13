import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Application from './models/Application.js';
import { hashPassword } from './utils/auth.js';

dotenv.config();

const seed = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed script cannot run in production.');
  }

  const adminExists = await User.findOne({ email: 'admin@ceriflow.demo' });
  if (!adminExists) {
    await User.create({
      name: 'Admin Demo',
      email: 'admin@ceriflow.demo',
      passwordHash: await hashPassword('Admin@123'),
      role: 'admin',
      status: 'active',
    });
  }

  const officer1 = await User.findOne({ email: 'officer1@ceriflow.demo' });
  if (!officer1) {
    await User.create({
      name: 'Officer One',
      email: 'officer1@ceriflow.demo',
      passwordHash: await hashPassword('Officer@123'),
      role: 'officer',
      status: 'active',
    });
  }

  const officer2 = await User.findOne({ email: 'officer2@ceriflow.demo' });
  if (!officer2) {
    await User.create({
      name: 'Officer Two',
      email: 'officer2@ceriflow.demo',
      passwordHash: await hashPassword('Officer@123'),
      role: 'officer',
      status: 'active',
    });
  }

  const citizen = await User.findOne({ email: 'citizen1@ceriflow.demo' });
  if (!citizen) {
    const createdCitizen = await User.create({
      name: 'Citizen One',
      email: 'citizen1@ceriflow.demo',
      passwordHash: await hashPassword('Citizen@123'),
      role: 'citizen',
      status: 'active',
    });

    await Application.create({
      referenceNumber: 'CERI-ALPHA1',
      citizen: createdCitizen._id,
      certificateType: 'Income Certificate',
      currentStatus: 'SUBMITTED',
      applicantDetails: { name: createdCitizen.name, email: createdCitizen.email },
    });
  }

  console.log('Seed completed');
  await mongoose.disconnect();
};

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
