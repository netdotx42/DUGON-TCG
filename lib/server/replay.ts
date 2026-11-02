/**
 * Best-effort replay guard: remembers the latest accepted sequence number per battle in memory.
 * Prevents "rewinding" a battle by resubmitting an older sealed token on the same server instance.
 * On multi-instance serverless deployments this should be backed by a shared KV store (see SECURITY_AUDIT.md).
 */
const latest = new Map<string, { seq: number; at: number }>();
const MAX_ENTRIES = 5000;

export function checkAndRecord(battleId: string, seq: number): boolean {
  const prev = latest.get(battleId);
  if (prev && seq < prev.seq) return false;
  latest.set(battleId, { seq, at: Date.now() });
  if (latest.size > MAX_ENTRIES) {
    const oldest = [...latest.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, latest.size - MAX_ENTRIES);
    for (const [k] of oldest) latest.delete(k);
  }
  return true;
}

export function _resetReplayGuard() {
  latest.clear();
}
