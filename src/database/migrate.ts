import { db } from './database';

export async function runMigrations(): Promise<void> {
  console.log('Running database migrations...');
  
  try {
    await db.init();
    console.log('Database schema created successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed successfully!');
      return db.close();
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}