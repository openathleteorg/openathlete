type RemoveUnderscoreFirstLetter<S extends string> =
  S extends `${infer FirstLetter}${infer U}`
    ? `${FirstLetter extends '_' ? U : `${FirstLetter}${U}`}`
    : S;

type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${RemoveUnderscoreFirstLetter<Lowercase<T>>}${CamelToSnakeCase<U>}`
  : S;

export type ConvertKeysToSnakeCase<T> =
  T extends Record<string, unknown>
    ? {
        [Key in keyof T as CamelToSnakeCase<
          Key & string
        >]: ConvertKeysToSnakeCase<T[Key]>;
      }
    : T extends Array<Record<string, unknown>>
      ? Array<ConvertKeysToSnakeCase<T[number]>>
      : T;

export type ConvertKeysToLowerCase<T> =
  T extends Record<string, unknown>
    ? {
        [Key in keyof T as Lowercase<Key & string>]: ConvertKeysToLowerCase<
          T[Key]
        >;
      }
    : T extends Array<Record<string, unknown>>
      ? Array<ConvertKeysToLowerCase<T[number]>>
      : T;

export function keysToSnake<T>(obj: T): ConvertKeysToSnakeCase<T> {
  if (
    obj === Object(obj) &&
    !Array.isArray(obj) &&
    typeof obj !== 'function' &&
    !(obj instanceof Date)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n = {} as { [key: string]: any };
    Object.keys(obj as object).forEach((k: string) => {
      n[k.replace(/([A-Z])/g, '_$1').toLowerCase()] = keysToSnake(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any)[k],
      );
    });
    return n as ConvertKeysToSnakeCase<T>;
  } else if (Array.isArray(obj)) {
    return obj.map((i) => {
      return keysToSnake(i);
    }) as ConvertKeysToSnakeCase<T>;
  }
  return obj as ConvertKeysToSnakeCase<T>;
}

export function keysToLower<T>(obj: T): ConvertKeysToLowerCase<T> {
  if (
    obj === Object(obj) &&
    !Array.isArray(obj) &&
    typeof obj !== 'function' &&
    !(obj instanceof Date)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n = {} as { [key: string]: any };
    Object.keys(obj as object).forEach((k: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      n[k.toLowerCase()] = keysToLower((obj as any)[k]);
    });
    return n as ConvertKeysToLowerCase<T>;
  } else if (Array.isArray(obj)) {
    return obj.map((i) => {
      return keysToLower(i);
    }) as ConvertKeysToLowerCase<T>;
  }
  return obj as ConvertKeysToLowerCase<T>;
}
