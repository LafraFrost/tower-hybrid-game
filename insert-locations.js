import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function insertLocations() {
  const client = await pool.connect();
  
  try {
    console.log('Inserimento locations...');
    
    const insertQuery = `
      INSERT INTO game_locations (name, building_type, coordinate_x, coordinate_y, is_built, user_id)
      VALUES 
        ('Magazzino', 'warehouse', 35.0, 42.0, false, 1),
        ('Orto', 'farm', 40.0, 48.0, true, 1),
        ('Fucina', 'blacksmith', 30.0, 55.0, false, 1),
        ('Ponte', 'bridge', 60.0, 50.0, false, 1),
        ('Miniera', 'mine', 52.0, 38.0, false, 1),
        ('Segheria', 'sawmill', 20.0, 45.0, false, 1)
      ON CONFLICT DO NOTHING
      RETURNING *;
    `;
    
    const result = await client.query(insertQuery);
    console.log(`✅ Inserite ${result.rowCount} game locations:`);
    result.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.building_type}) at (${row.coordinate_x}%, ${row.coordinate_y}%) - Built: ${row.is_built}`);
    });
    
    // Verifica totale locations per user_id=1
    const countResult = await client.query('SELECT COUNT(*) as total FROM game_locations WHERE user_id = 1');
    console.log(`\n📍 Totale game_locations per user_id=1: ${countResult.rows[0].total}`);
    
  } catch (err) {
    console.error('❌ Errore durante inserimento:', err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

insertLocations();
