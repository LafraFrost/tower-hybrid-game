import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres.adsyncfyaapzmbichemm:n5fjoPEyxz6DyVrp@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"
});

const tablesToImport = [
  'users',
  'custom_users',
  'user_profiles',
  'hero_sessions',
  'games',
  'units',
  'cards',
  'multiplayer_rooms',
  'room_participants',
  'combat_encounters',
  'daily_quests',
  'narrative_events',
  'random_events',
  'sessions',
  'user_locations'
];

async function importData() {
  const client = await pool.connect();
  
  try {
    for (const table of tablesToImport) {
      const csvPath = path.join(__dirname, 'data_backup', `${table}.csv`);
      
      if (!fs.existsSync(csvPath)) {
        console.log(`⊘ Skipping ${table} (file not found)`);
        continue;
      }

      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.trim().split('\n');
      
      if (lines.length <= 1) {
        console.log(`⊘ Skipping ${table} (empty file)`);
        continue;
      }

      const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      console.log(`\nImporting ${table}...`);
      let imported = 0;
      let skipped = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const values = line.split(',').map(v => {
            v = v.trim().replace(/^"|"$/g, '');
            if (v === '' || v === 'NULL' || v === '\\N') return null;
            return v;
          });

          const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
          const columns = header.join(', ');
          
          await client.query(
            `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
          imported++;
        } catch (err) {
          skipped++;
        }
      }

      console.log(`✓ ${table}: ${imported} rows imported, ${skipped} skipped`);
    }

  } catch (error) {
    console.error('✗ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('Starting data import...\n');
importData();
