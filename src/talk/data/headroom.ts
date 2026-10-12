/**
 * Headroom v0.39.0 dashboard (Session tab + /stats), one proxy process, captured
 * 2026-10-12T13:45:53+00:00.
 */
export const HEADROOM = {
  capturedAt: "2026-10-12T13:45:53+00:00",
  source:
    "http://127.0.0.1:8787/dashboard (Session tab) + /stats API; headroom v0.39.0; scope = current proxy process",
  requestHealth: {
    completed: "1.8k",
    failed: 0,
    rateLimited: 17,
    cached: "1.6k",
    apiRequestsTotal: 1773,
    cachedExact: 1646,
  },
  tokensSaved: {
    display: "1.4M (0.9%)",
    exact: 1357987,
    ofNewInputPct: 12.18,
  },
  costSaved: {
    display: "$9.64 (8.0%)",
    spentUSD: 111.45,
    baselineUSD: 121.09,
    providerCacheDiscountUSD: 593.69,
  },
  outputTokensSaved: 0,
  overhead: {
    avgMs: 86,
    ttfbAvgS: 2.09,
  },
  tokenUsage: {
    beforeCompression: 155650598,
    proxyRemoved: 1357987,
    afterSent: 154292611,
    output: 539700,
  },
  whatRemoved: {
    json_bloat: 576605,
    html_noise: 82743,
    base64: 22031,
    whitespace: 5,
    dynamic_date: 0,
    repetition: 0,
    reread: 638,
    reread_compressed: 0,
  },
  prefixCache: {
    cacheWrites: "8.7M",
    writePremiumUSD: 26.46,
    hitRatePct: 95,
    hitRequests: "1636/1727",
    cacheBusts: 127,
    bustTokensRewritten: "6.8M",
    raw: {
      cache_read_tokens: 163197335,
      cache_write_tokens: 8731476,
      cache_write_5m_tokens: 2822932,
      cache_write_1h_tokens: 5908544,
      cache_write_5m_requests: 333,
      cache_write_1h_requests: 1359,
      uncached_input_tokens: 484049,
      requests: 1727,
      hit_requests: 1636,
      hit_rate: 94.7,
      request_hit_rate: 94.7,
      bust_count: 127,
      bust_write_tokens: 6848532,
      read_discount: "95%",
      write_premium: "76%",
      savings_usd: 620.1499,
      write_premium_usd: 26.4571,
      net_savings_usd: 593.6928,
      cache_pricing_source: "catalog",
      label: "Explicit breakpoints, 5-min TTL",
      observed_ttl_buckets: {
        "5m": {
          tokens: 2822932,
          requests: 333,
        },
        "1h": {
          tokens: 5908544,
          requests: 1359,
        },
      },
      observed_ttl_mix: {
        "5m_pct": 32.3,
        "1h_pct": 67.7,
        active_buckets: ["5m", "1h"],
      },
    },
  },
  cacheEfficiency:
    "95% of input served from cache (reads 163.2M discounted; writes 8.7M; uncached 0.48M)",
  ttlBuckets: {
    "1hWriteTokens": 5908544,
    "5mWriteTokens": 2822932,
    "1hPct": 67.7,
    "5mPct": 32.3,
    "1hRequests": 1359,
    "5mRequests": 333,
    label: "1H LEANING",
  },
  compressionVsCache: {
    savedByCompression: "1.4M",
    lostToCacheBusts: "1.1M (31 busts)",
    net: "+247.3k",
    prefixFreezeNet: 0,
    label: "NET POSITIVE",
  },
  cacheMissAttribution: {
    ttlExpiry: 0,
    prefixChange: 11,
    unknown: 0,
    totalMisses: 11,
    label: "MOSTLY PREFIX CHANGE",
  },
  modelsByRequests: {
    "claude-opus-5": 90,
    "claude-opus-5-5": 763,
    "claude-sonnet-5": 749,
    "claude-opus-4-7": 154,
    "passthrough:count_tokens": 4,
    "claude-haiku-4-5-20251001": 4,
    "claude-sonnet-5-5": 9,
  },
} as const;

export const HEADROOM_LABELS = {
  hitRate: "95% hit rate",
  cacheRead: "163.2M tokens read from cache",
  compressionVsCache: "Compression saved 1.4M · cache busts cost 1.1M · net +247.3k",
} as const;
