# @sonarly/session-replay

> **Session replay and user monitoring SDK** - Record, replay and analyze user sessions with automatic error detection, performance monitoring, and behavioral analytics.

[![npm version](https://badge.fury.io/js/@sonarly%2Fsession-replay.svg)](https://www.npmjs.com/package/@sonarly/session-replay)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 Features

- 📹 **Session Replay** - Record and replay user sessions with DOM reconstruction
- 🐛 **Error Tracking** - Automatic JavaScript exception detection and stack traces
- 📊 **Performance Monitoring** - Track Web Vitals (LCP, FID, CLS, FCP, TTFB)
- 🔥 **Rage Clicks Detection** - Identify user frustration patterns
- 💀 **Dead Clicks Detection** - Find clicks that lead nowhere
- 🖱️ **User Behavior Analytics** - Mouse movements, clicks, scrolls
- 📱 **Mobile-Friendly** - Works on all devices and screen sizes
- 🚀 **Lightweight** - < 50KB gzipped, minimal performance impact
- 🔒 **Privacy-First** - Built-in data sanitization and PII protection

---

## 📦 Installation

```bash
npm install @sonarly/session-replay

# Or with yarn
yarn add @sonarly/session-replay

# Or with pnpm
pnpm add @sonarly/session-replay
```

---

## 🚀 Quick Start

### 1. Initialize the Tracker

```javascript
import Tracker from '@sonarly/session-replay'

const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY', // Get from Sonarly dashboard
  ingestPoint: 'https://api.sonarly.dev/ingest', // Your Sonarly instance URL
})

// Start recording
tracker.start({
  userID: 'user@example.com',
  metadata: {
    plan: 'premium',
    version: '2.1.0',
  },
})
```

### 2. Track User Information

```javascript
// Set user ID
tracker.setUserID('john.doe@company.com')

// Add custom metadata
tracker.setMetadata('subscription', 'enterprise')
tracker.setMetadata('feature_flags', { darkMode: true, betaAccess: true })
```

### 3. Track Custom Events

```javascript
// Track custom events
tracker.event('purchase_completed', {
  amount: 99.99,
  currency: 'USD',
  product: 'Premium Plan',
})

// Track issues manually
tracker.issue('Payment Gateway Timeout', {
  gateway: 'stripe',
  attemptNumber: 3,
})
```

---

## 🔧 Configuration Options

```javascript
const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  
  // Session Configuration
  sessionToken: undefined, // Resume existing session (optional)
  respectDoNotTrack: false, // Respect browser's Do Not Track setting
  
  // Data Capture
  consoleMethods: ['log', 'warn', 'error'], // Console methods to capture
  capturePerformance: true, // Capture Web Vitals
  captureIFrameWindows: true, // Capture iframe content
  
  // Network Monitoring
  network: {
    capturePayload: true, // Capture request/response payloads
    captureHeaders: false, // Capture HTTP headers
    failuresOnly: false, // Capture all requests (false) or only failures (true)
    sanitizer: (data) => data, // Custom sanitization function
  },
  
  // Privacy & Security
  obscureTextEmails: true, // Mask email addresses
  obscureTextNumbers: false, // Mask numbers
  obscureInputEmails: true, // Mask email inputs
  defaultInputMode: 0, // 0=record all, 1=obscure, 2=ignore
  
  // Performance
  connAttemptCount: 10, // Connection retry attempts
  connAttemptGap: 8000, // Gap between retries (ms)
})
```

---

## 📚 API Methods

### Session Control

```javascript
// Start session
tracker.start(options?)

// Stop session
tracker.stop()

// Get current session info
const session = tracker.getSessionInfo()
// Returns: { sessionID, sessionToken, userID, metadata }
```

### User Identification

```javascript
// Set user ID
tracker.setUserID('user@example.com')

// Set user anonymous ID
tracker.setUserAnonymousID('anon-12345')
```

### Custom Data

```javascript
// Set metadata (string key-value)
tracker.setMetadata('key', 'value')

// Track custom event
tracker.event('event_name', { data: 'value' })

// Report issue
tracker.issue('Issue description', { context: 'data' })
```

### Performance Tracking

```javascript
// Web Vitals are automatically tracked
// Manual performance marks
performance.mark('custom-mark')
```

---

## 🛡️ Privacy & Data Sanitization

### HTML Attributes for Privacy

```html
<!-- Hide element completely -->
<div data-sonarly-hidden>Secret content</div>

<!-- Obscure text content -->
<span data-sonarly-obscured>Sensitive text</span>

<!-- Custom label (replaces actual text) -->
<input data-sonarly-label="Email Address" type="email" />

<!-- Ignore input value -->
<input data-sonarly-ignore />
```

### CSS Classes for Privacy

```html
<!-- Hide with CSS class -->
<div class="sonarly-hidden">Secret</div>

<!-- Obscure with CSS class -->
<span class="sonarly-obscured">Sensitive</span>
```

### Programmatic Sanitization

```javascript
import Tracker, { createSmartSanitizer } from '@sonarly/session-replay'

const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  
  // Smart network filtering (recommended - reduces data by ~60%)
  network: {
    sanitizer: createSmartSanitizer({
      // Capture requests slower than 2 seconds
      slowRequestThreshold: 2000,
      
      // Capture requests with status >= 400
      errorStatusThreshold: 400,
      
      // Your API endpoints patterns
      apiPatterns: ['/api/', '/graphql', '/v1/'],
      
      // Your domain(s)
      ownDomains: ['api.myapp.com', 'backend.myapp.com'],
      
      // Third-party to ignore (default includes GA, Facebook, etc.)
      // ignoredDomains: ['custom-analytics.com'],
    }),
    capturePayload: true, // Capture request/response bodies
  },
  
  // Obscure patterns
  obscureTextEmails: true, // Masks: user@example.com → u***@e***.com
  obscureTextNumbers: true, // Masks: 1234567890 → **********
})
```

#### Network Sanitizer Presets

```javascript
import Tracker, { SmartSanitizerPresets } from '@sonarly/session-replay'

const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  network: {
    // Option 1: Strict - Only failures and very slow requests (~80% reduction)
    sanitizer: SmartSanitizerPresets.strict(),
    
    // Option 2: Balanced - Failures, slow requests, and API calls (~60% reduction) [RECOMMENDED]
    // sanitizer: SmartSanitizerPresets.balanced(),
    
    // Option 3: Verbose - More data, filter static resources (~40% reduction)
    // sanitizer: SmartSanitizerPresets.verbose(),
    
    // Option 4: Debug - Capture everything (no reduction)
    // sanitizer: SmartSanitizerPresets.debug(),
  },
})
```

#### Custom Network Filtering

```javascript
import Tracker, { createCustomSanitizer } from '@sonarly/session-replay'

const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  network: {
    // Capture only specific domains/patterns
    sanitizer: createCustomSanitizer({
      captureOnly: {
        domains: ['api.myapp.com', 'backend.myapp.com'],
        patterns: ['/api/', '/graphql'],
      },
      ignore: {
        domains: ['cdn.myapp.com', 'static.myapp.com'],
        patterns: ['/internal/', '/debug/'],
      },
    }),
  },
})
```

#### Manual Network Sanitization

```javascript
const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  
  network: {
    sanitizer: (requestData) => {
      // Remove sensitive data from request/response
      if (requestData.request?.body) {
        const body = JSON.parse(requestData.request.body)
        delete body.password
        delete body.creditCard
        requestData.request.body = JSON.stringify(body)
      }
      
      // Ignore internal endpoints
      if (requestData.url.includes('/internal/')) {
        return null // Don't capture this request
      }
      
      return requestData
    },
    capturePayload: true,
  },
})
```

---

## 🎨 Framework Integrations

### React

```jsx
import { useEffect } from 'react'
import Tracker from '@sonarly/session-replay'

function App() {
  useEffect(() => {
    const tracker = new Tracker({
      projectKey: 'YOUR_PROJECT_KEY',
    })
    tracker.start()
    
    return () => tracker.stop()
  }, [])
  
  return <div>Your app</div>
}
```

### Vue 3

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue'
import Tracker from '@sonarly/session-replay'

let tracker

onMounted(() => {
  tracker = new Tracker({
    projectKey: 'YOUR_PROJECT_KEY',
  })
  tracker.start()
})

onUnmounted(() => {
  tracker?.stop()
})
</script>
```

### Angular

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core'
import Tracker from '@sonarly/session-replay'

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit, OnDestroy {
  private tracker: Tracker

  ngOnInit() {
    this.tracker = new Tracker({
      projectKey: 'YOUR_PROJECT_KEY',
    })
    this.tracker.start()
  }

  ngOnDestroy() {
    this.tracker.stop()
  }
}
```

### Next.js (App Router)

```typescript
// app/layout.tsx
'use client'

import { useEffect } from 'react'
import Tracker from '@sonarly/session-replay'

export default function RootLayout({ children }) {
  useEffect(() => {
    // Only run on client
    if (typeof window !== 'undefined') {
      const tracker = new Tracker({
        projectKey: 'YOUR_PROJECT_KEY',
      })
      tracker.start()
    }
  }, [])

  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

---

## � Network Monitoring Deep Dive

### Understanding Network vs Resource Tracking

Sonarly captures network activity using **two separate mechanisms**:

#### 1️⃣ **ResourceTiming API** (Static Resources)
Automatically captures static assets via browser's Performance API:
- 📄 JavaScript files (`.js`, `.mjs`)
- 🎨 Stylesheets (`.css`)
- 🖼️ Images (`.png`, `.jpg`, `.svg`, `.webp`)
- 🔤 Fonts (`.woff`, `.woff2`, `.ttf`)
- 🎥 Media files (`.mp4`, `.webm`)

**Captured data**: URL, duration, TTFB, size, cached status, initiator type

#### 2️⃣ **NetworkRequest Interceptor** (API Calls)
Intercepts XHR, Fetch, and Beacon API calls:
- 🔄 `fetch()` requests
- 📡 `XMLHttpRequest` (XHR)
- 📨 `navigator.sendBeacon()`
- 🔗 GraphQL queries

**Captured data**: URL, method, status, request/response headers & bodies, duration

### Why Smart Filtering Matters

**Without filtering** (default):
```javascript
// ❌ Captures EVERYTHING = 100% data footprint
Session #1: 247 network requests
- 180 static resources (JS, CSS, images) ← Already in ResourceTiming!
- 45 third-party tracking (GA, Facebook, ads)
- 22 API calls (your actual app logic)
Batch size: ~18 KB
```

**With smart filtering** (recommended):
```javascript
// ✅ Captures only what matters = 40% data footprint
Session #1: 25 network requests
- 0 static resources (filtered, already in ResourceTiming)
- 0 third-party tracking (filtered, not useful for debugging)
- 22 API calls (100% captured!)
- 3 failed requests (even if third-party)
Batch size: ~7 KB (-61% 🎉)
```

### Smart Filtering Rules (in order)

The `createSmartSanitizer()` applies these rules **in order**:

1. ✅ **ALWAYS capture failures** (status >= 400)
   - Even if it's a third-party domain
   - Even if it's a static resource
   - Critical for debugging

2. ✅ **ALWAYS capture slow requests** (>2s by default)
   - Performance issues are bugs too
   - Configurable threshold

3. ❌ **IGNORE static resources** (`.js`, `.css`, `.png`, etc.)
   - Already captured by ResourceTiming API
   - No need to duplicate

4. ❌ **IGNORE third-party tracking** (Google Analytics, Facebook, etc.)
   - Not useful for your app debugging
   - Reduces noise and data leakage

5. ✅ **CAPTURE API pattern matches** (`/api/`, `/graphql`, `/v1/`, etc.)
   - Your backend API calls
   - Configurable patterns

6. ✅ **CAPTURE mutations** (POST, PUT, DELETE, PATCH)
   - State-changing operations
   - Critical for understanding user actions

7. ✅ **CAPTURE own domains** (your backend servers)
   - All requests to your infrastructure
   - Configurable domain list

8. ✅ **CAPTURE custom filter matches**
   - Your own custom logic
   - Maximum flexibility

### Real-World Examples

#### Example 1: E-commerce App
```javascript
import Tracker, { createSmartSanitizer } from '@sonarly/session-replay'

const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  network: {
    sanitizer: createSmartSanitizer({
      // API calls
      apiPatterns: ['/api/', '/graphql'],
      
      // Your backends
      ownDomains: ['api.myshop.com', 'checkout.myshop.com'],
      
      // Ignore analytics (but keep failures)
      ignoredDomains: [
        'google-analytics.com',
        'facebook.com',
        'klaviyo.com', // Email marketing
        'cdn.shopify.com', // CDN
      ],
      
      // Capture slow checkout requests (>3s is too slow)
      slowRequestThreshold: 3000,
    }),
    capturePayload: true, // See what was sent/received
  },
})
```

**Result**:
- ✅ All API calls to `api.myshop.com` (products, cart, orders)
- ✅ All checkout requests (even if successful)
- ✅ Failed payment requests (even if to Stripe/PayPal)
- ✅ Slow requests (>3s anywhere)
- ❌ Google Analytics, Facebook Pixel
- ❌ CDN resources (already in ResourceTiming)
- **Data reduction: ~65%**

#### Example 2: SaaS Dashboard
```javascript
const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  network: {
    sanitizer: createSmartSanitizer({
      // Only capture backend APIs
      ownDomains: ['app.mysaas.com'],
      
      // Specific endpoints
      apiPatterns: [
        '/api/v2/',     // Current API version
        '/graphql',     // GraphQL endpoint
        '/realtime/',   // WebSocket upgrades
      ],
      
      // Ignore internal monitoring
      customFilter: (data) => {
        // Don't capture health checks
        if (data.url.includes('/health')) return false
        if (data.url.includes('/metrics')) return false
        return true
      },
    }),
  },
})
```

#### Example 3: Only Failures (Minimal Data)
```javascript
const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  network: {
    failuresOnly: true, // Built-in option
    // OR use strict preset:
    // sanitizer: SmartSanitizerPresets.strict(),
  },
})
```

**Result**:
- ✅ Only requests with status >= 400
- ❌ Everything else
- **Data reduction: ~80%**

### Performance Impact

| Configuration | Data Size | Debugging | Use Case |
|--------------|-----------|-----------|----------|
| No sanitizer (default) | 100% (18 KB) | ⭐⭐⭐⭐⭐ | Development, detailed analysis |
| `SmartSanitizerPresets.strict()` | 20% (3.6 KB) | ⭐⭐⭐ | Production, minimal data |
| `SmartSanitizerPresets.balanced()` | 40% (7.2 KB) | ⭐⭐⭐⭐ | **Recommended** for production |
| `SmartSanitizerPresets.verbose()` | 60% (10.8 KB) | ⭐⭐⭐⭐⭐ | Heavy debugging needs |
| `failuresOnly: true` | 20% (3.6 KB) | ⭐⭐⭐ | Error-only tracking |

### Best Practices

1. **Start with `balanced` preset**:
   ```javascript
   network: {
     sanitizer: SmartSanitizerPresets.balanced(),
     capturePayload: true,
   }
   ```

2. **Add your API patterns**:
   ```javascript
   sanitizer: createSmartSanitizer({
     apiPatterns: ['/api/', '/backend/', '/graphql'],
   })
   ```

3. **Define your domains**:
   ```javascript
   ownDomains: ['api.myapp.com', 'auth.myapp.com'],
   ```

4. **Test in development with `debug` preset**:
   ```javascript
   network: {
     sanitizer: process.env.NODE_ENV === 'production'
       ? SmartSanitizerPresets.balanced()
       : SmartSanitizerPresets.debug(),
   }
   ```

5. **Monitor data footprint**:
   ```javascript
   // Check in browser console
   tracker.getSessionInfo() // See session size
   ```

---

## �🔥 Advanced Usage

### Session Tokens (Cross-Domain Tracking)

```javascript
// Domain A: Get session token
const tracker = new Tracker({ projectKey: 'KEY_A' })
await tracker.start()
const token = tracker.getSessionToken()

