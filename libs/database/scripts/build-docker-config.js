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

// Read compiled file and remove dotenv import
console.log('Removing dotenv import for Docker...');
let content = fs.readFileSync(configJsPath, 'utf8');

// Remove require('dotenv/config') or require("dotenv/config")
content = content.replace(/require\(['"]dotenv\/config['"]\);?\s*/g, '');

// Write back
fs.writeFileSync(configJsPath, content);

console.log('✓ prisma.config.js built for Docker (without dotenv)');

