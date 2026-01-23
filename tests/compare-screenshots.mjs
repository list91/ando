/**
 * Compare screenshots using pixelmatch (ESM version)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const CURRENT_DIR = path.join(SCREENSHOTS_DIR, 'current');
const BASELINE_DIR = path.join(SCREENSHOTS_DIR, 'baseline');
const DIFF_DIR = path.join(SCREENSHOTS_DIR, 'diff');

// Ensure diff directory exists
if (!fs.existsSync(DIFF_DIR)) {
  fs.mkdirSync(DIFF_DIR, { recursive: true });
}

function resizeImage(img, width, height) {
  if (img.width === width && img.height === height) {
    return img;
  }

  const resized = new PNG({ width, height, fill: true });
  // Fill with white
  for (let i = 0; i < resized.data.length; i += 4) {
    resized.data[i] = 255;     // R
    resized.data[i + 1] = 255; // G
    resized.data[i + 2] = 255; // B
    resized.data[i + 3] = 255; // A
  }

  // Copy original image
  for (let y = 0; y < img.height && y < height; y++) {
    for (let x = 0; x < img.width && x < width; x++) {
      const srcIdx = (img.width * y + x) << 2;
      const dstIdx = (width * y + x) << 2;
      resized.data[dstIdx] = img.data[srcIdx];
      resized.data[dstIdx + 1] = img.data[srcIdx + 1];
      resized.data[dstIdx + 2] = img.data[srcIdx + 2];
      resized.data[dstIdx + 3] = img.data[srcIdx + 3];
    }
  }

  return resized;
}

function compareImages(baselineName, currentName, diffName) {
  const baselinePath = path.join(BASELINE_DIR, baselineName);
  const currentPath = path.join(CURRENT_DIR, currentName);
  const diffPath = path.join(DIFF_DIR, diffName);

  if (!fs.existsSync(baselinePath)) {
    console.log(`Baseline not found: ${baselinePath}`);
    return { error: 'baseline_missing', percentage: null };
  }

  if (!fs.existsSync(currentPath)) {
    console.log(`Current not found: ${currentPath}`);
    return { error: 'current_missing', percentage: null };
  }

  try {
    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
    const current = PNG.sync.read(fs.readFileSync(currentPath));

    console.log(`  Baseline: ${baseline.width}x${baseline.height}`);
    console.log(`  Current:  ${current.width}x${current.height}`);

    // Handle size mismatch
    const width = Math.max(baseline.width, current.width);
    const height = Math.max(baseline.height, current.height);

    // Resize images if needed
    const resizedBaseline = resizeImage(baseline, width, height);
    const resizedCurrent = resizeImage(current, width, height);

    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
      resizedBaseline.data,
      resizedCurrent.data,
      diff.data,
      width,
      height,
      { threshold: 0.1 }
    );

    fs.writeFileSync(diffPath, PNG.sync.write(diff));

    const totalPixels = width * height;
    const percentage = ((numDiffPixels / totalPixels) * 100).toFixed(2);

    return {
      diffPixels: numDiffPixels,
      totalPixels,
      percentage: `${percentage}%`,
      diffPath
    };
  } catch (err) {
    console.error(`Error comparing ${baselineName} vs ${currentName}:`, err.message);
    return { error: err.message, percentage: null };
  }
}

console.log('='.repeat(60));
console.log('COMPARISON: Baseline vs Current');
console.log('='.repeat(60));

const comparisons = [
  { baseline: 'baseline-13-admin-orders.png', current: 'after-13-admin-orders.png', diff: 'diff-13-admin-orders.png', name: 'pravka-13' },
  { baseline: 'baseline-17-home-desktop.png', current: 'after-17-home-desktop.png', diff: 'diff-17-home-desktop.png', name: 'pravka-17-desktop' },
  { baseline: 'baseline-17-home-mobile.png', current: 'after-17-home-mobile.png', diff: 'diff-17-home-mobile.png', name: 'pravka-17-mobile' },
  { baseline: 'baseline-20-product-colors.png', current: 'after-20-product-colors.png', diff: 'diff-20-product-colors.png', name: 'pravka-20' }
];

const diffResults = {};

for (const comp of comparisons) {
  console.log(`\nComparing: ${comp.baseline} vs ${comp.current}`);
  const result = compareImages(comp.baseline, comp.current, comp.diff);
  diffResults[comp.name] = result.percentage || result.error;
  console.log(`Result: ${result.percentage || result.error}`);
}

console.log('\n' + '='.repeat(60));
console.log('DIFF PERCENTAGES:');
console.log(JSON.stringify(diffResults, null, 2));
console.log('='.repeat(60));
