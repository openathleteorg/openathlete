import path from "path";

export interface CliArgs {
  gpx: string;
  config: string;
  markdown?: string; // optional path to write markdown export
  json?: string; // optional path to write structured visualization JSON export
}

function normalizeValue(v: string | undefined): string | undefined {
  if (!v) return v;
  const isUrl = /^https?:\/\//i.test(v);
  if (isUrl) return v;
  const base = process.env.INIT_CWD || process.cwd();
  return path.isAbsolute(v) ? v : path.resolve(base, v);
}

export function parseCli(argv: string[]): CliArgs {
  let gpx: string | undefined;
  let config: string | undefined;
  let markdown: string | undefined;
  let json: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const eqIdx = arg.indexOf("=");
    const key = (eqIdx === -1 ? arg.slice(2) : arg.slice(2, eqIdx)).trim();
    const val = eqIdx === -1 ? argv[i + 1] : arg.slice(eqIdx + 1);
    if (eqIdx === -1 && val && val.startsWith("--")) {
    } else if (eqIdx === -1 && val) {
      i++;
    }
    switch (key) {
      case "gpx":
        gpx = normalizeValue(val);
        break;
      case "config":
        config = normalizeValue(val);
        break;
      case "markdown":
        markdown = normalizeValue(val);
        break;
      case "json":
        json = normalizeValue(val);
        break;
      case "help":
      case "h":
        printHelpAndExit();
        break;
      default:
        // ignore unknown flags for now
        break;
    }
  }

  if (!gpx || !config) {
    const missing = [!gpx ? "--gpx" : null, !config ? "--config" : null]
      .filter(Boolean)
      .join(", ");
    console.error(`Missing required flag(s): ${missing}`);
    printHelpAndExit(1);
  }

  return { gpx, config, markdown, json } as CliArgs;
}

export function printHelpAndExit(code = 0): never {
  const base = [
    "Usage:",
    "  pnpm race-plan-generator start --gpx <file.gpx|http(s)://...> --config <file.json>",
    "",
    "Flags:",
    "  --gpx        Path or URL to a GPX file (required)",
    "  --config     Path to configuration JSON (required)",
    "  --markdown   Optional path to write a markdown export for aid stations (e.g. dist/plan.md)",
    "  --json       Optional path to write a structured JSON export for web viewer (e.g. dist/plan.json)",
    "  --help       Show this help",
  ].join("\n");
  console.log(base);
  // eslint-disable-next-line no-process-exit
  process.exit(code);
}
