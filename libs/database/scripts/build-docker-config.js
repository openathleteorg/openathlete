#!/usr/bin/env node

/**
 * Build prisma.config.js for Docker (without dotenv dependency)
 * This script compiles prisma.config.ts and removes the dotenv import
 * since environment variables are already injected in Docker/production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const configDir = path.dirname(__dirname); // Go up from scripts/ to libs/database/
const configTsPath = path.join(configDir, 'prisma.config.ts');
const configJsPath = path.join(configDir, 'prisma.config.js');

// Compile TypeScript config
console.log('Compiling prisma.config.ts...');
execSync(
  'tsc prisma.config.ts --outDir . --module commonjs --target es2016 --esModuleInterop --skipLibCheck',
  { cwd: configDir, stdio: 'inherit' }
);

// Read compiled file and transform for Prisma compatibility
console.log('Transforming config for Docker/Prisma...');
let content = fs.readFileSync(configJsPath, 'utf8');

// Remove require('dotenv/config') or require("dotenv/config") if present
content = content.replace(/require\(['"]dotenv\/config['"]\);?\s*/g, '');

// Convert exports.default to module.exports and simplify path usage
// Extract the config object
const defaultExportMatch = content.match(/exports\.default\s*=\s*(\{[\s\S]*?\});?\s*$/m);
if (defaultExportMatch) {
  // Get the config object content
  const configObject = defaultExportMatch[1];

  // Replace node_path_1.default.join with path.join
  const simplifiedConfig = configObject.replace(/node_path_1\.default\.join/g, 'path.join');

  // Generate clean CommonJS module
  content = `const path = require('path');

module.exports = ${simplifiedConfig};
`;
}

// Write back
fs.writeFileSync(configJsPath, content);

console.log('✓ prisma.config.js built for Docker (without dotenv)');

