import { globalLocks } from '../data/store';

export function generateZoneLockKey(zoneId: string, date: string, startTime: string, endTime: string): string {
  return `${zoneId}:${date}:${startTime}-${endTime}`;
}

export function generateCouponLockKey(couponId: string): string {
  return `coupon:${couponId}`;
}

export function generateMemberLockKey(memberId: string): string {
  return `member:${memberId}`;
}

export function acquireLock(key: string, holderId: string, timeoutMs: number = 5000): boolean {
  const now = Date.now();
  const existingLock = globalLocks.get(key);

  if (!existingLock) {
    globalLocks.set(key, { holder: holderId, acquiredAt: now });
    return true;
  }

  if (existingLock.holder === holderId) {
    existingLock.acquiredAt = now;
    return true;
  }

  const isExpired = now - existingLock.acquiredAt > timeoutMs;
  if (isExpired) {
    globalLocks.set(key, { holder: holderId, acquiredAt: now });
    return true;
  }

  return false;
}

export function releaseLock(key: string, holderId: string): boolean {
  const existingLock = globalLocks.get(key);
  if (!existingLock) {
    return false;
  }
  if (existingLock.holder !== holderId) {
    return false;
  }
  globalLocks.delete(key);
  return true;
}

export function releaseAllLocks(holderId: string): void {
  const keysToDelete: string[] = [];
  for (const [key, lock] of globalLocks.entries()) {
    if (lock.holder === holderId) {
      keysToDelete.push(key);
    }
  }
  for (const key of keysToDelete) {
    globalLocks.delete(key);
  }
}

export async function withLock<T>(
  keys: string | string[],
  holderId: string,
  fn: () => Promise<T>,
  timeoutMs?: number
): Promise<T> {
  const keyArray = Array.isArray(keys) ? keys : [keys];

  const acquiredKeys: string[] = [];
  let allAcquired = true;

  for (const key of keyArray) {
    const acquired = acquireLock(key, holderId, timeoutMs);
    if (acquired) {
      acquiredKeys.push(key);
    } else {
      allAcquired = false;
      break;
    }
  }

  if (!allAcquired) {
    for (const key of acquiredKeys) {
      releaseLock(key, holderId);
    }
    throw new Error(`获取锁失败，holder: ${holderId}, keys: ${keyArray.join(', ')}`);
  }

  try {
    return await fn();
  } finally {
    for (const key of keyArray) {
      releaseLock(key, holderId);
    }
  }
}
