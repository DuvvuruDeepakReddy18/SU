import { Injectable, Logger } from '@nestjs/common';

type Cached = { lat: number; lng: number; at: number };

/**
 * Tiny in-memory geocoder backed by the public Nominatim API (free).
 * Rate-limited to 1 req/sec per their policy — we cache results aggressively
 * by lowercased query string to avoid hammering them.
 *
 * For production, swap for a paid provider (e.g. Mapbox, Google) or self-host
 * Nominatim. Keeping the interface synchronous from the caller's POV.
 */
@Injectable()
export class GeocodeService {
  private readonly log = new Logger(GeocodeService.name);
  private readonly cache = new Map<string, Cached>();
  private lastCallAt = 0;
  private readonly minIntervalMs = 1_100; // be a good citizen

  async lookup(query: string): Promise<{ lat: number; lng: number } | null> {
    const key = query.trim().toLowerCase();
    if (!key) return null;

    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < 1000 * 60 * 60 * 24 * 30) {
      // 30-day TTL
      return { lat: cached.lat, lng: cached.lng };
    }

    // Throttle.
    const wait = this.minIntervalMs - (Date.now() - this.lastCallAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.lastCallAt = Date.now();

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      const res = await fetch(url.toString(), {
        headers: {
          // Nominatim requires a UA. Identify the app and a contact, ideally.
          'User-Agent': 'SkillVerify/0.1 (https://github.com/DuvvuruDeepakReddy18/SU)',
        },
      });
      if (!res.ok) {
        this.log.warn(`Geocode failed ${res.status} for "${query}"`);
        return null;
      }
      const arr = (await res.json()) as { lat: string; lon: string }[];
      if (arr.length === 0) return null;
      const lat = parseFloat(arr[0].lat);
      const lng = parseFloat(arr[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      this.cache.set(key, { lat, lng, at: Date.now() });
      return { lat, lng };
    } catch (e) {
      this.log.error(`Geocode threw for "${query}": ${(e as Error).message}`);
      return null;
    }
  }
}
