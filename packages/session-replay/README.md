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
    sanitizer: (data) => data, // Custom sanitization
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
const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  
  // Custom network sanitizer
  network: {
    sanitizer: (requestData) => {
      // Remove sensitive data
      if (requestData.body) {
        delete requestData.body.password
        delete requestData.body.creditCard
      }
      return requestData
    },
  },
  
  // Obscure patterns
  obscureTextEmails: true, // Masks: user@example.com → u***@e***.com
  obscureTextNumbers: true, // Masks: 1234567890 → **********
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

## 🔥 Advanced Usage

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

