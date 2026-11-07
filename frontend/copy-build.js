import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const rootDir = path.resolve(__dirname, '..');
const panelDir = path.resolve(rootDir, 'panel');

function cleanAndCopyDir(src, dest) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      cleanAndCopyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(distDir)) {
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    cleanAndCopyDir(assetsDir, path.join(rootDir, 'assets'));
    cleanAndCopyDir(assetsDir, path.join(panelDir, 'assets'));
  }
  const indexHtml = path.join(distDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, path.join(rootDir, 'index.html'));
    fs.copyFileSync(indexHtml, path.join(panelDir, 'index.html'));
  }
  console.log('Successfully cleaned and synced dist to root and panel!');
}
