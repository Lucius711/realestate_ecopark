// shortcut: in-memory and per-process, resets on restart; move to Redis if the API runs on several instances.
/** "At most `limit` events per `windowMs` per key" (per IP, per account…). */
export class SlidingWindow<K> {
  private hits = new Map<K, number[]>();
  constructor(
    private limit: number,
    private windowMs: number,
  ) {}

  private recent(key: K) {
    const now = Date.now();
    return (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
  }

  full(key: K) {
    return this.recent(key).length >= this.limit;
  }

  hit(key: K) {
    this.hits.set(key, [...this.recent(key), Date.now()]);
  }
}
