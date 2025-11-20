import FtpDeploy from 'ftp-deploy';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем переменные окружения
dotenv.config();

const ftpDeploy = new FtpDeploy();

const config = {
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  host: process.env.FTP_HOST,
  port: process.env.FTP_PORT || 21,
  localRoot: resolve(__dirname, './dist'),
  remoteRoot: process.env.FTP_REMOTE_PATH || '/www/andojv.com/',
  include: ['*', '**/*'],
  exclude: [],
  deleteRemote: false,
  forcePasv: true,
  sftp: false,
};

console.log('🚀 Начинаю деплой на', config.host);
console.log('📁 Локальная папка:', config.localRoot);
console.log('🌐 Удаленная папка:', config.remoteRoot);
console.log('');

ftpDeploy
  .deploy(config)
  .then((res) => {
    console.log('✅ Деплой завершен успешно!');
    console.log('🌍 Сайт доступен по адресу: http://andojv.com');
  })
  .catch((err) => {
    console.error('❌ Ошибка деплоя:', err);
    process.exit(1);
  });

ftpDeploy.on('uploading', (data) => {
  const percent = ((data.transferredFileCount / data.totalFilesCount) * 100).toFixed(0);
  console.log(`📤 [${percent}%] Загружаю: ${data.filename}`);
});

ftpDeploy.on('uploaded', (data) => {
  console.log(`✓ Загружено: ${data.filename}`);
});

ftpDeploy.on('log', (data) => {
  console.log('ℹ️', data);
});
