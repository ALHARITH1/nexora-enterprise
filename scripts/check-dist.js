import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist.');
  process.exit(1);
}

const htmlFile = path.join(distDir, 'index.html');
if (!fs.existsSync(htmlFile)) {
  console.error('Error: dist/index.html does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(htmlFile, 'utf8');

// Basic check to see if we have bundles inside.
const hasJs = fs.readdirSync(path.join(distDir, 'assets')).some(f => f.endsWith('.js'));
const hasCss = fs.readdirSync(path.join(distDir, 'assets')).some(f => f.endsWith('.css'));

let hasError = false;

if (!hasJs) {
  console.error('Error: No bundled JS found in dist/assets.');
  hasError = true;
}
if (!hasCss) {
  console.error('Error: No bundled CSS found in dist/assets.');
  hasError = true;
}

const requiredFiles = ['sw.js', 'manifest.json'];
requiredFiles.forEach(file => {
  if (!fs.existsSync(path.join(distDir, file))) {
    console.error(`Error: Required file ${file} is missing from dist.`);
    hasError = true;
  }
});

if (hasError) {
  process.exit(1);
}

console.log('Artifact check passed: Module graph successfully built and assets exist.');
process.exit(0);
