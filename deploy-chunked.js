import FtpDeploy from 'ftp-deploy';
import * as ftp from 'basic-ftp';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, join, basename } from 'path';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const CHUNK_SIZE = 200 * 1024; // 200KB chunks
const MAX_FILE_SIZE = 300 * 1024; // Files larger than 300KB will be chunked

const config = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  port: parseInt(process.env.FTP_PORT) || 21,
  localRoot: resolve(__dirname, './dist'),
  remoteRoot: process.env.FTP_REMOTE_PATH || '/www/andojv.com/',
};

// PHP script to merge chunks on server
const mergeScript = `<?php
header('Content-Type: application/json');
$targetFile = $_GET['file'] ?? '';
$chunks = isset($_GET['chunks']) ? intval($_GET['chunks']) : 0;

if (!$targetFile || !$chunks) {
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

$targetPath = __DIR__ . '/' . basename($targetFile);
$output = fopen($targetPath, 'wb');

if (!$output) {
    echo json_encode(['error' => 'Cannot create target file']);
    exit;
}

for ($i = 0; $i < $chunks; $i++) {
    $chunkPath = __DIR__ . '/' . basename($targetFile) . '.chunk' . $i;
    if (file_exists($chunkPath)) {
        $chunk = file_get_contents($chunkPath);
        fwrite($output, $chunk);
        unlink($chunkPath); // Delete chunk after merging
    } else {
        fclose($output);
        echo json_encode(['error' => 'Missing chunk ' . $i]);
        exit;
    }
}

fclose($output);
echo json_encode(['success' => true, 'file' => $targetFile, 'size' => filesize($targetPath)]);
?>`;

async function splitFile(filePath) {
  const content = readFileSync(filePath);
  const chunks = [];

  for (let i = 0; i < content.length; i += CHUNK_SIZE) {
    chunks.push(content.slice(i, i + CHUNK_SIZE));
  }

  return chunks;
}

async function uploadWithRetry(client, localPath, remotePath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.uploadFrom(localPath, remotePath);
      return true;
    } catch (err) {
      console.log(`  ⚠️ Attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt < maxRetries) {
        console.log(`  ⏳ Waiting 3 seconds before retry...`);
        await new Promise(r => setTimeout(r, 3000));
        // Reconnect
        try {
          await client.close();
          await client.access({
            host: config.host,
            user: config.user,
            password: config.password,
            port: config.port,
            secure: false,
          });
        } catch (e) {
          console.log(`  Reconnect failed, waiting more...`);
          await new Promise(r => setTimeout(r, 5000));
        }
      } else {
        throw err;
      }
    }
  }
}

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  const tempDir = resolve(__dirname, './temp-chunks');

  try {
    // Create temp directory for chunks
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
    mkdirSync(tempDir, { recursive: true });

    console.log('🚀 Начинаю chunked деплой на', config.host);
    console.log('📁 Локальная папка:', config.localRoot);
    console.log('🌐 Удаленная папка:', config.remoteRoot);
    console.log('📦 Размер чанка:', CHUNK_SIZE / 1024, 'KB');
    console.log('');

    // Connect to FTP
    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
      secure: false,
    });

    console.log('✅ Подключено к FTP');

    // Get all files to upload
    const distDir = config.localRoot;
    const files = [];

    function scanDir(dir, prefix = '') {
      const items = readdirSync(dir);
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath, prefix + item + '/');
        } else {
          files.push({
            local: fullPath,
            remote: prefix + item,
            size: stat.size,
          });
        }
      }
    }

    scanDir(distDir);

    // Separate small and large files
    const smallFiles = files.filter(f => f.size <= MAX_FILE_SIZE);
    const largeFiles = files.filter(f => f.size > MAX_FILE_SIZE);

    console.log(`📄 Маленьких файлов: ${smallFiles.length}`);
    console.log(`📦 Больших файлов (chunked): ${largeFiles.length}`);
    console.log('');

    // Upload small files first
    for (const file of smallFiles) {
      const remotePath = config.remoteRoot + file.remote;
      console.log(`📤 Загружаю: ${file.remote} (${(file.size / 1024).toFixed(1)}KB)`);

      // Ensure remote directory exists
      const remoteDir = remotePath.substring(0, remotePath.lastIndexOf('/'));
      try {
        await client.ensureDir(remoteDir);
        await client.cd('/');
      } catch (e) {}

      await uploadWithRetry(client, file.local, remotePath);
      console.log(`✅ ${file.remote}`);
    }

    // Upload large files in chunks
    if (largeFiles.length > 0) {
      console.log('');
      console.log('📦 Загрузка больших файлов чанками...');

      // First, upload the merge script
      const mergeScriptPath = join(tempDir, 'merge-chunks.php');
      writeFileSync(mergeScriptPath, mergeScript);

      for (const file of largeFiles) {
        const remotePath = config.remoteRoot + file.remote;
        const remoteDir = remotePath.substring(0, remotePath.lastIndexOf('/'));
        const fileName = basename(file.remote);

        console.log(`\n📦 Разбиваю: ${file.remote} (${(file.size / 1024).toFixed(1)}KB)`);

        // Split file into chunks
        const chunks = await splitFile(file.local);
        console.log(`   Создано чанков: ${chunks.length}`);

        // Ensure remote directory exists
        try {
          await client.ensureDir(remoteDir);
          await client.cd('/');
        } catch (e) {}

        // Upload merge script to assets folder
        const remoteMergeScript = remoteDir + '/merge-chunks.php';
        await uploadWithRetry(client, mergeScriptPath, remoteMergeScript);
        console.log(`   ✅ Merge-скрипт загружен`);

        // Upload each chunk
        for (let i = 0; i < chunks.length; i++) {
          const chunkPath = join(tempDir, `${fileName}.chunk${i}`);
          writeFileSync(chunkPath, chunks[i]);

          const remoteChunkPath = remoteDir + `/${fileName}.chunk${i}`;
          console.log(`   📤 Чанк ${i + 1}/${chunks.length} (${(chunks[i].length / 1024).toFixed(1)}KB)`);

          await uploadWithRetry(client, chunkPath, remoteChunkPath);
        }

        // Call PHP script to merge chunks
        const mergeUrl = `http://andojv.com/assets/merge-chunks.php?file=${encodeURIComponent(fileName)}&chunks=${chunks.length}`;
        console.log(`   🔗 Собираю файл на сервере...`);

        try {
          const response = await fetch(mergeUrl);
          const result = await response.json();

          if (result.success) {
            console.log(`   ✅ Файл собран: ${result.size} bytes`);
          } else {
            console.log(`   ❌ Ошибка сборки: ${result.error}`);
          }
        } catch (e) {
          console.log(`   ⚠️ Не удалось вызвать merge-скрипт: ${e.message}`);
          console.log(`   🔗 Вызови вручную: ${mergeUrl}`);
        }

        // Delete merge script
        try {
          await client.remove(remoteMergeScript);
          console.log(`   🗑️ Merge-скрипт удалён`);
        } catch (e) {}
      }
    }

    console.log('\n✅ Деплой завершен!');
    console.log('🌍 Сайт: http://andojv.com');

  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  } finally {
    client.close();
    // Cleanup temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  }
}

deploy();
