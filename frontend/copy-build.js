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
  for (const entry of fs.readdirSync(distDir, { withFileTypes: true })) {
    const srcPath = path.join(distDir, entry.name);
    const rootDest = path.join(rootDir, entry.name);
    const panelDest = path.join(panelDir, entry.name);

    if (entry.isDirectory()) {
      cleanAndCopyDir(srcPath, rootDest);
      cleanAndCopyDir(srcPath, panelDest);
    } else {
      fs.copyFileSync(srcPath, rootDest);
      fs.copyFileSync(srcPath, panelDest);
    }
  }
  console.log('Successfully cleaned and synced all dist files to root and panel!');
}
