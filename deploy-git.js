import { execSync } from 'child_process';

const DEPLOY_URL = 'https://andojv.com/deploy.php?token=ando-deploy-2024&action=pull';

console.log('🚀 ANDO Git Deploy\n');

try {
  // 1. Build
  console.log('📦 Building...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Git add
  console.log('\n📝 Staging changes...');
  execSync('git add -A', { stdio: 'inherit' });

  // 3. Check if there are changes to commit
  const status = execSync('git status --porcelain').toString();

  if (status.trim()) {
    // 4. Git commit
    console.log('\n💾 Committing...');
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    execSync(`git commit -m "Deploy: ${timestamp}"`, { stdio: 'inherit' });
  } else {
    console.log('\n✓ No changes to commit');
  }

  // 5. Git push
  console.log('\n⬆️ Pushing to GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });

  // 6. Trigger server deploy
  console.log('\n🔄 Triggering server deploy...');
  const response = execSync(`curl -sL "${DEPLOY_URL}"`).toString();
  console.log(response);

  console.log('\n✅ Deploy complete!');
  console.log('🌍 Site: https://andojv.com');

} catch (error) {
  console.error('\n❌ Deploy failed:', error.message);
  process.exit(1);
}
