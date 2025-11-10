/**
 * Compare Migration Schema with Live Database
 *
 * This script compares your migration file with the live database
 * to identify any missing tables, columns, functions, etc.
 */

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

interface ComparisonResult {
  tablesInMigrationNotInDB: string[];
  tablesInDBNotInMigration: string[];
  columnsInMigrationNotInDB: Array<{ table: string; column: string }>;
  columnsInDBNotInMigration: Array<{ table: string; column: string }>;
  functionsInMigrationNotInDB: string[];
  functionsInDBNotInMigration: string[];
  policiesInMigrationNotInDB: string[];
  policiesInDBNotInMigration: string[];
}

function parseMigrationFile(filepath: string): {
  tables: Set<string>;
  columns: Map<string, Set<string>>;
  functions: Set<string>;
  policies: Set<string>;
} {
  const content = fs.readFileSync(filepath, 'utf-8');

  const tables = new Set<string>();
  const columns = new Map<string, Set<string>>();
  const functions = new Set<string>();
  const policies = new Set<string>();

  // Extract table names
  const tableMatches = content.matchAll(/CREATE TABLE (\w+)/gi);
  for (const match of tableMatches) {
    tables.add(match[1].toLowerCase());
  }

  // Extract columns (basic parsing)
  const tableBlocks = content.split(/CREATE TABLE/i);
  for (const block of tableBlocks.slice(1)) {
    const tableNameMatch = block.match(/^\s*(\w+)/);
    if (!tableNameMatch) continue;

    const tableName = tableNameMatch[1].toLowerCase();
    const columnSet = new Set<string>();

    // Extract column names (simplified)
    const columnMatches = block.matchAll(/^\s*(\w+)\s+(?:UUID|TEXT|INTEGER|BOOLEAN|TIMESTAMPTZ|NUMERIC|INET|JSONB)/gim);
    for (const match of columnMatches) {
      columnSet.add(match[1].toLowerCase());
    }

    columns.set(tableName, columnSet);
  }

  // Extract function names
  const functionMatches = content.matchAll(/CREATE (?:OR REPLACE )?FUNCTION (\w+)/gi);
  for (const match of functionMatches) {
    functions.add(match[1].toLowerCase());
  }

  // Extract policy names
  const policyMatches = content.matchAll(/CREATE POLICY "([^"]+)"/gi);
  for (const match of policyMatches) {
    policies.add(match[1].toLowerCase());
  }

  return { tables, columns, functions, policies };
}

function parseSchemaExport(filepath: string): {
  tables: Set<string>;
  columns: Map<string, Set<string>>;
  functions: Set<string>;
  policies: Set<string>;
} {
  const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

  const tables = new Set<string>(
    content.tables.map((t: any) => t.table_name.toLowerCase())
  );

  const columns = new Map<string, Set<string>>();
  for (const col of content.columns || []) {
    const tableName = col.table_name.toLowerCase();
    if (!columns.has(tableName)) {
      columns.set(tableName, new Set());
    }
    columns.get(tableName)!.add(col.column_name.toLowerCase());
  }

  const functions = new Set<string>(
    (content.functions || []).map((f: any) => f.name.toLowerCase())
  );

  const policies = new Set<string>(
    (content.policies || []).map((p: any) => p.policyname.toLowerCase())
  );

  return { tables, columns, functions, policies };
}

