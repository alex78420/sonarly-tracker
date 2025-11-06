# Sonarly Tracker

Session replay and user monitoring SDK for web applications.

[![npm version](https://img.shields.io/npm/v/@sonarly/session-replay.svg)](https://www.npmjs.com/package/@sonarly/session-replay)
[![npm downloads](https://img.shields.io/npm/dm/@sonarly/session-replay.svg)](https://www.npmjs.com/package/@sonarly/session-replay)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Packages

This monorepo contains the following npm packages:

### @sonarly/session-replay

[![npm version](https://badge.fury.io/js/@sonarly%2Fsession-replay.svg)](https://www.npmjs.com/package/@sonarly/session-replay)

**Session replay, error tracking, and user monitoring**

```bash
npm install @sonarly/session-replay
```

[Documentation](./packages/session-replay/README.md) | [npm](https://www.npmjs.com/package/@sonarly/session-replay)

### @sonarly/network-proxy

[![npm version](https://badge.fury.io/js/@sonarly%2Fnetwork-proxy.svg)](https://www.npmjs.com/package/@sonarly/network-proxy)

**Network monitoring** - Intercept and log network requests (fetch, XHR)

```bash
npm install @sonarly/network-proxy
```

[Documentation](./packages/network-proxy/README.md) | [npm](https://www.npmjs.com/package/@sonarly/network-proxy)

---

## Quick Start

```javascript
import Tracker from '@sonarly/session-replay'

const tracker = new Tracker({
  projectKey: 'YOUR_PROJECT_KEY',
  ingestPoint: 'https://api.sonarly.dev/ingest',
})

tracker.start({
  userID: 'user@example.com',
})
```

## Features

- **Session Replay** - Record and replay user sessions with DOM reconstruction
- **Error Tracking** - Automatic JavaScript exception detection and stack traces
- **Performance Monitoring** - Track Web Vitals (LCP, FID, CLS, FCP, TTFB)
- **Rage Clicks Detection** - Identify user frustration patterns
- **Dead Clicks Detection** - Find clicks that lead nowhere
- **User Behavior Analytics** - Mouse movements, clicks, scrolls
- **Mobile-Friendly** - Works on all devices and screen sizes
- **Lightweight** - Less than 50KB gzipped, minimal performance impact
- **Privacy-First** - Built-in data sanitization and PII protection

## Documentation

- **Main Package**: [Session Replay Docs](./packages/session-replay/README.md)
- **Network Proxy**: [Network Proxy Docs](./packages/network-proxy/README.md)
- **Website**: https://sonarly.dev
- **Support**: support@sonarly.dev

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

---

**Made with love by the Sonarly Team**
