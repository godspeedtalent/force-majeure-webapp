import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in .env'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const assetsDir = join(__dirname, '..', 'src', 'assets');
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

async function uploadAssets() {
  try {
    const files = readdirSync(assetsDir);
    const imageFiles = files.filter(file =>
      imageExtensions.includes(extname(file).toLowerCase())
    );

    console.log(`Found ${imageFiles.length} images to upload`);

    for (const file of imageFiles) {
      const filePath = join(assetsDir, file);
      const fileBuffer = readFileSync(filePath);

      console.log(`Uploading ${file}...`);

      const { data, error } = await supabase.storage
        .from('assets')
        .upload(file, fileBuffer, {
          contentType: `image/${extname(file).slice(1)}`,
          upsert: true,
        });

      if (error) {
        console.error(`Error uploading ${file}:`, error.message);
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from('assets').getPublicUrl(file);
        console.log(`✓ Uploaded: ${file}`);
        console.log(`  URL: ${publicUrl}`);
      }
    }

    console.log('\n✓ All assets uploaded successfully!');
  } catch (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }
}

uploadAssets();
