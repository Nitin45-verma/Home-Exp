const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const shadowRegex = /shadowColor:\s*[^,]+,\s*shadowOffset:\s*\{\s*width:\s*\d+,\s*height:\s*-?\d+\s*\},\s*shadowOpacity:\s*[\d.]+,\s*shadowRadius:\s*[\d.]+,?/g;
const shadowRegex2 = /shadowColor:\s*[^,]+,\s*\n\s*shadowOffset:\s*\{\s*width:\s*\d+,\s*height:\s*-?\d+\s*\},\s*\n\s*shadowOpacity:\s*[\d.]+,\s*\n\s*shadowRadius:\s*[\d.]+,?/g;

walk(directory, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace inline and multiline shadow groups
    content = content.replace(shadowRegex, "boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',");
    content = content.replace(shadowRegex2, "boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',\n");
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated shadows in: ${filePath}`);
    }
  }
});
console.log("Done.");
