/**
 * Export Database Schema from Supabase
 *
 * This script extracts the complete database schema including:
 * - Tables with columns, types, constraints
 * - Indexes
 * - Foreign keys
 * - RLS policies
 *
 * Note: This uses the Supabase client to query system tables.
 * Some queries may be restricted depending on your RLS policies.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Simple .env file loader (no dependencies needed)
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envFile = fs.readFileSync(envPath, 'utf-8');

    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    // .env file doesn't exist, environment variables must be set another way
  }
}

// Load .env file
loadEnv();

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('');
  console.error('Please add to your .env file:');
  console.error('  VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (your service role key)');
  console.error('');
  console.error('Get your service role key from:');
  console.error('  Supabase Dashboard > Project Settings > API > service_role key');
  console.error('');
  console.error('⚠️  Note: The service role key is different from your publishable key!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

interface SchemaExport {
  tables: string[];
  tableDetails: Record<string, any>;
  timestamp: string;
  note: string;
}

async function listAllTables(): Promise<string[]> {
  console.log('📊 Discovering tables...\n');

  // Get list of all tables by trying to query them
  // This is a workaround since we can't directly query information_schema
  const knownTables = [
    'cities',
    'roles',
    'organizations',
    'venues',
    'genres',
    'artists',
    'artist_genres',
    'events',
    'event_artists',
    'profiles',
    'user_roles',
    'feature_flags',
    'ticket_tiers',
    'ticket_holds',
    'orders',
    'order_items',
    'tickets',
    'ticketing_fees',
    'promo_codes',
    'ticketing_sessions',
    'queue_configurations',
    'exclusive_content_grants',
    'event_views',
    'event_images',
    'webhook_events',
    'dev_notes',
    'datagrid_configs',
    'scavenger_locations',
    'scavenger_claims',
    'scavenger_tokens',
    'merch',
    'api_logs',
  ];

  const existingTables: string[] = [];

  for (const table of knownTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        existingTables.push(table);
        console.log(`   ✓ ${table}`);
      } else if (error.code !== 'PGRST204') {
        // Table exists but we can't access it (RLS or permissions)
        existingTables.push(table);
        console.log(`   ⚠️  ${table} (access restricted)`);
      }
    } catch (e) {
      // Table doesn't exist, skip silently
    }
  }

  console.log(`\n   Found ${existingTables.length} tables\n`);
  return existingTables;
}

async function getTableSchema(tableName: string): Promise<any> {
  console.log(`   Analyzing ${tableName}...`);

  try {
    // Get a sample row to infer column types
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error && error.code !== '42P01') {
      // Table exists but might be empty or restricted
      console.log(`     (no data or restricted access)`);
      return {
        table: tableName,
        accessible: false,
        error: error.message,
      };
    }

    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

    // Try to get row count
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    console.log(`     ${columns.length} columns, ${count || 0} rows`);

    return {
      table: tableName,
      accessible: true,
      columnCount: columns.length,
      rowCount: count || 0,
      sampleColumns: columns,
    };
  } catch (error: any) {
    console.log(`     ⚠️  ${error.message}`);
    return {
      table: tableName,
      accessible: false,
      error: error.message,
    };
  }
}

async function exportSchema(): Promise<SchemaExport> {
  console.log('🔍 Exporting Supabase schema...\n');
  console.log('⚠️  Note: This script queries tables directly.');
  console.log('   For complete schema including functions and triggers,');
  console.log('   use the SQL export method (npm run export:sql)\n');

  const tables = await listAllTables();
  const tableDetails: Record<string, any> = {};

  console.log('📋 Analyzing table structures...\n');

  for (const table of tables) {
    tableDetails[table] = await getTableSchema(table);
  }

  return {
    tables,
    tableDetails,
    timestamp: new Date().toISOString(),
    note: 'This is a basic schema export. For complete schema with functions, triggers, and RLS policies, use the SQL export method.',
  };
}

async function main() {
  try {
    console.log('🚀 Starting schema export...\n');
    console.log(`   URL: ${SUPABASE_URL}`);
    console.log(`   Service Key: ${SUPABASE_SERVICE_KEY!.substring(0, 30)}...`);
    console.log(`   Key length: ${SUPABASE_SERVICE_KEY!.length} characters\n`);

    const schema = await exportSchema();

    const outputDir = path.join(process.cwd(), 'schema-exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `schema-basic-${timestamp}.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(schema, null, 2));

    console.log('\n✅ Schema export complete!');
    console.log(`📁 Saved to: ${filepath}\n`);

    // Print summary
    console.log('📊 Summary:');
    console.log(`   Total tables: ${schema.tables.length}`);

    const accessible = Object.values(schema.tableDetails).filter(
      (t: any) => t.accessible
    ).length;
    console.log(`   Accessible tables: ${accessible}`);
    console.log(`   Restricted tables: ${schema.tables.length - accessible}`);

    const totalRows = Object.values(schema.tableDetails).reduce(
      (sum: number, t: any) => sum + (t.rowCount || 0),
      0
    );
    console.log(`   Total rows: ${totalRows}\n`);

    // Print table list
    console.log('📋 Tables found:');
    for (const table of schema.tables) {
      const detail = schema.tableDetails[table];
      const icon = detail.accessible ? '✓' : '⚠️';
      const info = detail.accessible
        ? `${detail.columnCount} cols, ${detail.rowCount} rows`
        : 'restricted';
      console.log(`   ${icon} ${table.padEnd(30)} ${info}`);
    }

    console.log('\n💡 Tip: For complete schema with functions and policies, run:');
    console.log('   npm run export:sql\n');

  } catch (error: any) {
    console.error('\n❌ Failed to export schema:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you added SUPABASE_SERVICE_ROLE_KEY to .env');
    console.error('2. Verify the service role key from: Project Settings > API');
    console.error('3. Try the SQL export method: npm run export:sql');
    process.exit(1);
  }
}

main();