// Pass token to Domain B (via URL param, postMessage, etc.)
window.location.href = `https://domain-b.com?session=${token}`

// Domain B: Resume session
const params = new URLSearchParams(window.location.search)
const tracker = new Tracker({
  projectKey: 'KEY_B',
  sessionToken: params.get('session'),
})
tracker.start()
```

### Conditional Recording

```javascript
const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
})

// Only record for specific users
if (user.plan === 'enterprise' || user.isAdmin) {
  tracker.start({ userID: user.id })
}

// Stop recording on sensitive pages
if (window.location.pathname === '/payment') {
  tracker.stop()
}
```

### Error Boundaries (React)

```jsx
import { Component } from 'react'
import tracker from './tracker' // Your tracker instance

class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    // Report to Sonarly
    tracker.issue(error.message, {
      componentStack: errorInfo.componentStack,
      errorType: 'React Error Boundary',
    })
  }

  render() {
    return this.props.children
  }
}
```

---

## 📊 What Gets Captured?

### Automatically Captured

- ✅ DOM mutations (elements added/removed/modified)
- ✅ User interactions (clicks, inputs, scrolls)
- ✅ Mouse movements and hovers
- ✅ JavaScript errors and exceptions
- ✅ Console logs (log, warn, error)
- ✅ Network requests (fetch, XMLHttpRequest)
- ✅ Web Vitals (LCP, FID, CLS, FCP, TTFB)
- ✅ Page navigation and URL changes
- ✅ Viewport size and device information
- ✅ Rage clicks (3+ rapid clicks)
- ✅ Dead clicks (clicks with no effect)

### Not Captured (Privacy)

- ❌ Password fields (automatically ignored)
- ❌ Credit card numbers (automatically obscured)
- ❌ Elements with `data-sonarly-hidden`
- ❌ Inputs with `data-sonarly-ignore`
- ❌ Browser extensions activity
- ❌ Incognito/Private mode (optional via `respectDoNotTrack`)

---

## 🚀 Performance Impact

- **Bundle Size**: ~45KB gzipped (~120KB raw)
- **Initial Load**: < 10ms
- **Runtime Overhead**: < 1% CPU usage
- **Memory Usage**: ~5-10MB per session
- **Network Usage**: ~50-200KB per minute (compressed)

**Optimization Tips**:
- Use Web Worker (enabled by default)
- Batch network requests (enabled by default)
- Enable compression (enabled by default)
- Use `connAttemptGap` to control upload frequency

---

## 🔒 Security & Compliance

### GDPR Compliance

```javascript
// Check user consent before starting
if (userHasGivenConsent()) {
  tracker.start()
}

