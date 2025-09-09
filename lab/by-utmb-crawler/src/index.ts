#!/usr/bin/env node

import axios from "axios";
import fs from "fs";
import path from "path";

async function saveToFile(
  race: string,
  year: string,
  bib: number,
  data: any
): Promise<void> {
  const dir = path.join(__dirname, "..", "dist");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const filePath = path.join(dir, `${race}_${year}.json`);
  let fileData: any[] = [];
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    fileData = JSON.parse(fileContent);
  }
  if (fileData.some((entry) => entry.bib === bib)) {
    console.log(`Bib ${bib} already exists in ${filePath}. Skipping.`);
    return;
  }
  fileData.push({
    bib,
    ...data,
  });
  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
  console.log(`Saved bib ${bib} data to ${filePath}`);
}

async function fetchData(race: string, year: string): Promise<void> {
  let bibNumber = 1;
  const errorCountLimit = 10;
  let errorCount = 0;

  while (true) {
    try {
      const response = await axios.get(
        `https://live.utmb.world/_next/data/7zHIE-Xo5cTrImZXbBPPf/fr/${race}/${year}/runners/${bibNumber}.json`,
        {
          params: {
            tenant: race,
            year: year,
            bib: bibNumber,
          },
        }
      );
      await saveToFile(race, year, bibNumber, response.data.pageProps.runner);
      errorCount = 0; // Reset error count on success
      bibNumber++;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`Bib ${bibNumber} not found (404).`);
        errorCount++;
        if (errorCount >= errorCountLimit) {
          console.log("Reached error limit. Stopping.");
          break;
        }
        bibNumber++;
      } else {
        console.error(`Error fetching bib ${bibNumber}:`, error);
        break;
      }
    }

    if (bibNumber > 3) {
      console.log("Stopping after 3 requests for demonstration purposes.");
      break;
    }
  }
}

async function main(): Promise<void> {
  const [, , race, year] = process.argv;

  if (!race || !year) {
    console.error("Usage: by-utmb-crawler <race> <year>");
    process.exit(1);
  }

  await fetchData(race, year);
}

main();
