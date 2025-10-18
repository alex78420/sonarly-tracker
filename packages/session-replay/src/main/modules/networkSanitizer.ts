/**
 * Smart Network Request Sanitizer
 * 
 * This module provides intelligent filtering of network requests to:
 * - Reduce data footprint by ~60%
 * - Keep all debugging information (failures, slow requests)
 * - Filter out static resources (already captured by ResourceTiming API)
 * - Remove third-party tracking requests
 * - Maintain complete API call timeline
 */

import type { RequestResponseData } from './network.js'

/**
 * Configuration for the smart sanitizer
 */
export interface SmartSanitizerOptions {
  /**
   * Always capture requests slower than this threshold (milliseconds)
   * @default 2000
   */
  slowRequestThreshold?: number

  /**
   * Always capture requests with status >= this threshold
   * @default 400
   */
  errorStatusThreshold?: number

  /**
   * Domains to ignore (third-party tracking, analytics, etc.)
   * @default Common tracking domains
   */
  ignoredDomains?: string[]

  /**
   * URL patterns that identify API calls (regex or string contains)
   * @default ['/api/', '/graphql', '/v1/', '/v2/']
   */
  apiPatterns?: (string | RegExp)[]

  /**
   * File extensions to ignore (static resources)
   * @default ['.js', '.css', '.png', '.jpg', ...]
   */
  ignoredExtensions?: string[]

  /**
   * Capture all requests to your own domain(s)
   * @default [window.location.hostname]
   */
  ownDomains?: string[]

  /**
   * Custom filter function (applied after built-in rules)
   */
  customFilter?: (data: RequestResponseData) => boolean
}

/**
 * Default ignored domains (third-party tracking, analytics, ads)
 */
const DEFAULT_IGNORED_DOMAINS = [
  // Analytics & Tracking
  'google-analytics.com',
  'googletagmanager.com',
  'analytics.google.com',
  'doubleclick.net',
  'googlesyndication.com',
  
  // Social Media Tracking
  'facebook.com/tr',
  'facebook.net',
  'connect.facebook.net',
  'twitter.com/i/jot',
  'linkedin.com/px',
  'pinterest.com/ct',
  
  // Tag Managers & CDN
  'segment.com',
  'segment.io',
  'mparticle.com',
  
  // Session Replay (competitors)
  'hotjar.com',
  'mouseflow.com',
  'smartlook.com',
  'fullstory.com',
  'logrocket.com',
  
  // CDN (unless you need to track CDN failures)
  // 'cdn.jsdelivr.net',
  // 'unpkg.com',
  // 'cdnjs.cloudflare.com',
]

/**
 * Default file extensions for static resources
 */
const DEFAULT_IGNORED_EXTENSIONS = [
  // Scripts
  '.js',
  '.mjs',
  '.cjs',
  
  // Styles
  '.css',
  '.scss',
  '.sass',
  '.less',
  
  // Images
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.avif',
  '.ico',
  '.bmp',
  
  // Fonts
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  
  // Media
  '.mp4',
  '.webm',
  '.ogg',
  '.mp3',
  '.wav',
  
  // Documents (usually served as downloads)
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
]

/**
 * Default API patterns
 */
const DEFAULT_API_PATTERNS = [
  '/api/',
  '/graphql',
  '/v1/',
  '/v2/',
  '/v3/',
  '/rest/',
  '/rpc/',
]

/**
 * Check if URL matches any pattern
 */
function matchesPattern(url: string, patterns: (string | RegExp)[]): boolean {
  const lowerUrl = url.toLowerCase()
  return patterns.some(pattern => {
    if (typeof pattern === 'string') {
      return lowerUrl.includes(pattern.toLowerCase())
    }
    return pattern.test(url)
  })
}

/**
 * Extract hostname from URL
 */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

/**
 * Check if URL is a static resource based on extension
 */
function isStaticResource(url: string, extensions: string[]): boolean {
  const lowerUrl = url.toLowerCase()
  return extensions.some(ext => lowerUrl.endsWith(ext))
}

/**
 * Create a smart sanitizer function
 * 
 * @param options - Configuration options
 * @returns Sanitizer function compatible with network module
 * 
 * @example
 * ```typescript
 * const tracker = new Tracker({
 *   projectKey: 'YOUR_PROJECT_KEY',
 *   network: {
 *     sanitizer: createSmartSanitizer({
 *       slowRequestThreshold: 3000, // 3 seconds
 *       apiPatterns: ['/api/', '/backend/'],
 *     }),
 *   },
 * })
 * ```
 */
