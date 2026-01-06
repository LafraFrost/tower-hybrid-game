import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres.adsyncfyaapzmbichemm:n5fjoPEyxz6DyVrp@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"
});

async function testConnection() {
  try {
    console.log('Testing connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Connected successfully:', result.rows[0]);
    
    console.log('\nChecking tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\nFound ${tables.rows.length} tables:`);
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    if (tables.rows.length > 0) {
      console.log('\nChecking row counts...');
      for (const table of tables.rows) {
        const count = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
        console.log(`  ${table.table_name}: ${count.rows[0].count} rows`);
      }
    }
    
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
