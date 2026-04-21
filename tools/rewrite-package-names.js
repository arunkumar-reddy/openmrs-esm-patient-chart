#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

if (!process.argv[2]) {
  console.error('Usage: rewrite-package-names.js <package-dir>');
  process.exit(1);
}

const pkgDir = process.argv[2];
const pkgFile = path.join(pkgDir, 'package.json');

try {
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  if (pkg.name && pkg.name.startsWith('@arunkumar-reddy/')) {
    pkg.name = pkg.name.replace('@arunkumar-reddy/', '@openmrs/');
    fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Renamed: ${pkg.name}`);
  }
} catch (err) {
  console.error(`Error processing ${pkgDir}:`, err.message);
  process.exit(1);
}
