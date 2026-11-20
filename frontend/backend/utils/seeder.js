// utils/seeder.js
// Run: node utils/seeder.js
require('dotenv').config({ path: './.env' })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const connectDB = require('../config/db')
const User = require('../models/User')
const logger = require('./logger')

const seed = async () => {
  await connectDB()
  logger.info('Seeder connected to DB')

  // Clear existing demo accounts
  await User.deleteMany({ email: { $in: ['patient@demo.com', 'doctor@demo.com', 'admin@demo.com'] } })

  const hash = await bcrypt.hash('Demo@1234', 12)

  const users = [
    {
      firstName: 'Priya', lastName: 'Sharma', email: 'patient@demo.com',
      password: hash, role: 'patient', phone: '9876543210',
      isActive: true, isApproved: true,
      medicalHistory: { bloodGroup: 'B+', allergies: ['Penicillin'], chronicConditions: ['Hypertension'] },
    },
    {
      firstName: 'Rahul', lastName: 'Verma', email: 'doctor@demo.com',
      password: hash, role: 'doctor', phone: '9876543211',
      isActive: true, isApproved: true,   // ← MUST be true for doctor to login
      specialization: 'Cardiologist', licenseNumber: 'MCI-123456',
      experience: 8, qualification: 'MBBS, MD (Cardiology)',
    },
    {
      firstName: 'Admin', lastName: 'User', email: 'admin@demo.com',
      password: hash, role: 'admin', phone: '9876543212',
      isActive: true, isApproved: true,
    },
  ]

  const created = await User.insertMany(users, { strict: false })
  logger.info(`Seeded ${created.length} demo users`)

  console.log('\n✅ Demo accounts created:')
  console.log('  patient@demo.com  / Demo@1234')
  console.log('  doctor@demo.com   / Demo@1234')
  console.log('  admin@demo.com    / Demo@1234\n')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => {
  logger.error('Seeder failed', { err: err.message })
  process.exit(1)
})