function compareSchemas(
  migration: ReturnType<typeof parseMigrationFile>,
  liveDB: ReturnType<typeof parseSchemaExport>
): ComparisonResult {
  const result: ComparisonResult = {
    tablesInMigrationNotInDB: [],
    tablesInDBNotInMigration: [],
    columnsInMigrationNotInDB: [],
    columnsInDBNotInMigration: [],
    functionsInMigrationNotInDB: [],
    functionsInDBNotInMigration: [],
    policiesInMigrationNotInDB: [],
    policiesInDBNotInMigration: [],
  };

  // Compare tables
  for (const table of migration.tables) {
    if (!liveDB.tables.has(table)) {
      result.tablesInMigrationNotInDB.push(table);
    }
  }

  for (const table of liveDB.tables) {
    if (!migration.tables.has(table)) {
      result.tablesInDBNotInMigration.push(table);
    }
  }

  // Compare columns (for common tables)
  for (const [table, cols] of migration.columns) {
    if (!liveDB.columns.has(table)) continue;

    const liveColumns = liveDB.columns.get(table)!;
    for (const col of cols) {
      if (!liveColumns.has(col)) {
        result.columnsInMigrationNotInDB.push({ table, column: col });
      }
    }
  }

  for (const [table, cols] of liveDB.columns) {
    if (!migration.columns.has(table)) continue;

    const migrationColumns = migration.columns.get(table)!;
    for (const col of cols) {
      if (!migrationColumns.has(col)) {
        result.columnsInDBNotInMigration.push({ table, column: col });
      }
    }
  }

  // Compare functions
  for (const func of migration.functions) {
    if (!liveDB.functions.has(func)) {
      result.functionsInMigrationNotInDB.push(func);
    }
  }

  for (const func of liveDB.functions) {
    if (!migration.functions.has(func)) {
      result.functionsInDBNotInMigration.push(func);
    }
  }

  // Compare policies
  for (const policy of migration.policies) {
    if (!liveDB.policies.has(policy)) {
      result.policiesInMigrationNotInDB.push(policy);
    }
  }

  for (const policy of liveDB.policies) {
    if (!migration.policies.has(policy)) {
      result.policiesInDBNotInMigration.push(policy);
    }
  }

  return result;
}

function main() {
  console.log('🔍 Comparing migration with live database...\n');

  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/00000000000000_complete_database_init.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  // Find most recent schema export
  const exportsDir = path.join(process.cwd(), 'schema-exports');
  if (!fs.existsSync(exportsDir)) {
    console.error('❌ No schema exports found. Run export-schema.ts first.');
    process.exit(1);
  }

  const schemaFiles = fs
    .readdirSync(exportsDir)
    .filter(f => f.startsWith('schema-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (schemaFiles.length === 0) {
    console.error('❌ No schema export files found. Run export-schema.ts first.');
    process.exit(1);
  }

  const schemaPath = path.join(exportsDir, schemaFiles[0]);
  console.log(`📄 Using schema export: ${schemaFiles[0]}\n`);

  const migration = parseMigrationFile(migrationPath);
  const liveDB = parseSchemaExport(schemaPath);

  const comparison = compareSchemas(migration, liveDB);

  // Print results
  let hasIssues = false;

  if (comparison.tablesInDBNotInMigration.length > 0) {
    hasIssues = true;
    console.log('⚠️  Tables in database but NOT in migration:');
    comparison.tablesInDBNotInMigration.forEach(t => console.log(`   - ${t}`));
    console.log('');
  }

  if (comparison.tablesInMigrationNotInDB.length > 0) {
    console.log('ℹ️  Tables in migration but not in database (expected for new deployments):');
    comparison.tablesInMigrationNotInDB.forEach(t => console.log(`   - ${t}`));
    console.log('');
  }

  if (comparison.columnsInDBNotInMigration.length > 0) {
    hasIssues = true;
    console.log('⚠️  Columns in database but NOT in migration:');
    comparison.columnsInDBNotInMigration.forEach(c =>
      console.log(`   - ${c.table}.${c.column}`)
    );
    console.log('');
  }

  if (comparison.functionsInDBNotInMigration.length > 0) {
    hasIssues = true;
    console.log('⚠️  Functions in database but NOT in migration:');
    comparison.functionsInDBNotInMigration.forEach(f => console.log(`   - ${f}`));
    console.log('');
  }

  if (comparison.policiesInDBNotInMigration.length > 0) {
    hasIssues = true;
    console.log('⚠️  Policies in database but NOT in migration:');
    comparison.policiesInDBNotInMigration.forEach(p => console.log(`   - ${p}`));
    console.log('');
  }

  if (!hasIssues) {
    console.log('✅ Migration looks complete! All database objects are covered.\n');
  } else {
    console.log('❌ Migration is missing some database objects. Review the differences above.\n');
  }

  // Save comparison results
  const outputPath = path.join(exportsDir, `comparison-${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(comparison, null, 2));
  console.log(`📁 Detailed comparison saved to: ${outputPath}`);
}

main();
