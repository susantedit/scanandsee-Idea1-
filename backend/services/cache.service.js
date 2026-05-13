import NodeCache from 'node-cache';
import logger from '../utils/logger.js';

// Default TTL: 5 minutes, check period: 60 seconds
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const cacheService = {
  /**
   * Get a cached value.
   * @param {string} key
   * @returns {any|undefined}
   */
  get(key) {
    const value = cache.get(key);
    if (value !== undefined) {
      logger.debug(`Cache HIT: ${key}`);
    }
    return value;
  },

  /**
   * Set a cached value.
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - seconds (0 = use default)
   */
  set(key, value, ttl = 0) {
    const success = ttl > 0 ? cache.set(key, value, ttl) : cache.set(key, value);
    logger.debug(`Cache SET: ${key} (ttl: ${ttl || 'default'}s)`);
    return success;
  },

  /**
   * Delete a cached value.
   */
  del(key) {
    return cache.del(key);
  },

  /**
   * Flush all cached values.
   */
  flush() {
    cache.flushAll();
    logger.info('Cache flushed');
  },

  /**
   * Get or compute a value (cache-aside pattern).
   * @param {string} key
   * @param {Function} computeFn - async function that returns the value
   * @param {number} ttl - seconds
   */
  async getOrSet(key, computeFn, ttl = 0) {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const value = await computeFn();
    this.set(key, value, ttl);
    return value;
  },

  /**
   * Get cache statistics.
   */
  stats() {
    return cache.getStats();
  },
};