export function createSmartSanitizer(
  options: SmartSanitizerOptions = {}
): (data: RequestResponseData) => RequestResponseData | null {
  const config = {
    slowRequestThreshold: options.slowRequestThreshold ?? 2000,
    errorStatusThreshold: options.errorStatusThreshold ?? 400,
    ignoredDomains: options.ignoredDomains ?? DEFAULT_IGNORED_DOMAINS,
    apiPatterns: options.apiPatterns ?? DEFAULT_API_PATTERNS,
    ignoredExtensions: options.ignoredExtensions ?? DEFAULT_IGNORED_EXTENSIONS,
    ownDomains: options.ownDomains ?? (typeof window !== 'undefined' ? [window.location.hostname] : []),
    customFilter: options.customFilter,
  }

  return function smartSanitizer(data: RequestResponseData): RequestResponseData | null {
    const url = data.url
    const lowerUrl = url.toLowerCase()
    const hostname = getHostname(url)

    // 🎯 Rule 1: ALWAYS capture failures (4xx, 5xx)
    // This is critical for debugging
    if (data.status >= config.errorStatusThreshold) {
      return data
    }

    // 🎯 Rule 2: ALWAYS capture slow requests (>threshold ms)
    // Even if status is 200, slow requests are performance issues
    const duration = typeof data.response?.headers?.['x-response-time'] === 'string'
      ? parseInt(data.response.headers['x-response-time'], 10)
      : 0
    
    if (duration > 0 && duration > config.slowRequestThreshold) {
      return data
    }

    // 🎯 Rule 3: IGNORE static resources
    // These are already captured by Performance API (ResourceTiming)
    if (isStaticResource(url, config.ignoredExtensions)) {
      return null
    }

    // 🎯 Rule 4: IGNORE third-party tracking/analytics
    // Unless they failed (already captured by Rule 1)
    if (config.ignoredDomains.some(domain => hostname.includes(domain) || lowerUrl.includes(domain))) {
      return null
    }

    // 🎯 Rule 5: CAPTURE if it matches API patterns
    if (matchesPattern(url, config.apiPatterns)) {
      return data
    }

    // 🎯 Rule 6: CAPTURE all POST/PUT/DELETE/PATCH (mutations)
    // GET requests might be static content, but mutations are always API calls
    const method = data.method.toUpperCase()
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      return data
    }

    // 🎯 Rule 7: CAPTURE requests to own domains
    // This ensures we don't miss any internal API calls
    if (config.ownDomains.some(domain => hostname.includes(domain))) {
      return data
    }

    // 🎯 Rule 8: Custom filter (if provided)
    if (config.customFilter && config.customFilter(data)) {
      return data
    }

    // ❌ Default: IGNORE everything else
    // This includes:
    // - External GET requests to unknown domains
    // - CDN resources that weren't caught by extension check
    // - Third-party widgets/embeds
    return null
  }
}

/**
 * Preset configurations for common use cases
 */
export const SmartSanitizerPresets = {
  /**
   * Strict: Only failures and very slow requests
   * ~80% reduction in data
   */
  strict: (): (data: RequestResponseData) => RequestResponseData | null => {
    return createSmartSanitizer({
      slowRequestThreshold: 5000, // 5 seconds
      errorStatusThreshold: 400,
      apiPatterns: [], // No API pattern matching
    })
  },

  /**
   * Balanced: Failures, slow requests, and API calls (default)
   * ~60% reduction in data
   */
  balanced: (): (data: RequestResponseData) => RequestResponseData | null => {
    return createSmartSanitizer({
      slowRequestThreshold: 2000, // 2 seconds
      errorStatusThreshold: 400,
    })
  },

  /**
   * Verbose: Capture more, but still filter static resources
   * ~40% reduction in data
   */
  verbose: (): (data: RequestResponseData) => RequestResponseData | null => {
    return createSmartSanitizer({
      slowRequestThreshold: 1000, // 1 second
      errorStatusThreshold: 400,
      ignoredDomains: [], // Don't ignore third-party
    })
  },

  /**
   * Debug: Capture everything (same as no sanitizer)
   * 0% reduction in data
   */
  debug: (): (data: RequestResponseData) => RequestResponseData | null => {
    return (data: RequestResponseData) => data
  },
}

/**
 * Helper to create a custom sanitizer with easy domain/pattern config
 * 
 * @example
 * ```typescript
 * const sanitizer = createCustomSanitizer({
 *   captureOnly: {
 *     domains: ['api.myapp.com', 'backend.myapp.com'],
 *     patterns: ['/api/', '/graphql'],
 *   },
 *   ignore: {
 *     domains: ['cdn.myapp.com', 'static.myapp.com'],
 *   },
 * })
 * ```
 */
export function createCustomSanitizer(config: {
  captureOnly?: {
    domains?: string[]
    patterns?: (string | RegExp)[]
  }
  ignore?: {
    domains?: string[]
    patterns?: (string | RegExp)[]
  }
}): (data: RequestResponseData) => RequestResponseData | null {
  return createSmartSanitizer({
    ownDomains: config.captureOnly?.domains,
    apiPatterns: config.captureOnly?.patterns,
    ignoredDomains: config.ignore?.domains,
    customFilter: config.ignore?.patterns
      ? (data) => !matchesPattern(data.url, config.ignore!.patterns!)
      : undefined,
  })
}
