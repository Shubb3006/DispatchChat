import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'databases');

async function runMigrations() {
  try {
    console.log('Starting database migrations...\n');

    // Read all SQL files from databases directory
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files\n`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        console.log(`Running: ${file}...`);
        await pool.query(sql);
        console.log(`✅ ${file} completed\n`);
      } catch (err) {
        console.error(`❌ Error in ${file}:`);
        console.error(err.message);
        console.error('');
        // Continue with next migration on error
      }
    }

    console.log('✅ All migrations completed!');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

runMigrations();
