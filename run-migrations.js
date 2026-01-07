#!/usr/bin/env node
/**
 * Esegui le migrazioni Supabase SQL usando il pacchetto 'pg'
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Leggi le variabili d'ambiente
config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Errore: DATABASE_URL non configurato nel .env');
  process.exit(1);
}

console.log(`📡 Connessione al database Supabase...\n`);

// Leggi il file SQL
const migrationFile = path.join(__dirname, 'supabase_migrations.sql');
if (!fs.existsSync(migrationFile)) {
  console.error(`❌ File non trovato: ${migrationFile}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(migrationFile, 'utf-8');
console.log(`📄 Caricato file SQL (${sqlContent.length} bytes)\n`);

// Esegui le migrazioni
(async () => {
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    console.log('✅ Connesso al database\n');

    console.log('⏳ Esecuzione delle migrazioni...\n');
    const result = await client.query(sqlContent);
    
    console.log('✅ Migrazioni completate!\n');
    console.log(`📊 Risultato: ${result.command}`);

    await client.end();
    console.log('\n🎉 Setup database completato!');
    
  } catch (error) {
    console.error('❌ Errore durante le migrazioni:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Errore di connessione. Prova:');
      console.log('   1. Verifica che DATABASE_URL nel .env sia corretto');
      console.log('   2. Esegui manualmente nel Supabase SQL Editor:');
      console.log('      https://supabase.com/dashboard -> SQL Editor');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (e) {
        // Ignora errore di disconnessione
      }
    }
  }
})();
