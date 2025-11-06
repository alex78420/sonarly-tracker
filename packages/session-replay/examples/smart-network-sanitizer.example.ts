/**
 * Example: Using Smart Network Sanitizer with Sonarly Tracker
 * 
 * This demonstrates how to configure intelligent network request filtering
 * to reduce data footprint while maintaining full debugging capabilities.
 */

import Tracker, {
  createSmartSanitizer,
  createCustomSanitizer,
  SmartSanitizerPresets,
} from '@sonarly/session-replay'

// ============================================================
// Example 1: Balanced Configuration (Recommended for Production)
// ============================================================

const trackerBalanced = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  
  network: {
    // Smart sanitizer with balanced preset (~60% data reduction)
    sanitizer: SmartSanitizerPresets.balanced(),
    
    // Capture request/response bodies for debugging
    capturePayload: true,
    
    // Capture headers (excluding sensitive ones)
    ignoreHeaders: ['cookie', 'set-cookie', 'authorization'],
  },
})

trackerBalanced.start({ userID: 'user@example.com' })

// ============================================================
// Example 2: Custom Configuration for E-commerce
// ============================================================

const trackerEcommerce = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  
  network: {
    sanitizer: createSmartSanitizer({
      // Capture requests slower than 3 seconds (slow checkout = bad UX)
      slowRequestThreshold: 3000,
      
      // Always capture errors (4xx, 5xx)
      errorStatusThreshold: 400,
      
      // Your API endpoints
      apiPatterns: [
        '/api/',
        '/graphql',
        '/checkout/',
        '/payment/',
      ],
      
      // Your backend domains
      ownDomains: [
        'api.myshop.com',
        'checkout.myshop.com',
        'payments.myshop.com',
      ],
      
      // Ignore third-party services (unless they fail)
      ignoredDomains: [
        'google-analytics.com',
        'facebook.com',
        'klaviyo.com',          // Email marketing
        'cdn.shopify.com',       // CDN
        'apps.shopify.com',      // Shopify apps
      ],
      
      // Custom filter: Don't capture internal monitoring
      customFilter: (data) => {
        // Ignore health checks
        if (data.url.includes('/health')) return false
        if (data.url.includes('/ping')) return false
        
        // Always capture checkout/payment (critical!)
        if (data.url.includes('/checkout') || data.url.includes('/payment')) {
          return true
        }
        
        return true // Default: use other rules
      },
    }),
    
    capturePayload: true,
  },
})

// ============================================================
// Example 3: SaaS Dashboard (Capture Only Your Backend)
// ============================================================

const trackerSaaS = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  
  network: {
    sanitizer: createCustomSanitizer({
      // Only capture these domains
      captureOnly: {
        domains: ['api.mysaas.com', 'realtime.mysaas.com'],
        patterns: ['/api/v2/', '/graphql', '/ws/'],
      },
      
      // Ignore these patterns (even from own domain)
      ignore: {
        patterns: ['/metrics', '/health', '/debug'],
      },
    }),
    
    capturePayload: true,
  },
})

// ============================================================
// Example 4: Strict Mode (Errors Only - Minimal Data)
// ============================================================

const trackerStrict = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  
  network: {
    // Only capture failures and very slow requests
    sanitizer: SmartSanitizerPresets.strict(),
    
    // Don't capture payloads to save even more data
    capturePayload: false,
  },
})

// OR use built-in failuresOnly option:
const trackerFailuresOnly = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  
  network: {
    failuresOnly: true, // Simple: only status >= 400
    capturePayload: true,
  },
})

// ============================================================
// Example 5: Development Mode (Capture Everything)
// ============================================================

const trackerDev = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  
  network: {
    sanitizer: process.env.NODE_ENV === 'production'
      ? SmartSanitizerPresets.balanced()  // Filtered in production
      : SmartSanitizerPresets.debug(),     // Everything in dev
    
    capturePayload: true,
  },
})

// ============================================================
// Example 6: Manual Sanitization (Full Control)
// ============================================================

const trackerManual = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  
  network: {
    sanitizer: (data) => {
      // 1. Always capture failures
      if (data.status >= 400) {
        return data
      }
      
      // 2. Ignore static resources
      if (/\.(js|css|png|jpg|gif|svg|woff2?)$/i.test(data.url)) {
        return null
      }
      
      // 3. Ignore third-party
      if (data.url.includes('google-analytics.com')) {
        return null
      }
      
      // 4. Remove sensitive data
      if (data.request?.body) {
        try {
          const body = JSON.parse(data.request.body)
          delete body.password
          delete body.creditCard
          delete body.ssn
          data.request.body = JSON.stringify(body)
        } catch {
          // Not JSON, ignore
        }
      }
      
      // 5. Capture API calls
      if (data.url.includes('/api/')) {
        return data
      }
      
      // 6. Default: ignore
      return null
    },
    
    capturePayload: true,
  },
})

// ============================================================
// Example 7: React App with Environment-based Config
// ============================================================

import { useEffect } from 'react'

function App() {
  useEffect(() => {
    const tracker = new Tracker({
      projectKey: import.meta.env.VITE_SONARLY_PROJECT_KEY,
      
      network: {
        sanitizer: createSmartSanitizer({
          // Your API configuration
          apiPatterns: ['/api/', '/graphql'],
          ownDomains: [
            import.meta.env.VITE_API_DOMAIN || 'api.myapp.com',
          ],
          
          // Development: lower threshold, production: higher
          slowRequestThreshold: import.meta.env.DEV ? 1000 : 3000,
        }),
        
        capturePayload: import.meta.env.DEV, // Only in development
      },
      
      // Capture console only in production (debug in dev console)
      consoleMethods: import.meta.env.PROD ? ['error', 'warn'] : [],
    })
    
    tracker.start()
    
    return () => tracker.stop()
  }, [])
  
  return <div>Your App</div>
}

// ============================================================
// Testing Your Configuration
// ============================================================

// In browser console:
/*
// 1. Start tracker
const tracker = new Tracker({
  projectKey: 'test',
  network: {
    sanitizer: createSmartSanitizer({
      apiPatterns: ['/api/'],
    }),
  },
})
tracker.start()

// 2. Make some test requests
fetch('https://jsonplaceholder.typicode.com/posts')       // Should be captured (if ownDomain matches)
fetch('/api/users')                                        // ✅ Captured (matches /api/)
fetch('https://cdn.example.com/app.js')                   // ❌ Ignored (static resource)
fetch('https://www.google-analytics.com/collect')         // ❌ Ignored (third-party)
fetch('/api/orders', { method: 'POST' })                  // ✅ Captured (mutation)
fetch('/api/users?id=999999')                             // If 404 → ✅ Captured (failure)

// 3. Check what was captured in your Sonarly dashboard
*/

// ============================================================
// Performance Monitoring
// ============================================================

// Check data footprint in browser console
const monitorTracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  network: {
    sanitizer: createSmartSanitizer({
      customFilter: (data) => {
        // Log what's being captured
        console.log('[Sonarly] Capturing:', {
          url: data.url,
          method: data.method,
          status: data.status,
          reason: data.status >= 400 ? 'failure' : 
                  data.method !== 'GET' ? 'mutation' : 'API pattern',
        })
        return true
      },
    }),
  },
})

// ============================================================
// Export for use in your app
// ============================================================

export {
  trackerBalanced as defaultTracker,
  trackerEcommerce,
  trackerSaaS,
  trackerStrict,
  trackerDev,
}
