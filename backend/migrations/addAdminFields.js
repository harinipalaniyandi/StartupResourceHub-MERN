const mongoose = require('mongoose');
require('dotenv').config();

const Resource = require('../models/Resource');
const User = require('../models/User');

async function migrate() {
  try {
    console.log('🔄 Starting migration...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srh_db');
    console.log('✅ Connected to MongoDB');

    // Update existing resources with default values
    const resourceResult = await Resource.updateMany(
      {},
      {
        $set: {
          status: 'approved',
          verificationStatus: 'verified',
          isActive: true
        }
      }
    );
    console.log(`✅ Updated ${resourceResult.modifiedCount} resources`);

    // Update mentor users with verification flag
    const userResult = await User.updateMany(
      { role: 'mentor' },
      { $set: { isMentorVerified: false } }
    );
    console.log(`✅ Updated ${userResult.modifiedCount} users`);

    console.log('\n✅ Migration completed successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
