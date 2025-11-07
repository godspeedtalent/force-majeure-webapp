// Quick script to run SQL on Supabase
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sql = fs.readFileSync(path.join(__dirname, '../supabase/scripts/backfill_profiles.sql'), 'utf8');

// Extract just the INSERT statement
const insertSQL = sql.split('-- Verify')[0].trim();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const postData = JSON.stringify({ query: insertSQL });

const urlObj = new URL(url);
const options = {
  hostname: urlObj.hostname,
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Running SQL to backfill profiles...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Success!');
      console.log(data);
    } else {
      console.error('❌ Error:', res.statusCode);
      console.error(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(postData);
req.end();
