#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";

type NullableString = string | number | null;

type AthleEntry = {
  id?: NullableString;
  ID?: NullableString;
  club?: NullableString;
  nomstade?: NullableString;
  ville?: NullableString;
  cp?: NullableString;
  contenu?: NullableString;
  piste?: NullableString;
  jeunes?: NullableString;
  htniveau?: NullableString;
  santeloisir?: NullableString;
  horsstade?: NullableString;
  [key: string]: unknown;
};

const DATASET_PATH = path.join(__dirname, "..", "athle.json");
const DUPLICATE_FLAG = "--duplicate";
const COUNT_FLAG = "--count";
const MAIL_FLAG = "--mail";

async function readDataset(): Promise<AthleEntry[]> {
  const rawContent = await fs.readFile(DATASET_PATH, "utf-8");
  const parsed = JSON.parse(rawContent);

  if (!Array.isArray(parsed)) {
    throw new Error("Expected athle.json to be a JSON array.");
  }

  return parsed as AthleEntry[];
}

async function writeDataset(entries: AthleEntry[]): Promise<void> {
  const serialized = JSON.stringify(entries, null, 2);
  await fs.writeFile(DATASET_PATH, `${serialized}\n`, "utf-8");
}

function normalizeId(entry: AthleEntry): string | null {
  const candidate = entry.id ?? entry.ID;
  if (candidate === null || candidate === undefined) {
    return null;
  }

  const normalized = String(candidate).trim();
  return normalized.length === 0 ? null : normalized;
}

function removeDuplicatesById(entries: AthleEntry[]): {
  uniqueEntries: AthleEntry[];
  duplicateCount: number;
  samples: Array<{ id: string; firstIndex: number; duplicateIndex: number }>;
} {
  const seenIds = new Map<string, number>();
  const uniqueEntries: AthleEntry[] = [];
  const samples: Array<{
    id: string;
    firstIndex: number;
    duplicateIndex: number;
  }> = [];

  let duplicateCount = 0;

  entries.forEach((entry, index) => {
    const normalizedId = normalizeId(entry);
    if (!normalizedId) {
      uniqueEntries.push(entry);
      return;
    }

    const firstIndex = seenIds.get(normalizedId);
    if (firstIndex === undefined) {
      seenIds.set(normalizedId, index);
      uniqueEntries.push(entry);
      return;
    }

    duplicateCount += 1;
    if (samples.length < 10) {
      samples.push({
        id: normalizedId,
        firstIndex,
        duplicateIndex: index,
      });
    }
  });

  return {
    uniqueEntries,
    duplicateCount,
    samples,
  };
}

async function handleDuplicateFlag(): Promise<void> {
  const entries = await readDataset();
  const { uniqueEntries, duplicateCount, samples } =
    removeDuplicatesById(entries);

  if (duplicateCount === 0) {
    console.log("No duplicates found. File left unchanged.");
    return;
  }

  await writeDataset(uniqueEntries);

  console.log(
    `Removed ${duplicateCount} duplicate entr${duplicateCount > 1 ? "ies" : "y"} from athle.json.`
  );

  if (samples.length > 0) {
    console.log("First duplicates encountered:");
    samples.forEach((sample) => {
      console.log(
        `  • id=${sample.id} firstIndex=${sample.firstIndex} duplicateIndex=${sample.duplicateIndex}`
      );
    });
    if (duplicateCount > samples.length) {
      console.log(`  ...and ${duplicateCount - samples.length} more.`);
    }
  }
}

async function handleCountFlag(): Promise<void> {
  const entries = await readDataset();
  console.log(`Total entries: ${entries.length}`);
}

type MailExportEntry = {
  name: string;
  city: string;
  postalCode: string;
  categories: string[];
  email: string;
};

const CATEGORY_FIELDS: Array<{
  field: keyof AthleEntry;
  label: string;
}> = [
  { field: "jeunes", label: "jeunes" },
  { field: "piste", label: "piste" },
  { field: "htniveau", label: "haut_niveau" },
  { field: "santeloisir", label: "sante_loisir" },
  { field: "horsstade", label: "hors_stade" },
];

function extractEmailsFromContent(content: unknown): string[] {
  if (typeof content !== "string" || content.length === 0) {
    return [];
  }

  const regex = /mailto:([^"'>\s]+)/gi;
  const emails = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const email = match[1].split("?")[0].trim();
    if (email.length > 0) {
      emails.add(email.toLowerCase());
    }
  }

  return [...emails];
}

function computeCategories(entry: AthleEntry): string[] {
  return CATEGORY_FIELDS.reduce<string[]>((acc, { field, label }) => {
    const value = entry[field];
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim().toUpperCase() !== "NULL"
    ) {
      acc.push(label);
    }
    return acc;
  }, []);
}

async function handleMailFlag(): Promise<void> {
  const entries = await readDataset();
  const deduped = new Map<string, MailExportEntry>();

  entries.forEach((entry) => {
    const emails = extractEmailsFromContent(entry.contenu);
    if (emails.length === 0) {
      return;
    }

    const categories = computeCategories(entry);
    const name = String(entry.club ?? entry.nomstade ?? "").trim();
    const city = String(entry.ville ?? "").trim();
    const postalCode = String(entry.cp ?? "").trim();

    emails.forEach((email) => {
      if (deduped.has(email)) {
        return;
      }

      deduped.set(email, {
        name,
        city,
        postalCode,
        categories,
        email,
      });
    });
  });

  const payload = [...deduped.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const outputPath = path.join(__dirname, "..", "mail.json");
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

  console.log(
    `Extracted ${payload.length} unique email entr${
      payload.length > 1 ? "ies" : "y"
    } into mail.json`
  );
}

async function main(): Promise<void> {
  const [flag] = process.argv.slice(2);

  switch (flag) {
    case DUPLICATE_FLAG:
      await handleDuplicateFlag();
      break;
    case COUNT_FLAG:
      await handleCountFlag();
      break;
    case MAIL_FLAG:
      await handleMailFlag();
      break;
    default:
      console.log("Usage:");
      console.log(`  pnpm start -- ${DUPLICATE_FLAG}`);
      console.log(`  pnpm start -- ${COUNT_FLAG}`);
      console.log(`  pnpm start -- ${MAIL_FLAG}`);
      process.exit(flag ? 1 : 0);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
