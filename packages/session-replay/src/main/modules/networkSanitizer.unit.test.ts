import { describe, expect, test } from '@jest/globals'
import {
  createSmartSanitizer,
  createCustomSanitizer,
  SmartSanitizerPresets,
  type SmartSanitizerOptions,
} from './networkSanitizer.js'
import type { RequestResponseData } from './network.js'

// Mock window.location
const mockLocation = {
  hostname: 'app.example.com',
}

// Helper to create mock request data
function createMockRequest(overrides: Partial<RequestResponseData>): RequestResponseData {
  return {
    status: 200,
    method: 'GET',
    url: 'https://api.example.com/test',
    request: {
      headers: {},
      body: null,
    },
    response: {
      headers: {},
      body: null,
    },
    ...overrides,
  }
}

describe('createSmartSanitizer', () => {
  describe('Rule 1: ALWAYS capture failures (4xx, 5xx)', () => {
    test('captures 404 errors', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://cdn.example.com/image.png',
        status: 404,
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('captures 500 errors', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://api.example.com/endpoint',
        status: 500,
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('captures 401 unauthorized', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://api.example.com/secure',
        status: 401,
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('captures 502 bad gateway', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://api.example.com/data',
        status: 502,
      })
      expect(sanitizer(request)).toBe(request)
    })
  })

  describe('Rule 2: ALWAYS capture slow requests', () => {
    test('captures requests with x-response-time header above threshold', () => {
      const sanitizer = createSmartSanitizer({ slowRequestThreshold: 2000 })
      const request = createMockRequest({
        url: 'https://api.example.com/slow',
        status: 200,
        response: {
          headers: { 'x-response-time': '3000' },
          body: null,
        },
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('ignores fast requests below threshold', () => {
      const sanitizer = createSmartSanitizer({ slowRequestThreshold: 2000 })
      const request = createMockRequest({
        url: 'https://cdn.example.com/image.png',
        status: 200,
        response: {
          headers: { 'x-response-time': '100' },
          body: null,
        },
      })
      expect(sanitizer(request)).toBeNull()
    })
  })

  describe('Rule 3: IGNORE static resources', () => {
    test('ignores .js files', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://cdn.example.com/bundle.js',
      })
      expect(sanitizer(request)).toBeNull()
    })

    test('ignores .css files', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://cdn.example.com/styles.css',
      })
      expect(sanitizer(request)).toBeNull()
    })

    test('ignores image files', () => {
      const sanitizer = createSmartSanitizer()
      const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']
      
      extensions.forEach(ext => {
        const request = createMockRequest({
          url: `https://cdn.example.com/image${ext}`,
        })
        expect(sanitizer(request)).toBeNull()
      })
    })

    test('ignores font files', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://cdn.example.com/font.woff2',
      })
      expect(sanitizer(request)).toBeNull()
    })

    test('captures static resources if they fail', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://cdn.example.com/missing.js',
        status: 404,
      })
      expect(sanitizer(request)).toBe(request)
    })
  })

  describe('Rule 4: IGNORE third-party tracking/analytics', () => {
    test('ignores Google Analytics', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://www.google-analytics.com/collect',
      })
      expect(sanitizer(request)).toBeNull()
    })

    test('ignores Google Tag Manager', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://www.googletagmanager.com/gtm.js',
      })
      expect(sanitizer(request)).toBeNull()
    })

    test('ignores Facebook pixel', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://www.facebook.com/tr',
      })
      expect(sanitizer(request)).toBeNull()
    })

    test('ignores Hotjar', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://static.hotjar.com/c/hotjar-123.js',
      })
      expect(sanitizer(request)).toBeNull()
    })

    test('captures third-party if they fail', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://www.google-analytics.com/collect',
        status: 500,
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('allows custom ignored domains', () => {
      const sanitizer = createSmartSanitizer({
        ignoredDomains: ['custom-tracker.com'],
      })
      const request = createMockRequest({
        url: 'https://custom-tracker.com/track',
      })
      expect(sanitizer(request)).toBeNull()
    })
  })

  describe('Rule 5: CAPTURE if it matches API patterns', () => {
    test('captures /api/ endpoints', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://example.com/api/users',
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('captures /graphql endpoints', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://example.com/graphql',
        method: 'POST',
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('captures /v1/, /v2/, /v3/ endpoints', () => {
      const sanitizer = createSmartSanitizer()
      const versions = ['/v1/', '/v2/', '/v3/']
      
      versions.forEach(version => {
        const request = createMockRequest({
          url: `https://api.example.com${version}users`,
        })
        expect(sanitizer(request)).toBe(request)
      })
    })

    test('supports custom API patterns', () => {
      const sanitizer = createSmartSanitizer({
        apiPatterns: ['/backend/', '/rest/'],
      })
      const request = createMockRequest({
        url: 'https://example.com/backend/data',
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('supports regex API patterns', () => {
      const sanitizer = createSmartSanitizer({
        apiPatterns: [/\/api\/v\d+\//],
      })
      const request = createMockRequest({
        url: 'https://example.com/api/v42/users',
      })
      expect(sanitizer(request)).toBe(request)
    })
  })

  describe('Rule 6: CAPTURE all POST/PUT/DELETE/PATCH (mutations)', () => {
    test('captures POST requests', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://example.com/submit',
        method: 'POST',
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('captures PUT requests', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://example.com/update',
        method: 'PUT',
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('captures DELETE requests', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://example.com/delete',
        method: 'DELETE',
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('captures PATCH requests', () => {
      const sanitizer = createSmartSanitizer()
      const request = createMockRequest({
        url: 'https://example.com/patch',
        method: 'PATCH',
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('ignores GET requests without API pattern', () => {
      const sanitizer = createSmartSanitizer({ apiPatterns: [] })
      const request = createMockRequest({
        url: 'https://external.com/data',
        method: 'GET',
      })
      expect(sanitizer(request)).toBeNull()
    })
  })

  describe('Rule 7: CAPTURE requests to own domains', () => {
    test('captures requests to own domain', () => {
      const sanitizer = createSmartSanitizer({
        ownDomains: ['app.example.com'],
      })
      const request = createMockRequest({
        url: 'https://app.example.com/data',
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('captures requests to subdomain of own domain', () => {
      const sanitizer = createSmartSanitizer({
        ownDomains: ['example.com'],
      })
      const request = createMockRequest({
        url: 'https://api.example.com/users',
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('ignores requests to external domains', () => {
      const sanitizer = createSmartSanitizer({
        ownDomains: ['app.example.com'],
        apiPatterns: [], // Disable API pattern matching
      })
      const request = createMockRequest({
        url: 'https://external.com/data',
      })
      expect(sanitizer(request)).toBeNull()
    })
  })

  describe('Rule 8: Custom filter', () => {
    test('applies custom filter logic', () => {
      const sanitizer = createSmartSanitizer({
        customFilter: (data) => data.url.includes('important'),
      })
      const request = createMockRequest({
        url: 'https://example.com/important-data',
      })
      expect(sanitizer(request)).toBe(request)
    })

    test('custom filter can reject requests', () => {
      const sanitizer = createSmartSanitizer({
        customFilter: (data) => !data.url.includes('ignore'),
      })
      const request = createMockRequest({
        url: 'https://example.com/ignore-this',
      })
      // Custom filter returns false, but other rules might still capture
      // For this test, we need to ensure no other rules match
      const sanitizer2 = createSmartSanitizer({
        apiPatterns: [],
        ownDomains: [],
        customFilter: (data) => data.url.includes('capture'),
      })
      const request2 = createMockRequest({
        url: 'https://example.com/data',
      })
      expect(sanitizer2(request2)).toBeNull()
    })
  })
})

describe('SmartSanitizerPresets', () => {
  test('strict preset only captures critical issues', () => {
    const sanitizer = SmartSanitizerPresets.strict()
    
    // Should capture errors
    expect(sanitizer(createMockRequest({ status: 500 }))).not.toBeNull()
    
    // Should ignore successful requests
    expect(sanitizer(createMockRequest({ 
      url: 'https://api.example.com/data',
      status: 200 
    }))).toBeNull()
  })

  test('balanced preset captures API calls and errors', () => {
    const sanitizer = SmartSanitizerPresets.balanced()
    
    // Should capture errors
    expect(sanitizer(createMockRequest({ status: 500 }))).not.toBeNull()
    
    // Should capture API calls
    expect(sanitizer(createMockRequest({ 
      url: 'https://example.com/api/users',
      status: 200 
    }))).not.toBeNull()
    
    // Should ignore static resources
    expect(sanitizer(createMockRequest({ 
      url: 'https://cdn.example.com/app.js',
      status: 200 
    }))).toBeNull()
  })

  test('verbose preset captures more requests', () => {
    const sanitizer = SmartSanitizerPresets.verbose()
    
    // Should capture errors
    expect(sanitizer(createMockRequest({ status: 500 }))).not.toBeNull()
    
    // Should capture API calls
    expect(sanitizer(createMockRequest({ 
      url: 'https://example.com/api/users',
      status: 200 
    }))).not.toBeNull()
  })

  test('debug preset captures everything', () => {
    const sanitizer = SmartSanitizerPresets.debug()
    
    // Should capture everything
    expect(sanitizer(createMockRequest({ url: 'https://cdn.example.com/app.js' }))).not.toBeNull()
    expect(sanitizer(createMockRequest({ url: 'https://api.example.com/data' }))).not.toBeNull()
    expect(sanitizer(createMockRequest({ status: 500 }))).not.toBeNull()
  })
})

describe('createCustomSanitizer', () => {
  test('captures only specified domains', () => {
    const sanitizer = createCustomSanitizer({
      captureOnly: {
        domains: ['api.myapp.com', 'backend.myapp.com'],
      },
    })

    expect(sanitizer(createMockRequest({ 
      url: 'https://api.myapp.com/users' 
    }))).not.toBeNull()

    expect(sanitizer(createMockRequest({ 
      url: 'https://backend.myapp.com/data' 
    }))).not.toBeNull()

    expect(sanitizer(createMockRequest({ 
      url: 'https://external.com/data',
      status: 200 // Not a failure
    }))).toBeNull()
  })

  test('ignores specified domains', () => {
    const sanitizer = createCustomSanitizer({
      ignore: {
        domains: ['cdn.myapp.com', 'static.myapp.com'],
      },
    })

    expect(sanitizer(createMockRequest({ 
      url: 'https://cdn.myapp.com/app.js',
      status: 200 
    }))).toBeNull()

    expect(sanitizer(createMockRequest({ 
      url: 'https://static.myapp.com/image.png',
      status: 200 
    }))).toBeNull()
  })

  test('ignores specified patterns', () => {
    const sanitizer = createCustomSanitizer({
      ignore: {
        patterns: ['/internal/', '/debug/'],
      },
    })

    expect(sanitizer(createMockRequest({ 
      url: 'https://api.myapp.com/internal/metrics',
      status: 200 
    }))).toBeNull()

    expect(sanitizer(createMockRequest({ 
      url: 'https://api.myapp.com/debug/stats',
      status: 200 
    }))).toBeNull()
  })
})

describe('Edge cases and integration', () => {
  test('handles URLs without protocol', () => {
    const sanitizer = createSmartSanitizer()
    const request = createMockRequest({
      url: '/api/users', // Relative URL
    })
    expect(sanitizer(request)).toBe(request)
  })

  test('case-insensitive matching', () => {
    const sanitizer = createSmartSanitizer()
    const request = createMockRequest({
      url: 'https://example.com/API/USERS',
    })
    expect(sanitizer(request)).toBe(request)
  })

  test('handles malformed URLs gracefully', () => {
    const sanitizer = createSmartSanitizer()
    const request = createMockRequest({
      url: 'not-a-valid-url',
    })
    // Should not throw, should use fallback logic
    expect(() => sanitizer(request)).not.toThrow()
  })

  test('prioritizes failure capture over ignore rules', () => {
    const sanitizer = createSmartSanitizer({
      ignoredDomains: ['google-analytics.com'],
    })
    const request = createMockRequest({
      url: 'https://www.google-analytics.com/collect',
      status: 500, // Failure
    })
    // Even though GA is ignored, failures are always captured
    expect(sanitizer(request)).toBe(request)
  })

  test('works with empty configuration', () => {
    const sanitizer = createSmartSanitizer({})
    expect(() => sanitizer(createMockRequest({}))).not.toThrow()
  })
})
