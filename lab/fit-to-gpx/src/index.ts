#!/usr/bin/env node

import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { SportsLib } from "@sports-alliance/sports-lib";
import { EventExporterGPX } from "@sports-alliance/sports-lib/lib/events/adapters/exporters/exporter.gpx.js";

async function convertFitToGpx(inputFilePath: string, outputGpxFilePath: string): Promise<boolean> {
  try {
    const inputFile = fs.readFileSync(inputFilePath, null);
    if (!inputFile || !inputFile.buffer) {
      console.error(`❌ Could not read the input file: ${inputFilePath}`);
      return false;
    }

    const inputFileBuffer = inputFile.buffer;
    
    // Use lib to read the FIT file
    const event = await SportsLib.importFromFit(inputFileBuffer as ArrayBuffer);
    
    // Convert to GPX
    const gpxString = await new EventExporterGPX().getAsString(event);
    
    // Write GPX file
    fs.writeFileSync(outputGpxFilePath, gpxString);
    console.log(`✅ Converted: ${path.basename(inputFilePath)} → ${path.basename(outputGpxFilePath)}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error converting ${path.basename(inputFilePath)}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

async function processDirectory(directoryPath: string): Promise<void> {
  try {
    // Check if directory exists
    const stats = await fsPromises.stat(directoryPath);
    if (!stats.isDirectory()) {
      console.error(`❌ Error: ${directoryPath} is not a directory`);
      process.exitCode = 1;
      return;
    }

    // Read directory contents
    const files = await fsPromises.readdir(directoryPath);
    
    // Filter .fit files
    const fitFiles = files.filter(file => file.toLowerCase().endsWith('.fit'));
    
    if (fitFiles.length === 0) {
      console.log(`ℹ️  No .fit files found in ${directoryPath}`);
      return;
    }

    console.log(`📁 Found ${fitFiles.length} .fit file(s) in ${directoryPath}`);
    console.log('🔄 Starting conversion...\n');

    let successCount = 0;
    let errorCount = 0;

    // Process each .fit file
    for (const fitFile of fitFiles) {
      const inputPath = path.join(directoryPath, fitFile);
      const outputPath = path.join(directoryPath, fitFile.replace(/\.fit$/i, '.gpx'));
      
      const success = await convertFitToGpx(inputPath, outputPath);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    console.log(`\n📊 Conversion completed:`);
    console.log(`   ✅ Success: ${successCount} file(s)`);
    console.log(`   ❌ Errors: ${errorCount} file(s)`);

    if (errorCount > 0) {
      process.exitCode = 1;
    }

  } catch (error) {
    console.error(`❌ Error accessing directory ${directoryPath}:`, error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  const [, , directoryPath] = process.argv;

  if (!directoryPath) {
    console.error("Usage: pnpm fit-to-gpx start <directory>");
    console.error("Example: pnpm fit-to-gpx start ./files/tristan-bouillot");
    process.exitCode = 1;
    return;
  }

  // Resolve the directory path relative to the project root, not the current working directory
  let resolvedPath: string;
  if (path.isAbsolute(directoryPath)) {
    resolvedPath = directoryPath;
  } else {
    // If the path is relative, resolve it from the original working directory
    // This assumes the script is run from the project root
    const projectRoot = process.env.INIT_CWD || process.cwd();
    resolvedPath = path.resolve(projectRoot, directoryPath);
  }
  
  console.log(`🚀 Starting FIT to GPX conversion for directory: ${resolvedPath}\n`);
  
  await processDirectory(resolvedPath);
}

main();
