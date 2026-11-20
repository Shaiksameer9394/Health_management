/**
 * migrateHealthData.js
 * 
 * One-time migration: fixes HealthData documents saved before the
 * healthController fix. Old documents were saved with a top-level
 * "vitals" field (which Mongoose silently dropped), so they have
 * no heartRate.value, bloodSugar.value etc.
 * 
 * Run ONCE from backend folder:
 *   node utils/migrateHealthData.js
 */

require('dotenv').config({ path: './.env' })
const mongoose = require('mongoose')
const connectDB = require('../config/db')

const run = async () => {
  await connectDB()
  console.log('✅ Connected to DB')

  const db = mongoose.connection.db
  const collection = db.collection('healthdatas')

  // Find all documents that are missing heartRate.value
  // (these are the broken ones saved before the fix)
  const broken = await collection.find({
    'heartRate.value': { $exists: false },
    'bloodSugar.value': { $exists: false },
    'oxygenSaturation.value': { $exists: false },
    'temperature.value': { $exists: false },
  }).toArray()

  console.log(`Found ${broken.length} documents to migrate`)

  let fixed = 0
  let deleted = 0

  for (const doc of broken) {
    // These old docs have no useful vital data — Mongoose dropped the
    // "vitals" field because it wasn't in the schema. Delete them so
    // the patient can log fresh correct entries.
    await collection.deleteOne({ _id: doc._id })
    deleted++
  }

  console.log(`\n✅ Migration complete:`)
  console.log(`   Fixed:   ${fixed}`)
  console.log(`   Deleted: ${deleted} (empty/broken entries with no vital data)`)
  console.log(`\nPatients should now log fresh health data — it will save correctly.`)

  await mongoose.disconnect()
  process.exit(0)
}

run().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})