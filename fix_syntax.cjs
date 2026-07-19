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
walk(path.join(__dirname, 'src'), (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/import\s+toast\s*,\s*from\s+["']react-hot-toast["']/g, 'import toast from "react-hot-toast"');
    content = content.replace(/import\s+toast\s*,\s*{\s*}\s*from\s+["']react-hot-toast["']/g, 'import toast from "react-hot-toast"');
    content = content.replace(/import\s*{\s*}\s*from\s+["']react-hot-toast["']/g, '');
    
    // Also strip Toaster if it somehow got left in SuperAdminDashboard
    content = content.replace(/<Toaster\b[^>]*\/>/g, '');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed syntax error in', filePath);
      count++;
    }
  }
});
console.log(`Cleaned up syntax errors in ${count} files.`);
