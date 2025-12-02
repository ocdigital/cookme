// Script to find all .includes calls and their context
const fs = require('fs');
const path = require('path');

function searchInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const results = [];

  lines.forEach((line, index) => {
    if (line.includes('.includes(') && !line.trim().startsWith('//')) {
      // Check if this line has optional chaining
      const hasOptionalChaining = line.includes('?.');
      const hasArrayLiteral = line.match(/\['.*?'\]\.includes/);
      const hasStringLiteral = line.match(/['"].*?['"]\.includes/);
      
      results.push({
        line: index + 1,
        code: line.trim(),
        safe: hasOptionalChaining || hasArrayLiteral || hasStringLiteral || line.includes(' && ')
      });
    }
  });

  return results;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      walkDir(filePath);
    } else if (file.endsWith('.js')) {
      const results = searchInFile(filePath);
      if (results.length > 0) {
        console.log(`\n${filePath}:`);
        results.forEach(r => {
          const icon = r.safe ? '✓' : '✗';
          console.log(`  ${icon} Line ${r.line}: ${r.code}`);
        });
      }
    }
  });
}

console.log('Searching for unsafe .includes() calls...\n');
walkDir(path.join(__dirname, 'src'));
