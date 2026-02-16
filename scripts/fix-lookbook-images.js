/**
 * Скрипт для исправления URL изображений лукбуков
 *
 * Использование:
 * 1. Получи service_role key из Supabase Dashboard:
 *    https://supabase.com/dashboard/project/nqmmeymejmnvbrczuncr/settings/api
 * 2. Запусти: SUPABASE_SERVICE_ROLE_KEY="твой_ключ" node scripts/fix-lookbook-images.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://nqmmeymejmnvbrczuncr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'site-images';

// Images to upload (from src/assets)
const LOOKBOOK_IMAGES = [
  'lookbook-spring-1.jpg',
  'lookbook-spring-2.jpg',
  'lookbook-winter-1.jpg',
  'lookbook-winter-2.jpg',
];

// Map old paths to new filenames
const PATH_MAPPING = {
  '/src/assets/lookbook-spring-1.jpg': 'lookbook-spring-1.jpg',
  '/src/assets/lookbook-spring-2.jpg': 'lookbook-spring-2.jpg',
  '/src/assets/lookbook-winter-1.jpg': 'lookbook-winter-1.jpg',
  '/src/assets/lookbook-winter-2.jpg': 'lookbook-winter-2.jpg',
};

async function main() {
  console.log('='.repeat(60));
  console.log('  ANDO Lookbook Images Fix Script');
  console.log('='.repeat(60));

  // Check for service key
  if (!SUPABASE_SERVICE_KEY) {
    console.error('\n❌ ОШИБКА: SUPABASE_SERVICE_ROLE_KEY не установлен!\n');
    console.log('Получи ключ здесь:');
    console.log('https://supabase.com/dashboard/project/nqmmeymejmnvbrczuncr/settings/api\n');
    console.log('Затем запусти:');
    console.log('SUPABASE_SERVICE_ROLE_KEY="твой_ключ" node scripts/fix-lookbook-images.js\n');
    process.exit(1);
  }

  // Initialize Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  console.log('\n📦 Подключение к Supabase...');
  console.log(`   Project: nqmmeymejmnvbrczuncr`);
  console.log(`   Bucket: ${BUCKET_NAME}\n`);

  const uploadedUrls = {};
  const assetsDir = path.join(__dirname, '..', 'src', 'assets');

  // Step 1: Upload images
  console.log('📤 Загрузка изображений...\n');

  for (const filename of LOOKBOOK_IMAGES) {
    const filePath = path.join(assetsDir, filename);

    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  ${filename} - файл не найден, пропуск`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `lookbook/${filename}`;

    console.log(`   📄 ${filename}...`);

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true // Overwrite if exists
      });

    if (error) {
      console.log(`      ❌ Ошибка: ${error.message}`);
      continue;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    uploadedUrls[filename] = urlData.publicUrl;
    console.log(`      ✅ Загружено: ${urlData.publicUrl}`);
  }

  // Step 2: Update database
  console.log('\n📝 Обновление базы данных...\n');

  for (const [oldPath, filename] of Object.entries(PATH_MAPPING)) {
    if (!uploadedUrls[filename]) {
      console.log(`   ⚠️  ${oldPath} - нет URL для обновления`);
      continue;
    }

    const newUrl = uploadedUrls[filename];

    const { data, error } = await supabase
      .from('lookbook_images')
      .update({ image_url: newUrl })
      .eq('image_url', oldPath)
      .select();

    if (error) {
      console.log(`   ❌ ${oldPath}`);
      console.log(`      Ошибка: ${error.message}`);
      continue;
    }

    if (data && data.length > 0) {
      console.log(`   ✅ ${oldPath}`);
      console.log(`      → ${newUrl}`);
      console.log(`      Обновлено записей: ${data.length}`);
    } else {
      console.log(`   ⚠️  ${oldPath} - запись не найдена в БД`);
    }
  }

  // Step 3: Verify
  console.log('\n🔍 Проверка результата...\n');

  const { data: images, error: verifyError } = await supabase
    .from('lookbook_images')
    .select('id, image_url, caption')
    .order('display_order');

  if (verifyError) {
    console.log(`   ❌ Ошибка проверки: ${verifyError.message}`);
  } else {
    console.log('   Текущие записи в lookbook_images:');
    images.forEach((img, i) => {
      const status = img.image_url.startsWith('http') ? '✅' : '❌';
      console.log(`   ${i + 1}. ${status} ${img.caption || 'Без подписи'}`);
      console.log(`      URL: ${img.image_url}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('  Готово! Проверь страницу /lookbook на сайте');
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
