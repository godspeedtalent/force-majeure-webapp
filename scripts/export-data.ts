/**
 * Export Database Data from Supabase
 *
 * This script exports all data from your database tables.
 * Be careful with sensitive data (passwords, API keys, etc.)
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
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Tables to export (in order to respect foreign key constraints)
const TABLES_TO_EXPORT = [
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
];

// Tables to skip (system tables or sensitive data)
const SKIP_TABLES = [
  // Add any tables you want to skip
];

interface TableData {
  table: string;
  rowCount: number;
  data: any[];
  error?: string;
}

async function exportTableData(tableName: string): Promise<TableData> {
  console.log(`   Exporting ${tableName}...`);

  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' });

    if (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
      return {
        table: tableName,
        rowCount: 0,
        data: [],
        error: error.message,
      };
    }

    console.log(`   ✓ ${count || 0} rows`);
    return {
      table: tableName,
      rowCount: count || 0,
      data: data || [],
    };
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
    return {
      table: tableName,
      rowCount: 0,
      data: [],
      error: error.message,
    };
  }
}

async function exportAllData(): Promise<TableData[]> {
  console.log('📊 Exporting database data...\n');

  const results: TableData[] = [];

  for (const table of TABLES_TO_EXPORT) {
    if (SKIP_TABLES.includes(table)) {
      console.log(`   ⏭️  Skipping ${table}`);
      continue;
    }

    const result = await exportTableData(table);
    results.push(result);
  }

  return results;
}

async function main() {
  try {
    const results = await exportAllData();

    const outputDir = path.join(process.cwd(), 'schema-exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

    // Save complete export
    const filename = `data-${timestamp}.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));

    // Save individual table exports
    const tablesDir = path.join(outputDir, `tables-${timestamp}`);
    fs.mkdirSync(tablesDir, { recursive: true });

    for (const result of results) {
      if (result.rowCount > 0) {
        const tableFile = path.join(tablesDir, `${result.table}.json`);
        fs.writeFileSync(tableFile, JSON.stringify(result.data, null, 2));
      }
    }

    console.log('\n✅ Data export complete!');
    console.log(`📁 Complete export: ${filepath}`);
    console.log(`📁 Individual tables: ${tablesDir}\n`);

    // Print summary
    console.log('📊 Summary:');
    const totalRows = results.reduce((sum, r) => sum + r.rowCount, 0);
    console.log(`   Total tables: ${results.length}`);
    console.log(`   Total rows: ${totalRows}`);
    console.log(`   Tables with data: ${results.filter(r => r.rowCount > 0).length}`);
    console.log(`   Errors: ${results.filter(r => r.error).length}\n`);

    // Print table breakdown
    console.log('📋 Table breakdown:');
    for (const result of results) {
      const icon = result.error ? '❌' : result.rowCount > 0 ? '✓' : '○';
      console.log(`   ${icon} ${result.table.padEnd(30)} ${result.rowCount.toString().padStart(6)} rows`);
    }

    // Print errors if any
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      for (const error of errors) {
        console.log(`   ${error.table}: ${error.error}`);
      }
    }

  } catch (error) {
    console.error('Failed to export data:', error);
    process.exit(1);
  }
}

main();