// Respect Do Not Track
const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  respectDoNotTrack: true, // Won't track if DNT=1
})
```

### Data Retention

Configure data retention in your Sonarly dashboard:
- Sessions: 30, 60, or 90 days
- Error logs: 1 year
- Analytics: Custom retention

---

## 🐛 Troubleshooting

### Tracker Not Recording

```javascript
// Enable debug mode
const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  __debug_log: true, // Logs to console
})
```

### Network Errors

```javascript
// Check connection
tracker.start().then((session) => {
  if (session.success) {
    console.log('✅ Session started:', session.sessionID)
  } else {
    console.error('❌ Failed to start:', session.error)
  }
})
```

### CORS Issues

Ensure your Sonarly instance allows your domain:
```
Access-Control-Allow-Origin: https://yourdomain.com
```

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🤝 Support

- 📧 Email: support@sonarly.dev
- 🌐 Website: https://sonarly.dev
- 📚 Documentation: https://docs.sonarly.dev
- 🐛 Issues: https://github.com/sonarly/session-replay/issues

---

## 🌟 Why Sonarly?

- ✅ **Open Source** - MIT licensed, community-driven
- ✅ **Privacy-First** - GDPR compliant, data sanitization built-in
- ✅ **Lightweight** - Minimal bundle size and performance impact
- ✅ **Self-Hosted** - Full control over your data
- ✅ **Developer-Friendly** - Easy integration, great DX
- ✅ **Production-Ready** - Battle-tested, enterprise-grade

---

**Made with ❤️ by the Sonarly Team**

