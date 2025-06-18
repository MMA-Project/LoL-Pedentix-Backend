const locks = new Map<string, Promise<void>>();

export function getLockKey(...parts: string[]) {
  return parts.join("->");
}

export async function runWithLock(key: string, fn: () => Promise<void>) {
  while (locks.has(key)) {
    try {
      await locks.get(key);
    } catch (_) {
      break;
    }
  }

  const task = fn().finally(() => {
    locks.delete(key);
  });

  locks.set(key, task);
  return task;
}
