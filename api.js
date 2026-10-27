/*
 * Provider-independent API layer.
 * Configure a same-origin backend endpoint, e.g. /api/matches.
 * Keep third-party API keys on that backend, never in this browser file.
 */
window.MatchMindAPI = (() => {
  const DEFAULT_ENDPOINT = ""; // Example: "/api/matches"
  const CACHE_KEY = "matchmind-fixtures-cache-v1";
  const CACHE_TTL_MS = 5 * 60 * 1000;

  async function fetchFixtures(options = {}) {
    const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    if (!endpoint) {
      // Local demo mode is intentionally offline and clearly labelled.
      return window.MatchMindData.fixtures;
    }
    const cacheAllowed = options.cache !== false;
    if (cacheAllowed) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
        if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS && cached.endpoint === endpoint) {
          return cached.data.map(window.MatchMindData.normalizeFixture);
        }
      } catch (_) { /* Invalid cache: continue to network. */ }
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: controller.signal
      });
      if (response.status === 429) throw new Error("The data provider rate limit was reached. Try again shortly.");
      if (!response.ok) throw new Error(`Match API request failed (${response.status}).`);
      const payload = await response.json();
      const rawFixtures = Array.isArray(payload) ? payload : payload.matches;
      if (!Array.isArray(rawFixtures)) throw new Error("The API response did not contain a matches array.");
      const normalized = rawFixtures.map(window.MatchMindData.normalizeFixture);
      if (cacheAllowed) {
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({savedAt:Date.now(), endpoint, data:normalized})); }
        catch (_) { /* Cache is optional. */ }
      }
      return normalized;
    } catch (error) {
      if (error.name === "AbortError") throw new Error("The match data request timed out.");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {fetchFixtures};
})();