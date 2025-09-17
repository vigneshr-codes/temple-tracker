const createAdminUser = require('./adminSeeder');

const runAllSeeders = async () => {
  try {
    console.log('🌱 Starting database seeding process...');
    
    // Run admin seeder
    await createAdminUser();
    
    console.log('✅ All seeders completed successfully!');
    console.log('\n🔐 Default Login Credentials:');
    console.log('   Email: admin@gmail.com');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('\n🚀 You can now login to the Temple Tracker system!');
    
  } catch (error) {
    console.error('💥 Seeding process failed:', error);
    throw error;
  }
};

// Run all seeders if called directly
if (require.main === module) {
  runAllSeeders()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = runAllSeeders;