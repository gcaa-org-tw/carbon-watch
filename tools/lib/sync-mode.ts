export const SYNC_SWITCH_RANGE = '_同步控制!B1';

export type SwitchRead = { ok: true; value: unknown } | { ok: false; error: string };

export interface SyncMode {
  fundOnly: boolean;
  failSafe: boolean;
  reason: string;
}

export function decideSyncMode(event: string, scope: string, read: SwitchRead | null): SyncMode {
  if (event !== 'schedule') {
    return { fundOnly: scope === 'fund', failSafe: false, reason: `manual run, scope=${scope || 'all'}` };
  }

  const prefix = `scheduled run, switch ${SYNC_SWITCH_RANGE}`;
  if (!read || !read.ok) {
    return {
      fundOnly: true,
      failSafe: true,
      reason: `${prefix} could not be read (${read ? read.error : 'not read'}); falling back to fund tabs only`,
    };
  }
  if (typeof read.value !== 'boolean') {
    return {
      fundOnly: true,
      failSafe: true,
      reason: `${prefix} is not TRUE/FALSE (got ${JSON.stringify(read.value) ?? 'an empty cell'}); falling back to fund tabs only`,
    };
  }
  return { fundOnly: !read.value, failSafe: false, reason: `${prefix} is ${read.value ? 'TRUE' : 'FALSE'}` };
}
