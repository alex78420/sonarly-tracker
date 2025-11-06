# Smart Network Sanitizer Examples

This file demonstrates various configurations for the Smart Network Sanitizer.

**Note**: This is an example file for documentation purposes. Copy the configurations you need into your actual application code.

## How to Use

1. Choose a preset or create custom configuration
2. Copy the relevant code to your app
3. Adjust `apiPatterns` and `ownDomains` for your needs
4. Test in development before deploying

## Verifying Your Configuration

In browser console:
```javascript
// Make test requests and check what gets captured
fetch('/api/users')                                   // ✅ Should be captured
fetch('https://cdn.example.com/app.js')              // ❌ Should be ignored
fetch('https://google-analytics.com/collect')        // ❌ Should be ignored
```

Check your Sonarly dashboard to see only relevant requests.
