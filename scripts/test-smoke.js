const fs = require('fs');
const path = require('path');

const publicIndex = path.join(__dirname, '..', 'public', 'index.html');
if (!fs.existsSync(publicIndex)) {
  console.error('FAIL: public/index.html not found');
  process.exit(2);
}

const html = fs.readFileSync(publicIndex, 'utf8');
if (!html.includes('Notary Public CRM')) {
  console.error('FAIL: index.html missing expected title string');
  process.exit(2);
}

console.log('OK: public/index.html exists and contains title');
process.exit(0);
