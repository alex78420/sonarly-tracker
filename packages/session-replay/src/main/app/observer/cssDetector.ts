/**
 * CSS URL Type Detector
 * 
 * Utility to detect CSS URL type and decide if inlining is needed
 */

/**
 * Check if a CSS URL should be inlined based on its type
 * @param href - The href attribute value from <link>
 * @param currentPageOrigin - The origin of the current page
 * @returns true if CSS should be inlined, false otherwise
 */
export function shouldInlineCSS(href: string, currentPageOrigin: string): boolean {
  if (!href || href.trim() === '') {
    return false;
  }

  const trimmedHref = href.trim();

  // 1. Check for data URLs (already inline)
  if (trimmedHref.startsWith('data:')) {
    return false; // Already inline, no need to process
  }

  // 2. Check for absolute URLs (with protocol)
  if (trimmedHref.startsWith('http://') || trimmedHref.startsWith('https://')) {
    try {
      const cssUrl = new URL(trimmedHref);
      const pageUrl = new URL(currentPageOrigin);
      
      // Cross-origin CSS (different domain) → Always inline
      if (cssUrl.origin !== pageUrl.origin) {
        return true; // CDN or external CSS
      }
      
      // Same origin → Inline to handle relative paths during replay
      return true;
    } catch (e) {
      // Invalid URL → Try to inline anyway
      return true;
    }
  }

  // 3. Check for protocol-relative URLs (//cdn.example.com/...)
  if (trimmedHref.startsWith('//')) {
    try {
      const cssUrl = new URL(`https:${trimmedHref}`);
      const pageUrl = new URL(currentPageOrigin);
      
      // Different domain → Always inline
      if (cssUrl.origin !== pageUrl.origin) {
        return true;
      }
      
      // Same origin → Inline
      return true;
    } catch (e) {
      return true;
    }
  }

  // 4. Relative URLs (css/bootstrap.css, ./style.css, ../assets/main.css)
  // These are the most problematic during replay → ALWAYS inline
  if (
    trimmedHref.startsWith('/') ||   // Absolute path (/css/style.css)
    trimmedHref.startsWith('./') ||  // Relative path (./css/style.css)
    trimmedHref.startsWith('../') || // Parent path (../css/style.css)
    !trimmedHref.includes(':')       // No protocol (css/style.css)
  ) {
    return true; // Local relative CSS → Must inline
  }

  // 5. Other protocols (file:, ftp:, etc.) → Don't inline
  return false;
}

/**
 * Resolve a relative or absolute CSS URL to its full URL
 * @param href - The href attribute value
 * @param baseHref - The base URL of the page
 * @returns Fully resolved URL
 */
export function resolveFullCSSUrl(href: string, baseHref: string): string {
  if (!href) return '';

  const trimmedHref = href.trim();

  // Already absolute with protocol
  if (trimmedHref.startsWith('http://') || trimmedHref.startsWith('https://')) {
    return trimmedHref;
  }

  // Protocol-relative
  if (trimmedHref.startsWith('//')) {
    const protocol = window.location.protocol;
    return `${protocol}${trimmedHref}`;
  }

  // Relative URL → Resolve with baseHref
  try {
    const base = new URL(baseHref, window.location.href);
    const resolved = new URL(trimmedHref, base.href);
    return resolved.href;
  } catch (e) {
    console.warn(`Sonarly: Failed to resolve CSS URL: ${href}`, e);
    return href;
  }
}

/**
 * Get CSS type for logging/debugging
 * @param href - The href attribute value
 * @param currentPageOrigin - The origin of the current page
 * @returns CSS type description
 */
export function getCSSType(href: string, currentPageOrigin: string): string {
  if (!href) return 'empty';

  const trimmedHref = href.trim();

  if (trimmedHref.startsWith('data:')) {
    return 'data-url';
  }

  if (trimmedHref.startsWith('http://') || trimmedHref.startsWith('https://')) {
    try {
      const cssUrl = new URL(trimmedHref);
      const pageUrl = new URL(currentPageOrigin);
      
      if (cssUrl.origin !== pageUrl.origin) {
        return 'external-cdn';
      }
      return 'same-origin-absolute';
    } catch (e) {
      return 'invalid-url';
    }
  }

  if (trimmedHref.startsWith('//')) {
    return 'protocol-relative';
  }

  if (trimmedHref.startsWith('/')) {
    return 'absolute-path';
  }

  if (trimmedHref.startsWith('./') || trimmedHref.startsWith('../')) {
    return 'relative-path';
  }

  return 'local-relative';
}
