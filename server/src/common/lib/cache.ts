/**
 *
 * implement a simple caching mechanism for web content
 *
 * @param ttl : cache time in seconds
 *
 **/
export class Cache<T> {
  ttl: number;
  cache: { [key: string]: { data: T; timestamp: number } | undefined };

  constructor(ttl: number) {
    this.ttl = ttl;
    this.cache = {};
  }

  get(key: string): T | null {
    const entry = this.cache[key];
    let data: T | null = null;

    if (entry) {
      // check the time stamp to see if it's a stale entry
      if (Date.now() - entry.timestamp > this.ttl * 1000) {
        console.log('cache hit for ' + key + ', but entry expired');

        this.cache[key] = undefined;
      } else {
        console.log('cache hit for ' + key);

        data = this.cache[key]?.data ?? null;
      }
    } else {
      console.log('no cache entry for ' + key);
    }

    return data;
  }

  put(key: string, obj: T) {
    if (obj) {
      console.log('setting cache entry for ' + key);

      this.cache[key] = {
        data: obj,
        timestamp: Date.now(),
      };
    } else {
      this.cache[key] = undefined;
    }
  }
}
