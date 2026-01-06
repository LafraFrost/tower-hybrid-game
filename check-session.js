import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres.adsyncfyaapzmbichemm:n5fjoPEyxz6DyVrp@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"
});

async function checkSessions() {
  try {
    console.log('Checking hero_sessions...\n');
    
    const sessions = await pool.query(`
      SELECT id, hero_name, hero_class, current_hp, max_hp, current_pa, current_r2, max_r2, 
             node_counter, credits, current_floor, game_mode, is_active, created_at
      FROM hero_sessions
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${sessions.rows.length} sessions:\n`);
    sessions.rows.forEach(s => {
      console.log(`#${s.id} | ${s.hero_name} (${s.hero_class}) | HP:${s.current_hp}/${s.max_hp} | Credits:${s.credits} | Floor:${s.current_floor} | Active:${s.is_active} | Mode:${s.game_mode}`);
    });
    
    console.log('\n\nChecking which hero is currently selected (looking for solo active sessions)...\n');
    const active = await pool.query(`
      SELECT * FROM hero_sessions 
      WHERE is_active = true AND game_mode = 'solo'
      ORDER BY updated_at DESC
    `);
    
    console.log(`Active solo sessions: ${active.rows.length}`);
    active.rows.forEach(s => {
      console.log(`  → ${s.hero_name}: session #${s.id}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSessions();
