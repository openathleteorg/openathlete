import type { z } from 'zod';

/**
 * Reads the JSON object out of a model's raw answer: models wrap it in a
 * ```json fence, add a sentence around it, or (gpt-oss) prefix a channel tag.
 */
export function parseJsonAnswer(text: string): unknown {
  let body = text;
  const channel = body.match(/<\|message\|>([\s\S]+)$/);
  if (channel?.[1]) body = channel[1];
  const fenced = body.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) body = fenced[1];
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end <= start) return undefined;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return undefined;
  }
}

/** Cuts a text to `max` characters at a word boundary, marked with "…". */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/**
 * Brings an answer within the schema's limits: strings over their maximum
 * are cut, arrays keep their first items, nullable fields left out become
 * null. Models often write a few words or one finding too many, and refusing
 * the whole answer for it loses a result the user would have read.
 * Everything else is left for the schema to accept or refuse.
 */
export function clampToSchema(value: unknown, schema: z.ZodTypeAny): unknown {
  if (value === null || value === undefined) return value;
  // By type name, not instanceof: the shared library may load its own zod
  const def = schema._def as ClampableDef;
  switch (def.typeName) {
    case 'ZodOptional':
    case 'ZodNullable':
    case 'ZodDefault':
      return clampToSchema(value, def.innerType!);
    case 'ZodEffects':
      return clampToSchema(value, def.schema!);
    case 'ZodLazy':
      return clampToSchema(value, def.getter!());
    case 'ZodString': {
      if (typeof value !== 'string') return value;
      const max = def.checks
        ?.filter((check) => check.kind === 'max')
        .reduce<number | null>(
          (lowest, check) =>
            Math.min(lowest ?? Infinity, check.value ?? Infinity),
          null,
        );
      return max == null || !Number.isFinite(max)
        ? value
        : truncate(value, max);
    }
    case 'ZodArray': {
      if (!Array.isArray(value)) return value;
      const max = def.maxLength?.value;
      const items = max === undefined ? value : value.slice(0, max);
      return items.map((item) => clampToSchema(item, def.type!));
    }
    case 'ZodObject': {
      if (typeof value !== 'object' || Array.isArray(value)) return value;
      const result: Record<string, unknown> = { ...value };
      for (const [key, field] of Object.entries(def.shape!())) {
        if (key in result) {
          result[key] = clampToSchema(result[key], field);
        } else if (field._def.typeName === 'ZodNullable') {
          // Left out rather than null: the schema asks for null
          result[key] = null;
        }
      }
      return result;
    }
    default:
      return value;
  }
}

/** The parts of zod 3 definitions the clamp reads */
interface ClampableDef {
  typeName?: string;
  innerType?: z.ZodTypeAny;
  schema?: z.ZodTypeAny;
  getter?: () => z.ZodTypeAny;
  checks?: Array<{ kind: string; value?: number }>;
  maxLength?: { value: number } | null;
  type?: z.ZodTypeAny;
  shape?: () => Record<string, z.ZodTypeAny>;
}
