let pending = Promise.resolve();

export function withAuthLoginLock<T>(write: () => T): Promise<T> {
  const writing = pending.then(write);
  pending = writing.then(
    () => undefined,
    () => undefined,
  );
  return writing;
}
