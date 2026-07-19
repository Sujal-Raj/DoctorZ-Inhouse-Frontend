const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count = 0;
walk(path.join(__dirname, 'src', 'pages'), (filePath) => {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove <Toaster ... /> (single line or multiline)
    content = content.replace(/<Toaster[^>]*\/>/g, '');
    
    // Remove Toaster from import { ..., Toaster, ... } from 'react-hot-toast'
    // It could be import toast, { Toaster } from "react-hot-toast";
    content = content.replace(/,\s*Toaster/g, '');
    content = content.replace(/Toaster\s*,/g, '');
    content = content.replace(/{\s*Toaster\s*}/g, '');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
      count++;
    }
  }
});
console.log(`Cleaned up Toaster from ${count} files.`);
