export function getDefaultStorage(): Storage {
  return globalThis.localStorage;
}

export function safeRead(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeWrite(storage: Storage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    // Out of quota, most likely. Losing a write is survivable; throwing out of the
    // listener middleware is not.
    return false;
  }
}

export function safeRemove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Nothing useful to do.
  }
}
