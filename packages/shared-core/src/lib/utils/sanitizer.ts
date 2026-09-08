/**
 * Canonical product description and rich-text HTML sanitizer.
 * Implements a strict whitelist policy without external runtime dependencies.
 * Runs in SSR (Node.js), JSDOM test environments, and client-side browser DOM.
 */

export const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'a', 'img', 'span', 'div', 'hr', 'sub', 'sup'
]);

export const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link']);

export const DANGEROUS_TAGS_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'form', 'svg', 'math', 'noscript', 'template'
]);

export const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel', 'class']),
  img: new Set(['src', 'alt', 'title', 'width', 'height', 'loading', 'class']),
  '*': new Set(['class', 'id', 'title']),
};

export const PRODUCT_DESCRIPTION_SANITIZE_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTRS,
  VOID_TAGS,
  DANGEROUS_TAGS_WITH_CONTENT,
};


const SAFE_PROTOCOL_REGEX = /^(?:https?|mailto|tel):/i;

/**
 * Validates whether a URL is safe (http, https, mailto, tel, or relative root/path).
 * Explicitly rejects javascript:, data:, vbscript:, and control characters.
 */
function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().replace(/[\x00-\x20\x7F-\x9F\u200B-\u200D\uFEFF]/g, '');
  if (/^(?:javascript|vbscript|data):/i.test(trimmed)) {
    return false;
  }
  if (SAFE_PROTOCOL_REGEX.test(trimmed)) {
    return true;
  }
  // Relative URL (starts with /, ./, ../ or path characters without colon before slash)
  if (/^(?:\/|\.\/|\.\.\/|[a-zA-Z0-9_\-.~%]+\/)/.test(trimmed) && !trimmed.includes(':')) {
    return true;
  }
  return false;
}

/**
 * Escapes HTML special characters for text and attributes.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes untrusted user/vendor HTML before it reaches any DOM sink.
 *
 * @param dirty - Untrusted input string (can be null or undefined)
 * @returns Clean, safe HTML string
 */
export function sanitizeProductHtml(dirty: string | null | undefined): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // Fast path for plain text without any HTML tags
  if (!dirty.includes('<') && !dirty.includes('>')) {
    return dirty;
  }

  // 1. Remove dangerous elements and their complete inner contents (<script>...</script>, <iframe>...</iframe>, etc.)
  let cleaned = dirty;
  for (const tag of DANGEROUS_TAGS_WITH_CONTENT) {
    const regex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>|<${tag}\\b[^>]*\\/?>`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }

  // 2. Remove HTML comments (which can conceal polyglots)
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // 3. Tokenize and parse tags
  const tagRegex = /<\/?([a-zA-Z0-9\-]+)((?:\s+[^'">\s]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^>\s]+))?)*)\s*(\/?)>/g;
  const openTagsStack: string[] = [];
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(cleaned)) !== null) {
    const matchIndex = match.index;
    const fullTag = match[0];
    const rawTagName = match[1];
    const rawAttrs = match[2];
    const isSelfClosing = fullTag.startsWith('</') ? false : fullTag.endsWith('/>') || match[3] === '/';
    const isClosing = fullTag.startsWith('</');
    const tagName = rawTagName.toLowerCase();

    // Append text between previous tag and current tag
    if (matchIndex > lastIndex) {
      result += cleaned.substring(lastIndex, matchIndex);
    }
    lastIndex = tagRegex.lastIndex;

    // Check if tag is in allowed whitelist
    if (!ALLOWED_TAGS.has(tagName)) {
      continue;
    }

    if (isClosing) {
      if (VOID_TAGS.has(tagName)) {
        continue;
      }
      // Check if closing tag matches an opened tag
      const lastOpenIndex = openTagsStack.lastIndexOf(tagName);
      if (lastOpenIndex !== -1) {
        // Close any intermediate tags
        while (openTagsStack.length > lastOpenIndex) {
          const closedTag = openTagsStack.pop()!;
          result += `</${closedTag}>`;
        }
      }
      continue;
    }

    // Process opening tag and attributes
    const allowedAttrsForTag = ALLOWED_ATTRS[tagName] || new Set();
    const globalAllowedAttrs = ALLOWED_ATTRS['*'];
    const sanitizedAttrs: string[] = [];

    // Parse attributes
    const attrRegex = /([a-zA-Z0-9\-:_]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
    let attrMatch: RegExpExecArray | null;

    let hasTarget = false;
    let hasRel = false;

    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

      // Block all event handlers (on*)
      if (attrName.startsWith('on')) {
        continue;
      }

      // Check attribute whitelist
      if (!allowedAttrsForTag.has(attrName) && !globalAllowedAttrs.has(attrName)) {
        continue;
      }

      // Validate URL attributes
      if (attrName === 'href' || attrName === 'src') {
        if (!isSafeUrl(attrValue)) {
          continue;
        }
      }

      if (attrName === 'target') {
        hasTarget = true;
        sanitizedAttrs.push('target="_blank"');
        continue;
      }

      if (attrName === 'rel') {
        hasRel = true;
        sanitizedAttrs.push('rel="noopener noreferrer"');
        continue;
      }

      sanitizedAttrs.push(`${attrName}="${escapeHtml(attrValue)}"`);
    }

    // For external hyperlinks, automatically add target="_blank" and rel="noopener noreferrer"
    if (tagName === 'a') {
      if (!hasTarget) {
        sanitizedAttrs.push('target="_blank"');
      }
      if (!hasRel) {
        sanitizedAttrs.push('rel="noopener noreferrer"');
      }
    }

    const attrString = sanitizedAttrs.length > 0 ? ` ${sanitizedAttrs.join(' ')}` : '';

    if (VOID_TAGS.has(tagName) || isSelfClosing) {
      result += `<${tagName}${attrString} />`;
    } else {
      result += `<${tagName}${attrString}>`;
      openTagsStack.push(tagName);
    }
  }

  // Append remaining text after last tag
  if (lastIndex < cleaned.length) {
    result += cleaned.substring(lastIndex);
  }

  // Close any unclosed tags
  while (openTagsStack.length > 0) {
    const unclosedTag = openTagsStack.pop()!;
    result += `</${unclosedTag}>`;
  }

  return result;
}
